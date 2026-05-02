import { describe, expect, test } from "bun:test";

import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  DECISION_LABEL,
  avatarColorFor,
  decisionFromStatus,
  displayName,
  initialsFor,
  mapApplicantDetail,
  mapApplicationRow,
  type WireApplication,
} from "./mappers";

const baseApp: WireApplication = {
  id: "seed-app-3",
  studentId: "seed-s-bob",
  universityId: "seed-o-eth",
  program: "Mechanical Engineering",
  status: "under_review",
  verificationStatus: null,
  documentStatus: null,
  decisionStatus: null,
  applicantType: "normal",
  submittedAt: 1_700_000_000_000,
  updatedAt: 1_700_000_500_000,
};

describe("mapApplicationRow", () => {
  test("populates all fields from application + student", () => {
    const row = mapApplicationRow(baseApp, {
      id: "seed-s-bob",
      firstName: "Bob",
      lastName: "Brown",
      fullName: "Bob Brown",
      country: "DE",
      gpa: 3.6,
    });
    expect(row.applicationId).toBe("seed-app-3");
    expect(row.studentId).toBe("seed-s-bob");
    expect(row.name).toBe("Bob Brown");
    expect(row.initials).toBe("BB");
    expect(row.country).toBe("DE");
    expect(row.gpa).toBe(3.6);
    expect(row.program).toBe("Mechanical Engineering");
    expect(row.status).toBe("under_review");
    expect(row.submittedAt).toBe(1_700_000_000_000);
  });

  test("falls back to id when student missing", () => {
    const row = mapApplicationRow(baseApp);
    expect(row.name).toBe("seed-app-3");
    expect(row.country).toBeNull();
    expect(row.gpa).toBeNull();
  });

  test("coerces string gpa to number", () => {
    const row = mapApplicationRow(baseApp, {
      id: "seed-s-bob",
      gpa: "3.6" as unknown as number,
    });
    expect(row.gpa).toBe(3.6);
  });
});

describe("mapApplicantDetail", () => {
  test("layers user email + nationality + intendedStudy on top", () => {
    const detail = mapApplicantDetail(
      baseApp,
      {
        id: "seed-s-bob",
        firstName: "Bob",
        lastName: "Brown",
        fullName: "Bob Brown",
        country: "DE",
        nationality: "DE",
        intendedStudy: "Aerospace",
      },
      { id: "seed-u-stu-bob", email: "bob@example.com", role: "student", name: "Bob Brown" },
    );
    expect(detail.email).toBe("bob@example.com");
    expect(detail.nationality).toBe("DE");
    expect(detail.intendedStudy).toBe("Aerospace");
  });

  test("nulls when student/user are absent", () => {
    const detail = mapApplicantDetail(baseApp);
    expect(detail.email).toBeNull();
    expect(detail.nationality).toBeNull();
    expect(detail.intendedStudy).toBeNull();
  });
});

describe("decisionFromStatus", () => {
  test.each([
    ["admitted", "admit"],
    ["conditionally_admitted", "conditional_admit"],
    ["waitlisted", "waitlist"],
    ["rejected", "reject"],
    ["draft", "pending"],
    ["submitted", "pending"],
    ["under_review", "pending"],
  ] as const)("%s → %s", (status, expected) => {
    expect(decisionFromStatus(status)).toBe(expected);
  });
});

describe("display helpers", () => {
  test("initialsFor", () => {
    expect(initialsFor("Bob Brown")).toBe("BB");
    expect(initialsFor("Single")).toBe("S");
    expect(initialsFor("")).toBe("?");
    expect(initialsFor(null)).toBe("?");
    expect(initialsFor("Three Word Name")).toBe("TW");
  });

  test("displayName prefers fullName, falls back through firstName/lastName, then to fallback, then to id", () => {
    expect(displayName({ id: "x", fullName: "Full Name" })).toBe("Full Name");
    expect(displayName({ id: "x", firstName: "F", lastName: "L" })).toBe("F L");
    expect(displayName({ id: "x" }, "fallback")).toBe("fallback");
    expect(displayName({ id: "x" })).toBe("x");
    expect(displayName(undefined, "fallback")).toBe("fallback");
  });

  test("avatarColorFor is deterministic for the same seed", () => {
    expect(avatarColorFor("seed-s-bob")).toBe(avatarColorFor("seed-s-bob"));
  });
});

describe("status records cover every backend status", () => {
  const STATUSES = [
    "draft",
    "submitted",
    "under_review",
    "awaiting_info",
    "awaiting_verification",
    "committee_review",
    "conditionally_admitted",
    "admitted",
    "rejected",
    "waitlisted",
  ] as const;

  test("APPLICATION_STATUS_LABEL has every status", () => {
    for (const s of STATUSES) expect(APPLICATION_STATUS_LABEL[s]).toBeDefined();
  });

  test("APPLICATION_STATUS_TONE has every status", () => {
    for (const s of STATUSES) expect(APPLICATION_STATUS_TONE[s]).toBeDefined();
  });

  test("DECISION_LABEL has every decision view", () => {
    for (const d of ["admit", "conditional_admit", "waitlist", "reject", "pending"] as const) {
      expect(DECISION_LABEL[d]).toBeDefined();
    }
  });
});
