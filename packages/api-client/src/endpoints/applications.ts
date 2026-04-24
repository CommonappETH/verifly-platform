import type { ApiClient } from "../client";
import type {
  DataResponse,
  PaginatedResponse,
  PaginationParams,
} from "../types";
import type { Application, ApplicationStatus } from "@verifly/types";

export interface CreateApplicationInput {
  universityId: string;
  program?: string;
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus;
}

export interface ListApplicationsParams extends PaginationParams {
  status?: ApplicationStatus;
}

export function applicationEndpoints(client: ApiClient) {
  return {
    create(input: CreateApplicationInput): Promise<DataResponse<Application>> {
      return client.post<DataResponse<Application>>("/applications", input);
    },

    get(id: string): Promise<DataResponse<Application>> {
      return client.get<DataResponse<Application>>(`/applications/${id}`);
    },

    update(id: string, input: UpdateApplicationInput): Promise<DataResponse<Application>> {
      return client.patch<DataResponse<Application>>(`/applications/${id}`, input);
    },

    list(params?: ListApplicationsParams): Promise<PaginatedResponse<Application>> {
      return client.get<PaginatedResponse<Application>>("/applications", { query: params && { ...params } });
    },
  };
}

export type ApplicationEndpoints = ReturnType<typeof applicationEndpoints>;
