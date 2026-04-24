export { applicationEndpoints } from "./applications";
export type { ApplicationEndpoints, CreateApplicationInput, UpdateApplicationInput, ListApplicationsParams } from "./applications";

export { authEndpoints } from "./auth";
export type { AuthEndpoints, RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput } from "./auth";

export { documentEndpoints } from "./documents";
export type { DocumentEndpoints, CreateDocumentInput, ReviewDocumentInput } from "./documents";

export { portalEndpoints } from "./portal";
export type {
  PortalEndpoints,
  StudentDashboard,
  UniversityDashboard,
  BankDashboard,
  CounselorDashboard,
  AdminDashboard,
} from "./portal";

export { organizationEndpoints } from "./organizations";
export type { OrganizationEndpoints, Organization, CreateOrganizationInput, UpdateOrganizationInput, ListOrganizationsParams } from "./organizations";

export { studentEndpoints } from "./students";
export type { StudentEndpoints, CreateStudentInput, UpdateStudentInput, CreateGuardianInput, UpdateGuardianInput, ListStudentsParams } from "./students";

export { userEndpoints } from "./users";
export type { UserEndpoints, UpdateUserInput } from "./users";

export { verificationEndpoints } from "./verifications";
export type { VerificationEndpoints, CreateVerificationInput, VerificationDecisionInput, ListVerificationsParams } from "./verifications";
