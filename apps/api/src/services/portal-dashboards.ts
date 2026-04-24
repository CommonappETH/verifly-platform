import { and, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import {
  applications,
  auditLog,
  bankUsers,
  documents,
  students,
  universityUsers,
  users,
  verifications,
} from "../db/schema";
import type {
  ApplicationStatus,
  DocumentStatus,
  UserRole,
  VerificationStatus,
} from "../db/enums";
import {
  applicationStatuses,
  userRoles,
  verificationStatuses,
} from "../db/enums";
import type { Ctx } from "../platform/ports";
import type { AuditRecord } from "./audit";

const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "awaiting_info",
  "awaiting_verification",
  "committee_review",
  "conditionally_admitted",
];

const PENDING_VERIFICATION_STATUSES: VerificationStatus[] = [
  "pending_submission",
  "pending",
  "under_review",
  "more_info_needed",
];

const OUTSTANDING_DOCUMENT_STATUSES: DocumentStatus[] = [
  "missing",
  "needs_replacement",
];

const DECIDED_VERIFICATION_STATUSES: VerificationStatus[] = [
  "verified",
  "rejected",
];

export interface StudentDashboardResponse {
  counts: {
    activeApplications: number;
    pendingVerifications: number;
    outstandingDocuments: number;
  };
  recentAudit: AuditRecord[];
}

export interface UniversityDashboardResponse {
  applicationsByStatus: Record<ApplicationStatus, number>;
  recentSubmissions: Array<{
    id: string;
    studentId: string;
    program: string | null;
    status: ApplicationStatus;
    submittedAt: number | null;
  }>;
  verificationsPendingReview: number;
}

export interface BankDashboardResponse {
  counts: {
    pending: number;
    underReview: number;
  };
  recentDecisions: Array<{
    id: string;
    code: string;
    status: VerificationStatus;
    decidedAt: number | null;
  }>;
  medianTimeToDecisionMs: number | null;
}

export interface CounselorDashboardResponse {
  students: Array<{
    studentId: string;
    fullName: string | null;
    applicationCount: number;
    lastUpdatedAt: number | null;
    latestStatus: ApplicationStatus | null;
  }>;
}

export interface AdminDashboardResponse {
  usersByRole: Record<UserRole, number>;
  applicationsByStatus: Record<ApplicationStatus, number>;
  verificationsByStatus: Record<VerificationStatus, number>;
  errorRateLast24h: number | null;
}

export async function getStudentDashboard(
  ctx: Ctx,
  studentId: string,
  userId: string,
): Promise<StudentDashboardResponse> {
  const db = ctx.db.handle();

  const [activeApplicationsRow] = await db
    .select({ value: count() })
    .from(applications)
    .where(
      and(
        eq(applications.studentId, studentId),
        inArray(applications.status, ACTIVE_APPLICATION_STATUSES),
      ),
    );

  const [pendingVerificationsRow] = await db
    .select({ value: count() })
    .from(verifications)
    .where(
      and(
        eq(verifications.studentId, studentId),
        inArray(verifications.status, PENDING_VERIFICATION_STATUSES),
      ),
    );

  const [outstandingDocumentsRow] = await db
    .select({ value: count() })
    .from(documents)
    .where(
      and(
        eq(documents.ownerId, userId),
        inArray(documents.status, OUTSTANDING_DOCUMENT_STATUSES),
      ),
    );

  const auditRows = await db
    .select()
    .from(auditLog)
    .where(
      or(
        and(eq(auditLog.entityType, "student"), eq(auditLog.entityId, studentId)),
        eq(auditLog.actorUserId, userId),
      ),
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(10);

  return {
    counts: {
      activeApplications: activeApplicationsRow?.value ?? 0,
      pendingVerifications: pendingVerificationsRow?.value ?? 0,
      outstandingDocuments: outstandingDocumentsRow?.value ?? 0,
    },
    recentAudit: auditRows.map(parseAuditRow),
  };
}

export async function getUniversityDashboard(
  ctx: Ctx,
  universityId: string,
): Promise<UniversityDashboardResponse> {
  const db = ctx.db.handle();

  const statusRows = await db
    .select({ status: applications.status, value: count() })
    .from(applications)
    .where(eq(applications.universityId, universityId))
    .groupBy(applications.status);

  const applicationsByStatus = zeroFilled(applicationStatuses);
  for (const r of statusRows) {
    applicationsByStatus[r.status as ApplicationStatus] = r.value;
  }

  const recentSubmissions = await db
    .select({
      id: applications.id,
      studentId: applications.studentId,
      program: applications.program,
      status: applications.status,
      submittedAt: applications.submittedAt,
    })
    .from(applications)
    .where(
      and(
        eq(applications.universityId, universityId),
        sql`${applications.submittedAt} is not null`,
      ),
    )
    .orderBy(desc(applications.submittedAt))
    .limit(10);

  const [pendingReviewRow] = await db
    .select({ value: count() })
    .from(verifications)
    .innerJoin(applications, eq(verifications.applicationId, applications.id))
    .where(
      and(
        eq(applications.universityId, universityId),
        inArray(verifications.status, PENDING_VERIFICATION_STATUSES),
      ),
    );

  return {
    applicationsByStatus,
    recentSubmissions: recentSubmissions.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      program: r.program,
      status: r.status as ApplicationStatus,
      submittedAt: r.submittedAt,
    })),
    verificationsPendingReview: pendingReviewRow?.value ?? 0,
  };
}

