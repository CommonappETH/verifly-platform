import type { ApiClient } from "../client";
import type { AuthUserResponse, PublicUser } from "../types";
import type { UserRole } from "@verifly/types";

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
  name?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function authEndpoints(client: ApiClient) {
  return {
    register(input: RegisterInput): Promise<AuthUserResponse> {
      return client.post<AuthUserResponse>("/auth/register", input);
    },

    login(input: LoginInput): Promise<AuthUserResponse> {
      return client.post<AuthUserResponse>("/auth/login", input);
    },

    logout(): Promise<void> {
      return client.post<void>("/auth/logout");
    },

    me(): Promise<AuthUserResponse> {
      return client.get<AuthUserResponse>("/auth/me");
    },

    forgotPassword(input: ForgotPasswordInput): Promise<void> {
      return client.post<void>("/auth/password/forgot", input);
    },

    resetPassword(input: ResetPasswordInput): Promise<void> {
      return client.post<void>("/auth/password/reset", {
        token: input.token,
        new_password: input.newPassword,
      });
    },

    changePassword(input: ChangePasswordInput): Promise<void> {
      return client.post<void>("/auth/password/change", {
        current_password: input.currentPassword,
        new_password: input.newPassword,
      });
    },
  };
}

export type AuthEndpoints = ReturnType<typeof authEndpoints>;
