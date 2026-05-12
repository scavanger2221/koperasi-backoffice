CREATE TABLE `akun` (
	`id` text PRIMARY KEY NOT NULL,
	`kode` text NOT NULL,
	`nama` text NOT NULL,
	`tipe` text NOT NULL,
	`saldo_normal` text NOT NULL,
	`aktif` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `akun_kode_unique` ON `akun` (`kode`);--> statement-breakpoint
CREATE TABLE `jurnal` (
	`id` text PRIMARY KEY NOT NULL,
	`tanggal` text NOT NULL,
	`no_jurnal` text NOT NULL,
	`keterangan` text NOT NULL,
	`ref_tipe` text NOT NULL,
	`ref_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jurnal_detail` (
	`id` text PRIMARY KEY NOT NULL,
	`jurnal_id` text NOT NULL,
	`akun_id` text NOT NULL,
	`debit` text DEFAULT '0' NOT NULL,
	`kredit` text DEFAULT '0' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`jurnal_id`) REFERENCES `jurnal`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`akun_id`) REFERENCES `akun`(`id`) ON UPDATE no action ON DELETE no action
);
