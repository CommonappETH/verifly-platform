import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createApp } from "../app";
import { createTestHarness, type TestHarness } from "../testing/harness";

interface Session {
  sid?: string;
  csrf?: string;
}

function parseSetCookies(res: Response): Record<string, { value: string; attrs: string }> {
  const out: Record<string, { value: string; attrs: string }> = {};
  const headers: string[] = [];
  const anyRes = res as unknown as { headers: Headers & { getSetCookie?: () => string[] } };
  const maybe = anyRes.headers.getSetCookie?.();
  if (maybe && maybe.length) {
    headers.push(...maybe);
  } else {
    const combined = res.headers.get("set-cookie");
    if (combined) headers.push(...combined.split(/,(?=[^ ]+=)/));
  }
  for (const line of headers) {
    const [pair, ...attrs] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    out[name] = { value, attrs: attrs.join(";") };
  }
  return out;
}

function cookieHeader(session: Session): string {
  return Object.entries(session)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k === "sid" ? "sid" : "csrf"}=${v}`)
    .join("; ");
}

function json(
  path: string,
  method: string,
  body: unknown,
  session?: Session,
): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (session) {
    const cookie = cookieHeader(session);
    if (cookie) headers.cookie = cookie;
    if (session.csrf) headers["x-csrf-token"] = session.csrf;
  }
  return new Request(`http://local${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

function get(path: string, session: Session): Request {
  return new Request(`http://local${path}`, {
    headers: { cookie: cookieHeader(session) },
  });
}

async function registerAndLogin(
  app: ReturnType<typeof createApp>,
  email: string,
  role: string,
  name: string,
): Promise<{ userId: string; session: Session }> {
  await app.request(
    json("/auth/register", "POST", { email, password: "correct-horse-battery", role, name }),
  );
  const login = await app.request(
    json("/auth/login", "POST", { email, password: "correct-horse-battery" }),
  );
  const cookies = parseSetCookies(login);
  const body = (await login.json()) as { user: { id: string } };
  return {
    userId: body.user.id,
    session: { sid: cookies.sid!.value, csrf: cookies.csrf!.value },
  };
}

