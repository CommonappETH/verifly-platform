import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

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

describe("Phase 7 golden path", () => {
  let h: TestHarness;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    h = createTestHarness();
    app = createApp({
      env: "test",
      createCtx: ({ requestId }) => ({ ...h.ctx, requestId }),
    });
  });
  afterEach(() => h.cleanup());

  test("student signup → profile → application → verification → decision → document", async () => {
    // ── 1. Register & login as admin to create an organization ──
    const admin = await registerAndLogin(app, "admin@verifly.test", "admin", "Admin");

    const orgRes = await app.request(
      json("/organizations", "POST", { kind: "university", name: "ETH Zurich", slug: "eth-zurich", country: "CH" }, admin.session),
    );
    expect(orgRes.status).toBe(201);
    const orgBody = (await orgRes.json()) as { data: { id: string } };
    const universityId = orgBody.data.id;

    // Create a bank org for verification
    const bankOrgRes = await app.request(
      json("/organizations", "POST", { kind: "bank", name: "UBS", slug: "ubs", country: "CH" }, admin.session),
    );
    expect(bankOrgRes.status).toBe(201);
    const bankOrgBody = (await bankOrgRes.json()) as { data: { id: string } };
    const bankOrgId = bankOrgBody.data.id;

    // ── 2. Register & login as student ──
    const student = await registerAndLogin(app, "student@example.com", "student", "Alice Student");

    // ── 3. Create student profile ──
    const profileRes = await app.request(
      json("/students", "POST", {
        firstName: "Alice",
        lastName: "Student",
        fullName: "Alice Student",
        country: "US",
        nationality: "US",
        gpa: 3.9,
      }, student.session),
    );
    expect(profileRes.status).toBe(201);
    const profileBody = (await profileRes.json()) as { data: { id: string } };
    const studentId = profileBody.data.id;

    // ── 3b. Duplicate profile → 409 ──
    const dupProfile = await app.request(
      json("/students", "POST", { firstName: "Dup" }, student.session),
    );
    expect(dupProfile.status).toBe(409);

    // ── 3c. GET student profile ──
    const getProfile = await app.request(get(`/students/${studentId}`, student.session));
    expect(getProfile.status).toBe(200);
    const getProfileBody = (await getProfile.json()) as { data: { firstName: string } };
    expect(getProfileBody.data.firstName).toBe("Alice");

    // ── 3d. Add a guardian ──
    const guardianRes = await app.request(
      json(`/students/${studentId}/guardians`, "POST", {
        fullName: "Bob Parent",
        relationship: "father",
        email: "bob@example.com",
      }, student.session),
    );
    expect(guardianRes.status).toBe(201);
    const guardianBody = (await guardianRes.json()) as { data: { id: string } };
    const guardianId = guardianBody.data.id;

    // ── 3e. List guardians ──
    const listGuardians = await app.request(get(`/students/${studentId}/guardians`, student.session));
    expect(listGuardians.status).toBe(200);
    const guardiansBody = (await listGuardians.json()) as { data: Array<{ id: string }> };
    expect(guardiansBody.data.length).toBe(1);

    // ── 4. GET /users/me with profile ──
    const meRes = await app.request(get("/users/me", student.session));
    expect(meRes.status).toBe(200);
    const meBody = (await meRes.json()) as { data: { profileType: string; user: { email: string } } };
    expect(meBody.data.profileType).toBe("student");
    expect(meBody.data.user.email).toBe("student@example.com");

    // ── 5. Create application ──
    const appRes = await app.request(
      json("/applications", "POST", { universityId, program: "Computer Science" }, student.session),
    );
    expect(appRes.status).toBe(201);
    const appBody = (await appRes.json()) as { data: { id: string; status: string } };
    const applicationId = appBody.data.id;
    expect(appBody.data.status).toBe("draft");

    // ── 5b. Student submits application (draft → submitted) ──
    const submitApp = await app.request(
      json(`/applications/${applicationId}`, "PATCH", { status: "submitted" }, student.session),
    );
    expect(submitApp.status).toBe(200);
    const submittedBody = (await submitApp.json()) as { data: { status: string } };
    expect(submittedBody.data.status).toBe("submitted");

    // ── 5c. Invalid transition by student → 409 ──
    const badTransition = await app.request(
      json(`/applications/${applicationId}`, "PATCH", { status: "under_review" }, student.session),
    );
    expect(badTransition.status).toBe(409);

    // ── 5d. GET application ──
    const getApp = await app.request(get(`/applications/${applicationId}`, student.session));
    expect(getApp.status).toBe(200);

    // ── 5e. List applications (student sees own) ──
    const listApps = await app.request(get("/applications", student.session));
    expect(listApps.status).toBe(200);
    const listAppsBody = (await listApps.json()) as { data: Array<{ id: string }> };
    expect(listAppsBody.data.length).toBe(1);

    // ── 6. Create verification ──
    const verRes = await app.request(
      json("/verifications", "POST", {
        applicationId,
        bankId: bankOrgId,
        guardianId,
        requestedAmount: 5000000,
        currency: "USD",
      }, student.session),
    );
    expect(verRes.status).toBe(201);
    const verBody = (await verRes.json()) as { data: { id: string; code: string; status: string } };
    const verificationId = verBody.data.id;
    expect(verBody.data.status).toBe("pending_submission");
    expect(verBody.data.code).toMatch(/^VF-[A-Z0-9]{4}$/);

    // ── 6b. Submit verification (pending_submission → pending) ──
    const submitVer = await app.request(
      json(`/verifications/${verificationId}/submit`, "POST", {}, student.session),
    );
    expect(submitVer.status).toBe(200);
    const submitVerBody = (await submitVer.json()) as { data: { status: string } };
    expect(submitVerBody.data.status).toBe("pending");

    // ── 6c. Register bank user & decide ──
    const bankUser = await registerAndLogin(app, "banker@ubs.test", "bank", "Banker");

    // Wire bank user to the bank org (direct DB insert via ctx for test setup)
    const { nanoid } = await import("nanoid");
    const { bankUsers } = await import("../db/schema");
    await h.ctx.db.handle().insert(bankUsers).values({
      id: nanoid(),
      userId: bankUser.userId,
      bankId: bankOrgId,
      createdAt: h.ctx.clock.now(),
      updatedAt: h.ctx.clock.now(),
    });

    // ── 6d. Bank looks up by code ──
    const lookupRes = await app.request(
      get(`/verifications/lookup/${verBody.data.code}`, bankUser.session),
    );
    expect(lookupRes.status).toBe(200);

    // ── 6e. Bank decides → verified ──
    const decideRes = await app.request(
      json(`/verifications/${verificationId}/decision`, "PATCH", {
        decision: "verified",
        verifiedAmount: 5000000,
      }, bankUser.session),
    );
    expect(decideRes.status).toBe(200);
    const decideBody = (await decideRes.json()) as { data: { status: string; verifiedAmount: number } };
    expect(decideBody.data.status).toBe("verified");
    expect(decideBody.data.verifiedAmount).toBe(5000000);

    // ── 7. Document upload flow ──
    const docRes = await app.request(
      json("/documents", "POST", {
        kind: "transcript",
        fileName: "transcript.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        applicationId,
      }, student.session),
    );
    expect(docRes.status).toBe(201);
    const docBody = (await docRes.json()) as { data: { id: string; uploadUrl: string } };
    const documentId = docBody.data.id;
    expect(docBody.data.uploadUrl).toContain("/storage/");

    // Simulate the file landing on disk so head() succeeds
    const doc = await h.ctx.db.handle()
      .select()
      .from((await import("../db/schema")).documents)
      .where((await import("drizzle-orm")).eq((await import("../db/schema")).documents.id, documentId))
      .limit(1);
    const storageKey = doc[0].storageKey;
    const filePath = join(h.dir, "storage", storageKey);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, Buffer.alloc(1024));

    // ── 7b. Complete upload ──
    const completeRes = await app.request(
      json(`/documents/${documentId}/complete`, "POST", {}, student.session),
    );
    expect(completeRes.status).toBe(200);
    const completeBody = (await completeRes.json()) as { data: { status: string } };
    expect(completeBody.data.status).toBe("uploaded");

    // ── 7c. Get document with download URL ──
    const getDoc = await app.request(get(`/documents/${documentId}`, student.session));
    expect(getDoc.status).toBe(200);
    const getDocBody = (await getDoc.json()) as { data: { downloadUrl: string; status: string } };
    expect(getDocBody.data.downloadUrl).toContain("/storage/");
    expect(getDocBody.data.status).toBe("uploaded");

    // ── 7d. Admin reviews document ──
    const reviewRes = await app.request(
      json(`/documents/${documentId}/review`, "PATCH", { status: "approved" }, admin.session),
    );
    expect(reviewRes.status).toBe(200);
    const reviewBody = (await reviewRes.json()) as { data: { status: string } };
    expect(reviewBody.data.status).toBe("approved");

    // ── 8. Audit log has entries ──
    const auditRes = await app.request(get("/audit?entityType=application", admin.session));
    expect(auditRes.status).toBe(200);
    const auditBody = (await auditRes.json()) as { data: Array<{ action: string }> };
    expect(auditBody.data.length).toBeGreaterThan(0);
  }, 30_000);
});
