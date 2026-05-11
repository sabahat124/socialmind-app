CREATE TABLE `approval_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`requestedById` int NOT NULL,
	`reviewedById` int,
	`status` enum('pending','approved','rejected','revision_requested') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`emailSent` boolean NOT NULL DEFAULT false,
	`whatsappSent` boolean NOT NULL DEFAULT false,
	`approvalToken` varchar(128),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approval_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`socialAccountId` int,
	`platform` enum('instagram','facebook','twitter','linkedin','tiktok','youtube'),
	`contentType` enum('post','video','story','reel') NOT NULL DEFAULT 'post',
	`status` enum('draft','pending_approval','approved','rejected','scheduled','published','failed') NOT NULL DEFAULT 'draft',
	`caption` text,
	`hashtags` text,
	`imageUrl` text,
	`videoUrl` text,
	`mediaUrls` json,
	`aiPromptUsed` text,
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`rejectionReason` text,
	`editNotes` text,
	`engagementData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('email','whatsapp','in_app') NOT NULL,
	`subject` varchar(256),
	`body` text,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`relatedPostId` int,
	`relatedApprovalId` int,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`socialAccountId` int NOT NULL,
	`platform` enum('instagram','facebook','twitter','linkedin','tiktok','youtube') NOT NULL,
	`impressions` bigint DEFAULT 0,
	`reach` bigint DEFAULT 0,
	`likes` bigint DEFAULT 0,
	`comments` bigint DEFAULT 0,
	`shares` bigint DEFAULT 0,
	`saves` bigint DEFAULT 0,
	`clicks` bigint DEFAULT 0,
	`engagementRate` varchar(16),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`socialAccountId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`isAiSuggested` boolean NOT NULL DEFAULT false,
	`status` enum('pending','processing','published','failed','cancelled') NOT NULL DEFAULT 'pending',
	`publishedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('instagram','facebook','twitter','linkedin','tiktok','youtube') NOT NULL,
	`accountId` varchar(128),
	`accountName` varchar(256),
	`accountHandle` varchar(128),
	`avatarUrl` text,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`isConnected` boolean NOT NULL DEFAULT false,
	`followerCount` bigint DEFAULT 0,
	`followingCount` bigint DEFAULT 0,
	`postCount` bigint DEFAULT 0,
	`pageTheme` text,
	`pageTone` text,
	`pageNiche` varchar(128),
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `whatsappNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `notifyEmail` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notifyWhatsapp` boolean DEFAULT false NOT NULL;