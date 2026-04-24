export type {
  ApplicantType,
  Application,
  ApplicationStatus,
  BankUser,
  Counselor,
  DecisionStatus,
  Document,
  DocumentKind,
  DocumentStatus,
  Guardian,
  Student,
  User,
  UserRole,
  Verification,
  VerificationStatus,
} from "@verifly/types";

/** Public user shape returned by auth endpoints (password hash stripped). */
export interface PublicUser {
  id: string;
  email: string;
  role: import("@verifly/types").UserRole;
  name: string | null;
}

/** Wrapper for single-object responses: `{ data: T }`. */
export interface DataResponse<T> {
  data: T;
}

/** Wrapper for auth responses that return a user directly: `{ user: PublicUser }`. */
export interface AuthUserResponse {
  user: PublicUser;
}

/** Wrapper for paginated list responses. */
export interface PaginatedResponse<T> {
  data: T[];
  page: {
    cursor: string | null;
    hasMore: boolean;
  };
}

/** Pagination query parameters. */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

/** Upload URL response from document creation. */
export interface DocumentUploadResponse {
  id: string;
  uploadUrl: string;
}

/** Download URL included in document metadata response. */
export interface DocumentDetailResponse {
  id: string;
  name?: string;
  kind?: import("@verifly/types").DocumentKind;
  status: import("@verifly/types").DocumentStatus;
  downloadUrl?: string;
  uploadedAt?: string;
}
