CREATE TABLE `rat` (
	`id` text PRIMARY KEY NOT NULL,
	`periode` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`tanggal_rat` text NOT NULL,
	`tempat` text NOT NULL,
	`total_anggota` integer DEFAULT 0 NOT NULL,
	`total_hadir` integer DEFAULT 0 NOT NULL,
	`kuorum` integer DEFAULT false NOT NULL,
	`catatan` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rat_agenda` (
	`id` text PRIMARY KEY NOT NULL,
	`rat_id` text NOT NULL,
	`judul` text NOT NULL,
	`hasil_voting` text,
	`catatan` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`rat_id`) REFERENCES `rat`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rat_dokumen` (
	`id` text PRIMARY KEY NOT NULL,
	`rat_id` text NOT NULL,
	`nama` text NOT NULL,
	`tipe` text NOT NULL,
	`status` text DEFAULT 'disiapkan' NOT NULL,
	`url` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`rat_id`) REFERENCES `rat`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rat_kehadiran` (
	`id` text PRIMARY KEY NOT NULL,
	`rat_id` text NOT NULL,
	`anggota_id` text NOT NULL,
	`hadir` integer DEFAULT false NOT NULL,
	`surat_kuasa` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`rat_id`) REFERENCES `rat`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
