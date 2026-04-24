import type { ApiClient } from "../client";
import type {
  DataResponse,
  PaginatedResponse,
  PaginationParams,
} from "../types";
import type { Guardian, Student } from "@verifly/types";

export interface CreateStudentInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  country?: string;
  nationality?: string;
  gpa?: number;
  university?: string;
  intendedStudy?: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  country?: string;
  nationality?: string;
  gpa?: number;
  university?: string;
  intendedStudy?: string;
}

export interface CreateGuardianInput {
  fullName: string;
  relationship?: string;
  email?: string;
  phone?: string;
}

export interface UpdateGuardianInput {
  fullName?: string;
  relationship?: string;
  email?: string;
  phone?: string;
}

export interface ListStudentsParams extends PaginationParams {
  q?: string;
}

export function studentEndpoints(client: ApiClient) {
  return {
    create(input: CreateStudentInput): Promise<DataResponse<Student>> {
      return client.post<DataResponse<Student>>("/students", input);
    },

    get(id: string): Promise<DataResponse<Student>> {
      return client.get<DataResponse<Student>>(`/students/${id}`);
    },

    update(id: string, input: UpdateStudentInput): Promise<DataResponse<Student>> {
      return client.patch<DataResponse<Student>>(`/students/${id}`, input);
    },

    list(params?: ListStudentsParams): Promise<PaginatedResponse<Student>> {
      return client.get<PaginatedResponse<Student>>("/students", { query: params && { ...params } });
    },

    listGuardians(studentId: string): Promise<DataResponse<Guardian[]>> {
      return client.get<DataResponse<Guardian[]>>(`/students/${studentId}/guardians`);
    },

    createGuardian(studentId: string, input: CreateGuardianInput): Promise<DataResponse<Guardian>> {
      return client.post<DataResponse<Guardian>>(`/students/${studentId}/guardians`, input);
    },

    updateGuardian(studentId: string, guardianId: string, input: UpdateGuardianInput): Promise<DataResponse<Guardian>> {
      return client.patch<DataResponse<Guardian>>(`/students/${studentId}/guardians/${guardianId}`, input);
    },

    deleteGuardian(studentId: string, guardianId: string): Promise<void> {
      return client.del<void>(`/students/${studentId}/guardians/${guardianId}`);
    },
  };
}

export type StudentEndpoints = ReturnType<typeof studentEndpoints>;