export async function getBankDashboard(
  ctx: Ctx,
  bankId: string,
): Promise<BankDashboardResponse> {
  const db = ctx.db.handle();

  const [pendingRow] = await db
    .select({ value: count() })
    .from(verifications)
    .where(and(eq(verifications.bankId, bankId), eq(verifications.status, "pending")));

  const [underReviewRow] = await db
    .select({ value: count() })
    .from(verifications)
    .where(
      and(eq(verifications.bankId, bankId), eq(verifications.status, "under_review")),
    );

  const recentDecisions = await db
    .select({
      id: verifications.id,
      code: verifications.code,
      status: verifications.status,
      decidedAt: verifications.decidedAt,
    })
    .from(verifications)
    .where(
      and(
        eq(verifications.bankId, bankId),
        inArray(verifications.status, DECIDED_VERIFICATION_STATUSES),
      ),
    )
    .orderBy(desc(verifications.decidedAt))
    .limit(10);

  const decidedRows = await db
    .select({
      submittedAt: verifications.submittedAt,
      decidedAt: verifications.decidedAt,
    })
    .from(verifications)
    .where(
      and(
        eq(verifications.bankId, bankId),
        inArray(verifications.status, DECIDED_VERIFICATION_STATUSES),
      ),
    );

  const diffs: number[] = [];
  for (const r of decidedRows) {
    if (r.submittedAt !== null && r.decidedAt !== null) {
      diffs.push(r.decidedAt - r.submittedAt);
    }
  }

  return {
    counts: {
      pending: pendingRow?.value ?? 0,
      underReview: underReviewRow?.value ?? 0,
    },
    recentDecisions: recentDecisions.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status as VerificationStatus,
      decidedAt: r.decidedAt,
    })),
    medianTimeToDecisionMs: median(diffs),
  };
}

export async function getCounselorDashboard(
  ctx: Ctx,
  _counselorUserId: string,
): Promise<CounselorDashboardResponse> {
  // Phase 7 note carried forward: no explicit counselor↔student mapping table
  // exists yet. Counselors currently have broad read access (see
  // routes/applications assertApplicationReadAccess). Return all non-deleted
  // students with application-progress summaries; narrow by school mapping in
  // a future phase.
  const db = ctx.db.handle();

  const rows = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      applicationCount: count(applications.id),
      lastUpdatedAt: sql<number | null>`max(${applications.updatedAt})`,
    })
    .from(students)
    .leftJoin(applications, eq(applications.studentId, students.id))
    .where(isNull(students.deletedAt))
    .groupBy(students.id, students.fullName)
    .orderBy(desc(sql`max(${applications.updatedAt})`))
    .limit(100);

  const studentIds = rows.map((r) => r.studentId);
  const latestStatusByStudent = new Map<string, ApplicationStatus>();
  if (studentIds.length > 0) {
    const latestRows = await db
      .select({
        studentId: applications.studentId,
        status: applications.status,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .where(inArray(applications.studentId, studentIds))
      .orderBy(desc(applications.updatedAt));
    for (const r of latestRows) {
      if (!latestStatusByStudent.has(r.studentId)) {
        latestStatusByStudent.set(r.studentId, r.status as ApplicationStatus);
      }
    }
  }

  return {
    students: rows.map((r) => ({
      studentId: r.studentId,
      fullName: r.fullName,
      applicationCount: Number(r.applicationCount ?? 0),
      lastUpdatedAt: r.lastUpdatedAt ?? null,
      latestStatus: latestStatusByStudent.get(r.studentId) ?? null,
    })),
  };
}

export async function getAdminDashboard(ctx: Ctx): Promise<AdminDashboardResponse> {
  const db = ctx.db.handle();

  const userRows = await db
    .select({ role: users.role, value: count() })
    .from(users)
    .where(isNull(users.deletedAt))
    .groupBy(users.role);
  const usersByRole = zeroFilled(userRoles);
  for (const r of userRows) usersByRole[r.role as UserRole] = r.value;

  const applicationRows = await db
    .select({ status: applications.status, value: count() })
    .from(applications)
    .groupBy(applications.status);
  const applicationsByStatus = zeroFilled(applicationStatuses);
  for (const r of applicationRows) {
    applicationsByStatus[r.status as ApplicationStatus] = r.value;
  }

  const verificationRows = await db
    .select({ status: verifications.status, value: count() })
    .from(verifications)
    .groupBy(verifications.status);
  const verificationsByStatus = zeroFilled(verificationStatuses);
  for (const r of verificationRows) {
    verificationsByStatus[r.status as VerificationStatus] = r.value;
  }

  // errorRateLast24h requires the request_metrics table from Phase 12; until
  // then it is unavailable and returned as null. The field is declared now so
  // the admin frontend can bind against the stable DTO shape.
  return {
    usersByRole,
    applicationsByStatus,
    verificationsByStatus,
    errorRateLast24h: null,
  };
}

export async function getBankIdForUser(
  ctx: Ctx,
  userId: string,
): Promise<string | null> {
  const rows = await ctx.db
    .handle()
    .select({ bankId: bankUsers.bankId })
    .from(bankUsers)
    .where(eq(bankUsers.userId, userId))
    .limit(1);
  return rows[0]?.bankId ?? null;
}

export async function getUniversityIdForDashboardUser(
  ctx: Ctx,
  userId: string,
): Promise<string | null> {
  const rows = await ctx.db
    .handle()
    .select({ universityId: universityUsers.universityId })
    .from(universityUsers)
    .where(eq(universityUsers.userId, userId))
    .limit(1);
  return rows[0]?.universityId ?? null;
}

function zeroFilled<K extends string>(keys: readonly K[]): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const k of keys) out[k] = 0;
  return out;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function parseAuditRow(row: typeof auditLog.$inferSelect): AuditRecord {
  let metadata: Record<string, unknown> | null = null;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata) as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata,
    createdAt: row.createdAt,
    ip: row.ip,
  };
}
