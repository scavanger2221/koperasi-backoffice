ALTER TABLE `rat_agenda` ADD `suara_setuju` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rat_agenda` ADD `suara_tolak` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rat_agenda` ADD `suara_ditunda` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rat_dokumen` ADD `content` text;