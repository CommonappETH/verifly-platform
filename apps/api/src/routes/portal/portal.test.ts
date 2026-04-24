import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { nanoid } from "nanoid";

import { createApp } from "../../app";
import { bankUsers, universityUsers } from "../../db/schema";
import { createTestHarness, type TestHarness } from "../../testing/harness";

interface Session {
  sid?: string;
  csrf?: string;
}

function parseSetCookies(res: Response): Record<string, { value: string }> {
  const out: Record<string, { value: string }> = {};
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
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    out[pair.slice(0, eq).trim()] = { value: pair.slice(eq + 1).trim() };
  }
  return out;
}

function cookieHeader(session: Session): string {
  return Object.entries(session)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function jsonReq(path: string, method: string, body: unknown, session?: Session): Request {
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

function getReq(path: string, session: Session): Request {
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
    jsonReq("/auth/register", "POST", { email, password: "correct-horse-battery", role, name }),
  );
  const login = await app.request(
    jsonReq("/auth/login", "POST", { email, password: "correct-horse-battery" }),
  );
  const cookies = parseSetCookies(login);
  const body = (await login.json()) as { user: { id: string } };
  return {
    userId: body.user.id,
    session: { sid: cookies.sid!.value, csrf: cookies.csrf!.value },
  };
}

describe("Phase 9 portal dashboards", () => {
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

  test("each role's dashboard returns its scoped aggregate", async () => {
    const admin = await registerAndLogin(app, "admin@verifly.test", "admin", "Admin");

    const uniRes = await app.request(
      jsonReq(
        "/organizations",
        "POST",
        { kind: "university", name: "ETH", slug: "eth", country: "CH" },
        admin.session,
      ),
    );
    const universityId = ((await uniRes.json()) as { data: { id: string } }).data.id;

    const bankRes = await app.request(
      jsonReq(
        "/organizations",
        "POST",
        { kind: "bank", name: "UBS", slug: "ubs", country: "CH" },
        admin.session,
      ),
    );
    const bankOrgId = ((await bankRes.json()) as { data: { id: string } }).data.id;

    const student = await registerAndLogin(app, "s1@example.com", "student", "Stu One");
    await app.request(
      jsonReq(
        "/students",
        "POST",
        { firstName: "Stu", lastName: "One", fullName: "Stu One" },
        student.session,
      ),
    );
    const appCreate = await app.request(
      jsonReq(
        "/applications",
        "POST",
        { universityId, program: "CS" },
        student.session,
      ),
    );
    const applicationId = ((await appCreate.json()) as { data: { id: string } }).data.id;
    await app.request(
      jsonReq(
        `/applications/${applicationId}`,
        "PATCH",
        { status: "submitted" },
        student.session,
      ),
    );

    const verRes = await app.request(
      jsonReq(
        "/verifications",
        "POST",
        { applicationId, bankId: bankOrgId, requestedAmount: 1000, currency: "USD" },
        student.session,
      ),
    );
    const verificationId = ((await verRes.json()) as { data: { id: string } }).data.id;
    await app.request(
      jsonReq(`/verifications/${verificationId}/submit`, "POST", {}, student.session),
    );

    // Wire a bank user to the bank org
    const bank = await registerAndLogin(app, "bank@ubs.test", "bank", "Banker");
    await h.ctx.db.handle().insert(bankUsers).values({
      id: nanoid(),
      userId: bank.userId,
      bankId: bankOrgId,
      createdAt: h.ctx.clock.now(),
      updatedAt: h.ctx.clock.now(),
    });

    // Wire a university user to the university org
    const univ = await registerAndLogin(app, "admissions@eth.test", "university", "Admissions");
    await h.ctx.db.handle().insert(universityUsers).values({
      id: nanoid(),
      userId: univ.userId,
      universityId,
      title: "Officer",
      createdAt: h.ctx.clock.now(),
      updatedAt: h.ctx.clock.now(),
    });

    // Bank decides (creates decidedAt history for median calc)
    h.advance(5 * 60 * 1000);
    await app.request(
      jsonReq(
        `/verifications/${verificationId}/decision`,
        "PATCH",
        { decision: "verified", verifiedAmount: 1000 },
        bank.session,
      ),
    );

    // ── student dashboard ──
    const studentDash = await app.request(getReq("/portal/student/dashboard", student.session));
    expect(studentDash.status).toBe(200);
    const sBody = (await studentDash.json()) as {
      data: {
        counts: { activeApplications: number; pendingVerifications: number; outstandingDocuments: number };
        recentAudit: unknown[];
      };
    };
    expect(sBody.data.counts.activeApplications).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(sBody.data.recentAudit)).toBe(true);

    // ── university dashboard ──
    const uniDash = await app.request(getReq("/portal/university/dashboard", univ.session));
    expect(uniDash.status).toBe(200);
    const uBody = (await uniDash.json()) as {
      data: {
        applicationsByStatus: Record<string, number>;
        recentSubmissions: Array<{ id: string }>;
        verificationsPendingReview: number;
      };
    };
    expect(uBody.data.applicationsByStatus.submitted).toBe(1);
    expect(uBody.data.recentSubmissions.length).toBe(1);

    // ── bank dashboard ──
    const bankDash = await app.request(getReq("/portal/bank/dashboard", bank.session));
    expect(bankDash.status).toBe(200);
    const bBody = (await bankDash.json()) as {
      data: {
        counts: { pending: number; underReview: number };
        recentDecisions: Array<{ id: string; status: string }>;
        medianTimeToDecisionMs: number | null;
      };
    };
    expect(bBody.data.recentDecisions.length).toBe(1);
    expect(bBody.data.recentDecisions[0].status).toBe("verified");
    expect(bBody.data.medianTimeToDecisionMs).toBe(5 * 60 * 1000);

    // ── counselor dashboard ──
    const counselor = await registerAndLogin(app, "c@school.test", "counselor", "Counselor");
    const counselorDash = await app.request(
      getReq("/portal/counselor/dashboard", counselor.session),
    );
    expect(counselorDash.status).toBe(200);
    const cBody = (await counselorDash.json()) as {
      data: { students: Array<{ studentId: string; applicationCount: number; latestStatus: string | null }> };
    };
    expect(cBody.data.students.length).toBeGreaterThanOrEqual(1);
    const matched = cBody.data.students.find((s) => s.applicationCount >= 1);
    expect(matched?.latestStatus).toBe("submitted");

    // ── admin dashboard ──
    const adminDash = await app.request(getReq("/portal/admin/dashboard", admin.session));
    expect(adminDash.status).toBe(200);
    const aBody = (await adminDash.json()) as {
      data: {
        usersByRole: Record<string, number>;
        applicationsByStatus: Record<string, number>;
        verificationsByStatus: Record<string, number>;
        errorRateLast24h: number | null;
      };
    };
    expect(aBody.data.usersByRole.admin).toBe(1);
    expect(aBody.data.usersByRole.student).toBe(1);
    expect(aBody.data.applicationsByStatus.submitted).toBe(1);
    expect(aBody.data.verificationsByStatus.verified).toBe(1);
    expect(aBody.data.errorRateLast24h).toBeNull();

    // ── RBAC: student cannot access admin dashboard ──
    const forbid = await app.request(getReq("/portal/admin/dashboard", student.session));
    expect(forbid.status).toBe(403);
  }, 30_000);
});
