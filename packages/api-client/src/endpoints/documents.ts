import type { ApiClient } from "../client";
import type {
  DataResponse,
  DocumentDetailResponse,
  DocumentUploadResponse,
} from "../types";
import type { DocumentKind } from "@verifly/types";

export interface CreateDocumentInput {
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  applicationId?: string;
  verificationId?: string;
}

export interface ReviewDocumentInput {
  status: "approved" | "needs_replacement";
  note?: string;
}

export function documentEndpoints(client: ApiClient) {
  return {
    create(input: CreateDocumentInput): Promise<DataResponse<DocumentUploadResponse>> {
      return client.post<DataResponse<DocumentUploadResponse>>("/documents", input);
    },

    complete(id: string): Promise<DataResponse<DocumentDetailResponse>> {
      return client.post<DataResponse<DocumentDetailResponse>>(`/documents/${id}/complete`);
    },

    get(id: string): Promise<DataResponse<DocumentDetailResponse>> {
      return client.get<DataResponse<DocumentDetailResponse>>(`/documents/${id}`);
    },

    review(id: string, input: ReviewDocumentInput): Promise<DataResponse<DocumentDetailResponse>> {
      return client.patch<DataResponse<DocumentDetailResponse>>(`/documents/${id}/review`, input);
    },

    delete(id: string): Promise<void> {
      return client.del<void>(`/documents/${id}`);
    },
  };
}

export type DocumentEndpoints = ReturnType<typeof documentEndpoints>;
