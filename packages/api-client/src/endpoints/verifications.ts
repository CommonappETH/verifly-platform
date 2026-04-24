import type { ApiClient } from "../client";
import type {
  DataResponse,
  PaginatedResponse,
  PaginationParams,
} from "../types";
import type { Verification, VerificationStatus } from "@verifly/types";

export interface CreateVerificationInput {
  applicationId?: string;
  bankId: string;
  requestedAmount: number;
  currency: string;
  guardianId?: string;
}

export interface VerificationDecisionInput {
  decision: "verified" | "rejected";
  verifiedAmount?: number;
  rejectionReason?: string;
}

export interface ListVerificationsParams extends PaginationParams {
  status?: VerificationStatus;
}

export function verificationEndpoints(client: ApiClient) {
  return {
    create(input: CreateVerificationInput): Promise<DataResponse<Verification>> {
      return client.post<DataResponse<Verification>>("/verifications", input);
    },

    get(id: string): Promise<DataResponse<Verification>> {
      return client.get<DataResponse<Verification>>(`/verifications/${id}`);
    },

    submit(id: string): Promise<DataResponse<Verification>> {
      return client.post<DataResponse<Verification>>(`/verifications/${id}/submit`);
    },

    decide(id: string, input: VerificationDecisionInput): Promise<DataResponse<Verification>> {
      return client.patch<DataResponse<Verification>>(`/verifications/${id}/decision`, input);
    },

    list(params?: ListVerificationsParams): Promise<PaginatedResponse<Verification>> {
      return client.get<PaginatedResponse<Verification>>("/verifications", { query: params && { ...params } });
    },

    lookupByCode(code: string): Promise<DataResponse<Verification>> {
      return client.get<DataResponse<Verification>>(`/verifications/lookup/${code}`);
    },
  };
}

export type VerificationEndpoints = ReturnType<typeof verificationEndpoints>;
