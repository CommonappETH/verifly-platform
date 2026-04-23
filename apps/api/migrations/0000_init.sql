CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`university_id` text NOT NULL,
	`program` text,
	`status` text NOT NULL,
	`verification_status` text,
	`document_status` text,
	`decision_status` text,
	`applicant_type` text,
	`submitted_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`university_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "applications_status_check" CHECK("applications"."status" IN ('draft','submitted','under_review','awaiting_info','awaiting_verification','committee_review','conditionally_admitted','admitted','rejected','waitlisted')),
	CONSTRAINT "applications_verification_status_check" CHECK("applications"."verification_status" IS NULL OR "applications"."verification_status" IN ('pending','under_review','more_info_needed','verified','rejected')),
	CONSTRAINT "applications_document_status_check" CHECK("applications"."document_status" IS NULL OR "applications"."document_status" IN ('missing','uploaded','under_review','approved','needs_replacement')),
	CONSTRAINT "applications_decision_status_check" CHECK("applications"."decision_status" IS NULL OR "applications"."decision_status" IN ('none','pending','admit','conditional_admit','waitlist','reject')),
	CONSTRAINT "applications_applicant_type_check" CHECK("applications"."applicant_type" IS NULL OR "applications"."applicant_type" IN ('pre_approved','normal'))
);
--> statement-breakpoint
CREATE INDEX `idx_applications_student_id` ON `applications` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_applications_university_id_status` ON `applications` (`university_id`,`status`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`ip` text
);
--> statement-breakpoint
CREATE INDEX `idx_audit_log_entity_type_entity_id` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `bank_users` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bank_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bank_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_bank_users_user_id` ON `bank_users` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_bank_users_bank_id` ON `bank_users` (`bank_id`);--> statement-breakpoint
CREATE TABLE `counselors` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`school_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_counselors_user_id` ON `counselors` (`user_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`application_id` text,
	`verification_id` text,
	`storage_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`uploaded_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`verification_id`) REFERENCES `verifications`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "documents_kind_check" CHECK("documents"."kind" IN ('transcript','passport','test_score','recommendation_letter','school_profile','mid_year_report','bank_statement','sponsor_letter','scholarship_letter','academic_record','other')),
	CONSTRAINT "documents_status_check" CHECK("documents"."status" IN ('missing','uploaded','under_review','approved','needs_replacement'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_storage_key_unique` ON `documents` (`storage_key`);--> statement-breakpoint
CREATE INDEX `idx_documents_owner_id` ON `documents` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_documents_application_id` ON `documents` (`application_id`);--> statement-breakpoint
CREATE INDEX `idx_documents_verification_id` ON `documents` (`verification_id`);--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`full_name` text NOT NULL,
	`relationship` text,
	`email` text,
	`phone` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_guardians_student_id` ON `guardians` (`student_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`country` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "organizations_kind_check" CHECK("organizations"."kind" IN ('university','bank'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_organizations_kind_slug` ON `organizations` (`kind`,`slug`);--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_resets_token_hash_unique` ON `password_resets` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_password_resets_token_hash` ON `password_resets` (`token_hash`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`ip` text,
	`user_agent` text,
	`revoked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`full_name` text,
	`country` text,
	`nationality` text,
	`gpa` real,
	`university` text,
	`intended_study` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_students_user_id` ON `students` (`user_id`);--> statement-breakpoint
CREATE TABLE `university_users` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`university_id` text NOT NULL,
	`title` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`university_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_university_users_user_id` ON `university_users` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_university_users_university_id` ON `university_users` (`university_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "users_role_check" CHECK("users"."role" IN ('admin','student','counselor','bank','university'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`student_id` text NOT NULL,
	`application_id` text,
	`bank_id` text,
	`guardian_id` text,
	`requested_amount` integer NOT NULL,
	`verified_amount` integer,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`rejection_reason` text,
	`submitted_at` integer,
	`decided_at` integer,
	`verified_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`bank_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "verifications_status_check" CHECK("verifications"."status" IN ('pending','under_review','more_info_needed','verified','rejected'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verifications_code_unique` ON `verifications` (`code`);--> statement-breakpoint
CREATE INDEX `idx_verifications_student_id` ON `verifications` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_verifications_bank_id_status` ON `verifications` (`bank_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_verifications_code` ON `verifications` (`code`);