CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('strength','consistency','technique','special') NOT NULL DEFAULT 'special',
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`icon` varchar(10) NOT NULL DEFAULT '🏆',
	`xpReward` int NOT NULL DEFAULT 100,
	`criteria` json DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('workout','rest','competition','custom') NOT NULL DEFAULT 'workout',
	`routineId` int,
	`scheduledAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`duration` int DEFAULT 60,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`description` text,
	`category` enum('armwrestling','strength','technique','conditioning','mobility') NOT NULL DEFAULT 'strength',
	`difficulty` enum('beginner','intermediate','advanced','elite') NOT NULL DEFAULT 'beginner',
	`muscles` json DEFAULT NULL,
	`equipment` json DEFAULT NULL,
	`instructions` json DEFAULT NULL,
	`tips` json DEFAULT NULL,
	`commonMistakes` json DEFAULT NULL,
	`imageUrl` text,
	`videoUrl` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdById` int,
	`usageCount` int NOT NULL DEFAULT 0,
	`rating` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exercise_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `program_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programId` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`amount` float NOT NULL DEFAULT 0,
	CONSTRAINT `program_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `program_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `program_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`longDescription` text,
	`createdById` int NOT NULL,
	`price` float NOT NULL DEFAULT 0,
	`currency` varchar(10) NOT NULL DEFAULT 'usd',
	`difficulty` enum('beginner','intermediate','advanced','elite') NOT NULL DEFAULT 'beginner',
	`durationWeeks` int NOT NULL DEFAULT 4,
	`category` varchar(100),
	`imageUrl` text,
	`rating` float DEFAULT 0,
	`reviewCount` int NOT NULL DEFAULT 0,
	`purchaseCount` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT false,
	`tags` json DEFAULT NULL,
	`routineIds` json DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`type` varchar(50) NOT NULL,
	`metric` varchar(100) NOT NULL,
	`value` float NOT NULL,
	`previousValue` float,
	`unit` varchar(20) DEFAULT 'kg',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `progress_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routine_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routineId` int NOT NULL,
	`templateId` int NOT NULL,
	`sets` int NOT NULL DEFAULT 3,
	`reps` varchar(50) NOT NULL DEFAULT '10',
	`restSeconds` int NOT NULL DEFAULT 60,
	`weight` float,
	`notes` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `routine_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`difficulty` enum('beginner','intermediate','advanced','elite') NOT NULL DEFAULT 'beginner',
	`duration` int NOT NULL DEFAULT 45,
	`isPublic` boolean NOT NULL DEFAULT true,
	`isTemplate` boolean NOT NULL DEFAULT false,
	`aiGenerated` boolean NOT NULL DEFAULT false,
	`tags` json DEFAULT NULL,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`progress` float NOT NULL DEFAULT 100,
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`templateId` int NOT NULL,
	`exerciseName` varchar(255) NOT NULL,
	`targetSets` int NOT NULL DEFAULT 3,
	`completedSets` int NOT NULL DEFAULT 0,
	`reps` varchar(50) NOT NULL,
	`weight` float,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`isPR` boolean NOT NULL DEFAULT false,
	`setData` json,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `workout_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`routineId` int NOT NULL,
	`status` enum('in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	`duration` int NOT NULL DEFAULT 0,
	`xpEarned` int NOT NULL DEFAULT 0,
	`totalVolume` float DEFAULT 0,
	`completionRate` float DEFAULT 0,
	`notes` text,
	`mood` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `workout_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `appRole` enum('athlete','coach','admin') DEFAULT 'athlete' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(100);
--> statement-breakpoint
ALTER TABLE `users` ADD `xp` int DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `level` int DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `streak` int DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `longestStreak` int DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `totalWorkouts` int DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','premium','elite') DEFAULT 'free' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `isApproved` boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `assignedCoachId` int;
