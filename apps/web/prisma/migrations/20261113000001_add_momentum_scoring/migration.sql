-- Learnaxia Momentum Scoring System Migration
-- Creates user_scores, study_session_logs, and content_adoption_logs tables

-- 1. user_scores — Aylık puan bucket'ı
CREATE TABLE IF NOT EXISTS "user_scores" (
    "id"                    TEXT        NOT NULL,
    "userId"                TEXT        NOT NULL,
    "period"                TIMESTAMP(3) NOT NULL,
    "studyMinutes"          INTEGER     NOT NULL DEFAULT 0,
    "cardsReviewed"         INTEGER     NOT NULL DEFAULT 0,
    "accuracyRate"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "modulesCreated"        INTEGER     NOT NULL DEFAULT 0,
    "journeyCompletions"    INTEGER     NOT NULL DEFAULT 0,
    "activeDays"            INTEGER     NOT NULL DEFAULT 0,
    "contentAdoption"       INTEGER     NOT NULL DEFAULT 0,
    "sm2AdherenceScore"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionSpreadScore"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracyTrendScore"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewDepthScore"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentQuality"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "velocityPenalty"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "patternPenalty"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "antiGamingFactor"      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "rawScore"              DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityMultiplier"     DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "consistencyCoef"       DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "finalScore"            DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier"                  TEXT        NOT NULL DEFAULT 'seed',
    "calculatedAt"          TIMESTAMP(3),
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_scores_userId_period_key"
    ON "user_scores"("userId", "period");

CREATE INDEX IF NOT EXISTS "user_scores_userId_idx"
    ON "user_scores"("userId");

CREATE INDEX IF NOT EXISTS "user_scores_period_idx"
    ON "user_scores"("period");

CREATE INDEX IF NOT EXISTS "user_scores_finalScore_idx"
    ON "user_scores"("finalScore" DESC);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_scores_userId_fkey') THEN
        ALTER TABLE "user_scores"
            ADD CONSTRAINT "user_scores_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 2. study_session_logs — Ham oturum telemetrisi
CREATE TABLE IF NOT EXISTS "study_session_logs" (
    "id"                TEXT        NOT NULL,
    "userId"            TEXT        NOT NULL,
    "moduleId"          TEXT,
    "source"            TEXT        NOT NULL DEFAULT 'study',
    "startedAt"         TIMESTAMP(3) NOT NULL,
    "endedAt"           TIMESTAMP(3),
    "durationSec"       INTEGER     NOT NULL DEFAULT 0,
    "cardsAttempted"    INTEGER     NOT NULL DEFAULT 0,
    "cardsCorrect"      INTEGER     NOT NULL DEFAULT 0,
    "accuracyRate"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sm2DueCards"       INTEGER     NOT NULL DEFAULT 0,
    "sm2OnTimeCards"    INTEGER     NOT NULL DEFAULT 0,
    "sm2EarlyCards"     INTEGER     NOT NULL DEFAULT 0,
    "isAnomaly"         BOOLEAN     NOT NULL DEFAULT FALSE,
    "anomalyReason"     TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_session_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "study_session_logs_userId_startedAt_idx"
    ON "study_session_logs"("userId", "startedAt");

CREATE INDEX IF NOT EXISTS "study_session_logs_userId_createdAt_idx"
    ON "study_session_logs"("userId", "createdAt");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_session_logs_userId_fkey') THEN
        ALTER TABLE "study_session_logs"
            ADD CONSTRAINT "study_session_logs_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. content_adoption_logs — İçerik adoption takibi
CREATE TABLE IF NOT EXISTS "content_adoption_logs" (
    "id"                TEXT        NOT NULL,
    "moduleId"          TEXT        NOT NULL,
    "ownerId"           TEXT        NOT NULL,
    "studentId"         TEXT        NOT NULL,
    "firstStudyAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardsStudied"      INTEGER     NOT NULL DEFAULT 0,
    "lastStudyAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentAccuracy"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "counted"           BOOLEAN     NOT NULL DEFAULT TRUE,

    CONSTRAINT "content_adoption_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "content_adoption_logs_moduleId_studentId_key"
    ON "content_adoption_logs"("moduleId", "studentId");

CREATE INDEX IF NOT EXISTS "content_adoption_logs_ownerId_idx"
    ON "content_adoption_logs"("ownerId");

CREATE INDEX IF NOT EXISTS "content_adoption_logs_moduleId_idx"
    ON "content_adoption_logs"("moduleId");

CREATE INDEX IF NOT EXISTS "content_adoption_logs_studentId_idx"
    ON "content_adoption_logs"("studentId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_adoption_logs_studentId_fkey') THEN
        ALTER TABLE "content_adoption_logs"
            ADD CONSTRAINT "content_adoption_logs_studentId_fkey"
            FOREIGN KEY ("studentId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_adoption_logs_ownerId_fkey') THEN
        ALTER TABLE "content_adoption_logs"
            ADD CONSTRAINT "content_adoption_logs_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
