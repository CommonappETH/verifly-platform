PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_verifications` (
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
	CONSTRAINT "verifications_status_check" CHECK("status" IN ('pending_submission','pending','under_review','more_info_needed','verified','rejected'))
);
--> statement-breakpoint
INSERT INTO `__new_verifications`("id", "code", "student_id", "application_id", "bank_id", "guardian_id", "requested_amount", "verified_amount", "currency", "status", "rejection_reason", "submitted_at", "decided_at", "verified_at") SELECT "id", "code", "student_id", "application_id", "bank_id", "guardian_id", "requested_amount", "verified_amount", "currency", "status", "rejection_reason", "submitted_at", "decided_at", "verified_at" FROM `verifications`;--> statement-breakpoint
DROP TABLE `verifications`;--> statement-breakpoint
ALTER TABLE `__new_verifications` RENAME TO `verifications`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `verifications_code_unique` ON `verifications` (`code`);--> statement-breakpoint
CREATE INDEX `idx_verifications_student_id` ON `verifications` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_verifications_bank_id_status` ON `verifications` (`bank_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_verifications_code` ON `verifications` (`code`);