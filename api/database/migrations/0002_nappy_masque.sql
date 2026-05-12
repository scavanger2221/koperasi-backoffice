CREATE TABLE `tagihan_simpanan` (
	`id` text PRIMARY KEY NOT NULL,
	`anggota_id` text NOT NULL,
	`periode` text NOT NULL,
	`jenis` text DEFAULT 'wajib' NOT NULL,
	`jumlah` text NOT NULL,
	`status` text DEFAULT 'belum_bayar' NOT NULL,
	`tanggal_bayar` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`anggota_id`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
