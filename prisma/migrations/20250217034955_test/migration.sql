-- CreateTable
CREATE TABLE "User" (
    "slackId" TEXT NOT NULL PRIMARY KEY,
    "session_started" TEXT,
    "session_status" TEXT DEFAULT 'STOPPED',
    "pr_link" TEXT,
    "hours_recorded_on_slack" DECIMAL DEFAULT 0.0,
    "juice_email" TEXT NOT NULL,
    "juice_token" TEXT NOT NULL,
    "juice_joined_at" DATETIME NOT NULL,
    "juice_hours" DECIMAL,
    "juice_kudos" INTEGER,
    "juice_achievements" JSONB NOT NULL,
    "juice_gamePr" TEXT,
    "jungle_stretches" JSONB,
    "jungle_hours" DECIMAL NOT NULL DEFAULT 0.0,
    "totalTokens" DECIMAL DEFAULT 0.0,
    "slack_handle" TEXT,
    "opt_in_to_playTestSharing" BOOLEAN NOT NULL DEFAULT false,
    "playtest_notifications" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "AlreadySentOut" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_juice_token_key" ON "User"("juice_token");
