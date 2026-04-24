import type { ApiClient } from "../client";
import type { DataResponse } from "../types";
import type {
  ApplicationStatus,
  UserRole,
  VerificationStatus,
} from "@verifly/types";

export interface StudentDashboard {
  counts: {
    activeApplications: number;
    pendingVerifications: number;
    outstandingDocuments: number;
  };
  recentAudit: Array<{
    id: string;
    actorUserId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown> | null;
    createdAt: number;
    ip: string | null;
  }>;
}

export interface UniversityDashboard {
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

export interface BankDashboard {
  counts: { pending: number; underReview: number };
  recentDecisions: Array<{
    id: string;
    code: string;
    status: VerificationStatus;
    decidedAt: number | null;
  }>;
  medianTimeToDecisionMs: number | null;
}

export interface CounselorDashboard {
  students: Array<{
    studentId: string;
    fullName: string | null;
    applicationCount: number;
    lastUpdatedAt: number | null;
    latestStatus: ApplicationStatus | null;
  }>;
}

export interface AdminDashboard {
  usersByRole: Record<UserRole, number>;
  applicationsByStatus: Record<ApplicationStatus, number>;
  verificationsByStatus: Record<VerificationStatus, number>;
  errorRateLast24h: number | null;
}

export function portalEndpoints(client: ApiClient) {
  return {
    studentDashboard(): Promise<DataResponse<StudentDashboard>> {
      return client.get<DataResponse<StudentDashboard>>("/portal/student/dashboard");
    },
    universityDashboard(): Promise<DataResponse<UniversityDashboard>> {
      return client.get<DataResponse<UniversityDashboard>>("/portal/university/dashboard");
    },
    bankDashboard(): Promise<DataResponse<BankDashboard>> {
      return client.get<DataResponse<BankDashboard>>("/portal/bank/dashboard");
    },
    counselorDashboard(): Promise<DataResponse<CounselorDashboard>> {
      return client.get<DataResponse<CounselorDashboard>>("/portal/counselor/dashboard");
    },
    adminDashboard(): Promise<DataResponse<AdminDashboard>> {
      return client.get<DataResponse<AdminDashboard>>("/portal/admin/dashboard");
    },
  };
}

export type PortalEndpoints = ReturnType<typeof portalEndpoints>;
