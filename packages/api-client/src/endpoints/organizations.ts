import type { ApiClient } from "../client";
import type { DataResponse, PaginatedResponse, PaginationParams } from "../types";

export interface Organization {
  id: string;
  kind: "university" | "bank";
  name: string;
  slug: string;
  country?: string;
}

export interface CreateOrganizationInput {
  kind: "university" | "bank";
  name: string;
  slug: string;
  country?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  country?: string;
}

export interface ListOrganizationsParams extends PaginationParams {
  kind?: "university" | "bank";
}

export function organizationEndpoints(client: ApiClient) {
  return {
    list(params?: ListOrganizationsParams): Promise<PaginatedResponse<Organization>> {
      return client.get<PaginatedResponse<Organization>>("/organizations", { query: params && { ...params } });
    },

    get(id: string): Promise<DataResponse<Organization>> {
      return client.get<DataResponse<Organization>>(`/organizations/${id}`);
    },

    create(input: CreateOrganizationInput): Promise<DataResponse<Organization>> {
      return client.post<DataResponse<Organization>>("/organizations", input);
    },

    update(id: string, input: UpdateOrganizationInput): Promise<DataResponse<Organization>> {
      return client.patch<DataResponse<Organization>>(`/organizations/${id}`, input);
    },
  };
}

export type OrganizationEndpoints = ReturnType<typeof organizationEndpoints>;
