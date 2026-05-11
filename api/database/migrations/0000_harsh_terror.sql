CREATE TABLE `anggota` (
	`id` text PRIMARY KEY NOT NULL,
	`no_anggota` text NOT NULL,
	`nik` text NOT NULL,
	`nama` text NOT NULL,
	`tempat_lahir` text NOT NULL,
	`tanggal_lahir` text NOT NULL,
	`alamat` text NOT NULL,
	`pekerjaan` text NOT NULL,
	`no_telepon` text NOT NULL,
	`email` text,
	`foto` text,
	`status` text DEFAULT 'menunggu_verifikasi' NOT NULL,
	`tanggal_daftar` text DEFAULT (date('now')) NOT NULL,
	`tanggal_keluar` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anggota_no_anggota_unique` ON `anggota` (`no_anggota`);--> statement-breakpoint
CREATE UNIQUE INDEX `anggota_nik_unique` ON `anggota` (`nik`);--> statement-breakpoint
CREATE TABLE `angsuran` (
	`id` text PRIMARY KEY NOT NULL,
	`pinjaman_id` text NOT NULL,
	`angsuran_ke` integer NOT NULL,
	`tanggal_jatuh_tempo` text NOT NULL,
	`tanggal_bayar` text,
	`jumlah_pokok` text NOT NULL,
	`jumlah_bunga` text NOT NULL,
	`denda` text DEFAULT '0' NOT NULL,
	`total_bayar` text NOT NULL,
	`status` text DEFAULT 'belum_lunas' NOT NULL,
	`metode_bayar` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`pinjaman_id`) REFERENCES `pinjaman`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pinjaman` (
	`id` text PRIMARY KEY NOT NULL,
	`anggota_id` text NOT NULL,
	`no_pinjaman` text NOT NULL,
	`jumlah` text NOT NULL,
	`bunga_persen` text NOT NULL,
	`jenis_bunga` text DEFAULT 'flat' NOT NULL,
	`jangka_waktu` integer NOT NULL,
	`angsuran_per_bulan` text NOT NULL,
	`status` text DEFAULT 'diajukan' NOT NULL,
	`tanggal_pengajuan` text DEFAULT (date('now')) NOT NULL,
	`tanggal_acc` text,
	`tanggal_pencairan` text,
	`keterangan` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pinjaman_no_pinjaman_unique` ON `pinjaman` (`no_pinjaman`);--> statement-breakpoint
CREATE TABLE `simpanan` (
	`id` text PRIMARY KEY NOT NULL,
	`anggota_id` text NOT NULL,
	`jenis` text NOT NULL,
	`jumlah` text NOT NULL,
	`tanggal` text NOT NULL,
	`metode_bayar` text DEFAULT 'tunai' NOT NULL,
	`keterangan` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`anggota_id` text,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`nama` text NOT NULL,
	`role` text DEFAULT 'anggota' NOT NULL,
	`aktif` integer DEFAULT true NOT NULL,
	`last_login` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);