-- Add fields for tracking login attempts to User model
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockUntil" TIMESTAMP;
