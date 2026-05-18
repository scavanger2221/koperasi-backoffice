CREATE TABLE `koperasi` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`alamat` text,
	`badan_hukum` text,
	`jenis` text DEFAULT 'ksp' NOT NULL,
	`logo` text,
	`no_telepon` text,
	`email` text,
	`website` text,
	`kota` text,
	`provinsi` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `periode_buku` (
	`id` text PRIMARY KEY NOT NULL,
	`tahun` integer NOT NULL,
	`tanggal_mulai` text NOT NULL,
	`tanggal_selesai` text NOT NULL,
	`status` text DEFAULT 'buka' NOT NULL,
	`keterangan` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
