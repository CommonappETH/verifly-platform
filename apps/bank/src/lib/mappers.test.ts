import { describe, expect, test } from "bun:test";

import {
  VERIFICATION_STATUS_LABEL,
  VERIFICATION_STATUS_TONE,
  displayName,
  formatCurrency,
  formatDate,
  formatDateTime,
  isDecided,
  isPendingForBank,
  mapVerificationDetail,
  mapVerificationRow,
  verificationStatusBadge,
  type WireVerification,
} from "./mappers";

const baseVerification: WireVerification = {
  id: "seed-v-2",
  code: "VF-SEED2",
  studentId: "seed-s-bob",
  applicationId: "seed-app-4",
  bankId: "seed-o-chase",
  guardianId: "seed-g-bob-1",
  requestedAmount: 7_500_000,
  verifiedAmount: null,
  currency: "USD",
  status: "pending",
  rejectionReason: null,
  submittedAt: 1_700_000_000_000,
  decidedAt: null,
  verifiedAt: null,
};

describe("mapVerificationRow", () => {
  test("populates all fields from verification + student", () => {
    const row = mapVerificationRow(baseVerification, {
      id: "seed-s-bob",
      firstName: "Bob",
      lastName: "Brown",
      fullName: "Bob Brown",
      country: "DE",
    });
    expect(row.code).toBe("VF-SEED2");
    expect(row.studentName).toBe("Bob Brown");
    expect(row.studentCountry).toBe("DE");
    expect(row.requestedAmount).toBe(7_500_000);
    expect(row.status).toBe("pending");
  });

  test("falls back to studentId when student missing", () => {
    const row = mapVerificationRow(baseVerification);
    expect(row.studentName).toBe("seed-s-bob");
    expect(row.studentCountry).toBeNull();
  });
});

describe("mapVerificationDetail", () => {
  test("layers user email + nationality + intendedStudy on top", () => {
    const d = mapVerificationDetail(
      baseVerification,
      {
        id: "seed-s-bob",
        fullName: "Bob Brown",
        nationality: "DE",
        intendedStudy: "Aerospace",
        gpa: 3.6,
      },
      { id: "seed-u-stu-bob", email: "bob@example.com", role: "student", name: "Bob Brown" },
    );
    expect(d.studentEmail).toBe("bob@example.com");
    expect(d.studentNationality).toBe("DE");
    expect(d.studentIntendedStudy).toBe("Aerospace");
    expect(d.studentGpa).toBe(3.6);
  });

  test("nulls when student/user are absent", () => {
    const d = mapVerificationDetail(baseVerification);
    expect(d.studentEmail).toBeNull();
    expect(d.studentNationality).toBeNull();
    expect(d.studentIntendedStudy).toBeNull();
    expect(d.studentGpa).toBeNull();
  });

  test("coerces string gpa to number", () => {
    const d = mapVerificationDetail(baseVerification, {
      id: "seed-s-bob",
      gpa: "3.9" as unknown as number,
    });
    expect(d.studentGpa).toBe(3.9);
  });
});

describe("status helpers", () => {
  test("isDecided", () => {
    expect(isDecided("verified")).toBe(true);
    expect(isDecided("rejected")).toBe(true);
    expect(isDecided("pending")).toBe(false);
    expect(isDecided("pending_submission")).toBe(false);
    expect(isDecided("under_review")).toBe(false);
    expect(isDecided("more_info_needed")).toBe(false);
  });

  test("isPendingForBank", () => {
    expect(isPendingForBank("pending")).toBe(true);
    expect(isPendingForBank("under_review")).toBe(true);
    expect(isPendingForBank("more_info_needed")).toBe(true);
    expect(isPendingForBank("pending_submission")).toBe(false); // student hasn't submitted yet
    expect(isPendingForBank("verified")).toBe(false);
    expect(isPendingForBank("rejected")).toBe(false);
  });

  test("verificationStatusBadge returns label+tone", () => {
    const v = verificationStatusBadge("verified");
    expect(v.label).toBe("Approved");
    expect(v.tone).toBe("success");
  });

  test("status records cover every backend status", () => {
    const STATUSES = [
      "pending_submission",
      "pending",
      "under_review",
      "more_info_needed",
      "verified",
      "rejected",
    ] as const;
    for (const s of STATUSES) {
      expect(VERIFICATION_STATUS_LABEL[s]).toBeDefined();
      expect(VERIFICATION_STATUS_TONE[s]).toBeDefined();
    }
  });
});

describe("display helpers", () => {
  test("displayName prefers fullName, falls through to firstName/lastName, then to fallback", () => {
    expect(displayName({ id: "x", fullName: "Full Name" }, "fb")).toBe("Full Name");
    expect(displayName({ id: "x", firstName: "F", lastName: "L" }, "fb")).toBe("F L");
    expect(displayName({ id: "x" }, "fb")).toBe("fb");
    expect(displayName(undefined, "fb")).toBe("fb");
  });

  test("formatCurrency converts minor units to USD", () => {
    expect(formatCurrency(7_500_000, "USD")).toBe("$75,000");
    expect(formatCurrency(0, "USD")).toBe("$0");
  });

  test("formatDate handles null + millis", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    // Don't assert exact locale string — just that it's not the dash.
    expect(formatDate(1_700_000_000_000)).not.toBe("—");
  });

  test("formatDateTime handles null + millis", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(1_700_000_000_000)).not.toBe("—");
  });
});
