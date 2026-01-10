CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `simulation_config` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`product_count` integer DEFAULT 20000 NOT NULL,
	`robot_count` integer DEFAULT 30 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
