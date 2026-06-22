PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_anggota` (
	`id` text PRIMARY KEY NOT NULL,
	`no_anggota` text NOT NULL,
	`nik` text NOT NULL,
	`nama` text NOT NULL,
	`tempat_lahir` text NOT NULL,
	`tanggal_lahir` text NOT NULL,
	`jenis_kelamin` text NOT NULL,
	`agama` text,
	`status_kawin` text,
	`pendidikan_terakhir` text,
	`alamat` text NOT NULL,
	`pekerjaan` text,
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
INSERT INTO `__new_anggota`("id", "no_anggota", "nik", "nama", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama", "status_kawin", "pendidikan_terakhir", "alamat", "pekerjaan", "no_telepon", "email", "foto", "status", "tanggal_daftar", "tanggal_keluar", "created_at", "updated_at") SELECT "id", "no_anggota", "nik", "nama", "tempat_lahir", "tanggal_lahir", 'laki_laki', NULL, NULL, NULL, "alamat", "pekerjaan", "no_telepon", "email", "foto", "status", "tanggal_daftar", "tanggal_keluar", "created_at", "updated_at" FROM `anggota`;--> statement-breakpoint
DROP TABLE `anggota`;--> statement-breakpoint
ALTER TABLE `__new_anggota` RENAME TO `anggota`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `anggota_no_anggota_unique` ON `anggota` (`no_anggota`);--> statement-breakpoint
CREATE UNIQUE INDEX `anggota_nik_unique` ON `anggota` (`nik`);--> statement-breakpoint
CREATE UNIQUE INDEX `jurnal_no_jurnal_unique` ON `jurnal` (`no_jurnal`);--> statement-breakpoint
CREATE UNIQUE INDEX `periode_buku_tahun_unique` ON `periode_buku` (`tahun`);--> statement-breakpoint
CREATE UNIQUE INDEX `shu_periode_unique` ON `shu` (`periode`);