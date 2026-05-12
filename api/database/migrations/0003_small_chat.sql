CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`user_email` text,
	`user_role` text,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`detail` text,
	`ip_address` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