describe("Phase 8 — local object storage smoke test", () => {
  let h: TestHarness;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    h = createTestHarness();
    app = createApp({
      env: "test",
      createCtx: ({ requestId }) => ({
        ...h.ctx,
        requestId,
        secrets: {
          get(name: string) {
            if (name === "SESSION_PEPPER") return "test-pepper-1234567890-abcd";
            if (name === "STORAGE_DIR") return join(h.dir, "storage");
            return "x";
          },
        },
      }),
    });
  });
  afterEach(() => h.cleanup());

  test("create doc → PUT signed URL → complete → GET signed URL → verify bytes match", async () => {
    const student = await registerAndLogin(app, "store@test.com", "student", "Store Tester");

    // 1. Create document metadata — returns a presigned upload URL
    const createRes = await app.request(
      json("/documents", "POST", {
        kind: "transcript",
        fileName: "test.pdf",
        mimeType: "application/pdf",
        sizeBytes: 256,
      }, student.session),
    );
    expect(createRes.status).toBe(201);
    const createBody = (await createRes.json()) as {
      data: { id: string; uploadUrl: string; uploadHeaders: Record<string, string> };
    };
    const documentId = createBody.data.id;
    const uploadUrl = createBody.data.uploadUrl;
    const uploadHeaders = createBody.data.uploadHeaders;
    expect(uploadUrl).toContain("/storage/");
    expect(uploadUrl).toContain("sig=");
    expect(uploadUrl).toContain("exp=");

    // 2. PUT to the signed upload URL (write bytes to disk)
    const fileContent = Buffer.alloc(256, 0xAB);
    const parsed = new URL(uploadUrl);
    const uploadPath = parsed.pathname + parsed.search;
    const putRes = await app.request(
      new Request(`http://local${uploadPath}`, {
        method: "PUT",
        headers: {
          "content-type": uploadHeaders["Content-Type"],
          "x-verifly-max-bytes": uploadHeaders["X-Verifly-Max-Bytes"],
        },
        body: fileContent,
      }),
    );
    expect(putRes.status).toBe(200);
    const putBody = (await putRes.json()) as { ok: boolean };
    expect(putBody.ok).toBe(true);

    // 3. Complete the upload
    const completeRes = await app.request(
      json(`/documents/${documentId}/complete`, "POST", {}, student.session),
    );
    expect(completeRes.status).toBe(200);
    const completeBody = (await completeRes.json()) as { data: { status: string } };
    expect(completeBody.data.status).toBe("uploaded");

    // 4. GET document to obtain the download URL
    const getDocRes = await app.request(get(`/documents/${documentId}`, student.session));
    expect(getDocRes.status).toBe(200);
    const getDocBody = (await getDocRes.json()) as {
      data: { downloadUrl: string; status: string };
    };
    expect(getDocBody.data.downloadUrl).toContain("/storage/");
    expect(getDocBody.data.status).toBe("uploaded");

    // 5. GET from the signed download URL — verify bytes match
    const downloadUrl = getDocBody.data.downloadUrl;
    const dlParsed = new URL(downloadUrl);
    const downloadPath = dlParsed.pathname + dlParsed.search;
    const getRes = await app.request(
      new Request(`http://local${downloadPath}`, { method: "GET" }),
    );
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get("content-type")).toBe("application/pdf");

    const downloaded = Buffer.from(await getRes.arrayBuffer());
    expect(downloaded.length).toBe(256);
    expect(downloaded.equals(fileContent)).toBe(true);
  });

  test("PUT with tampered signature returns 403", async () => {
    const student = await registerAndLogin(app, "tamper@test.com", "student", "Tamper Tester");

    const createRes = await app.request(
      json("/documents", "POST", {
        kind: "transcript",
        fileName: "bad.pdf",
        mimeType: "application/pdf",
        sizeBytes: 128,
      }, student.session),
    );
    const createBody = (await createRes.json()) as {
      data: { uploadUrl: string; uploadHeaders: Record<string, string> };
    };

    const url = new URL(createBody.data.uploadUrl);
    url.searchParams.set("sig", "deadbeef".repeat(8));
    const tamperedPath = url.pathname + url.search;

    const putRes = await app.request(
      new Request(`http://local${tamperedPath}`, {
        method: "PUT",
        headers: {
          "content-type": createBody.data.uploadHeaders["Content-Type"],
          "x-verifly-max-bytes": createBody.data.uploadHeaders["X-Verifly-Max-Bytes"],
        },
        body: Buffer.alloc(128),
      }),
    );
    expect(putRes.status).toBe(403);
  });

  test("PUT exceeding max bytes returns 400", async () => {
    const student = await registerAndLogin(app, "oversize@test.com", "student", "Over Tester");

    const createRes = await app.request(
      json("/documents", "POST", {
        kind: "transcript",
        fileName: "big.pdf",
        mimeType: "application/pdf",
        sizeBytes: 64,
      }, student.session),
    );
    const createBody = (await createRes.json()) as {
      data: { uploadUrl: string; uploadHeaders: Record<string, string> };
    };
    const uploadUrl = createBody.data.uploadUrl;
    const parsedUrl = new URL(uploadUrl);
    const uploadPath = parsedUrl.pathname + parsedUrl.search;

    const putRes = await app.request(
      new Request(`http://local${uploadPath}`, {
        method: "PUT",
        headers: {
          "content-type": createBody.data.uploadHeaders["Content-Type"],
          "x-verifly-max-bytes": createBody.data.uploadHeaders["X-Verifly-Max-Bytes"],
        },
        body: Buffer.alloc(128),
      }),
    );
    expect(putRes.status).toBe(400);
  });

  test("GET with expired signature returns 403", async () => {
    const student = await registerAndLogin(app, "expired@test.com", "student", "Expired Tester");

    const createRes = await app.request(
      json("/documents", "POST", {
        kind: "transcript",
        fileName: "expire.pdf",
        mimeType: "application/pdf",
        sizeBytes: 64,
      }, student.session),
    );
    const createBody = (await createRes.json()) as { data: { id: string } };
    const documentId = createBody.data.id;

    const getDocRes = await app.request(get(`/documents/${documentId}`, student.session));
    const getDocBody = (await getDocRes.json()) as { data: { downloadUrl: string } };

    // Advance time past the expiry (1 hour + buffer)
    h.advance(2 * 60 * 60 * 1000);

    const downloadUrl = getDocBody.data.downloadUrl;
    const dlUrl = new URL(downloadUrl);
    const downloadPath = dlUrl.pathname + dlUrl.search;
    const getRes = await app.request(
      new Request(`http://local${downloadPath}`, { method: "GET" }),
    );
    expect(getRes.status).toBe(403);
  });
});
