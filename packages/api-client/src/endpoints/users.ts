import type { ApiClient } from "../client";
import type { DataResponse, PublicUser } from "../types";

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export function userEndpoints(client: ApiClient) {
  return {
    me(): Promise<DataResponse<PublicUser>> {
      return client.get<DataResponse<PublicUser>>("/users/me");
    },

    update(input: UpdateUserInput): Promise<DataResponse<PublicUser>> {
      return client.patch<DataResponse<PublicUser>>("/users/me", input);
    },

    delete(): Promise<void> {
      return client.del<void>("/users/me");
    },
  };
}

export type UserEndpoints = ReturnType<typeof userEndpoints>;
