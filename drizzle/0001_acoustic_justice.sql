CREATE TABLE `botConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`botToken` varchar(255) NOT NULL,
	`webhookUrl` varchar(512) NOT NULL,
	`isConfigured` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `botConfigs_id` PRIMARY KEY(`id`)
);
