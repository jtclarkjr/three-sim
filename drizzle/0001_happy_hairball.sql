ALTER TABLE `simulation_config` ADD `tracked_robot_id` text;--> statement-breakpoint
ALTER TABLE `simulation_config` ADD `pickup_product_id` text;--> statement-breakpoint
ALTER TABLE `simulation_config` ADD `drop_aisle` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `simulation_config` ADD `drop_progress` integer DEFAULT 50;