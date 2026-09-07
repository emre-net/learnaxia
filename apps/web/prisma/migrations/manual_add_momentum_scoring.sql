-- Learnaxia Momentum Scoring System
-- Migration: add_momentum_scoring
-- Çalıştırma: Railway DB console'a yapıştır veya prisma migrate deploy

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. user_scores — Aylık puan bucket'ı
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_scores" (
    "id"                    TEXT        NOT NULL,
    "userId"                TEXT        NOT NULL,
    "period"                TIMESTAMP   NOT NULL, -- YYYY-MM-01 normalize
    -- Görünür metrikler
    "studyMinutes"          INTEGER     NOT NULL DEFAULT 0,
    "cardsReviewed"         INTEGER     NOT NULL DEFAULT 0,
    "accuracyRate"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "modulesCreated"        INTEGER     NOT NULL DEFAULT 0,
    "journeyCompletions"    INTEGER     NOT NULL DEFAULT 0,
    "activeDays"            INTEGER     NOT NULL DEFAULT 0,
    "contentAdoption"       INTEGER     NOT NULL DEFAULT 0,
    -- Gizli sinyal skorları
    "sm2AdherenceScore"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionSpreadScore"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracyTrendScore"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewDepthScore"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentQuality"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    -- Anti-gaming faktörleri
    "velocityPenalty"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "patternPenalty"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "antiGamingFactor"      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    -- Hesaplanmış
    "rawScore"              DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityMultiplier"     DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "consistencyCoef"       DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "finalScore"            DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier"                  TEXT        NOT NULL DEFAULT 'bronze',
    -- Meta
    "calculatedAt"          TIMESTAMP,
    "createdAt"             TIMESTAMP   NOT NULL DEFAULT NOW(),
    "updatedAt"             TIMESTAMP   NOT NULL DEFAULT NOW(),

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

ALTER TABLE "user_scores"
    ADD CONSTRAINT "user_scores_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. study_session_logs — Ham oturum telemetrisi
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "study_session_logs" (
    "id"                TEXT        NOT NULL,
    "userId"            TEXT        NOT NULL,
    "moduleId"          TEXT,
    "source"            TEXT        NOT NULL DEFAULT 'study',
    "startedAt"         TIMESTAMP   NOT NULL,
    "endedAt"           TIMESTAMP,
    "durationSec"       INTEGER     NOT NULL DEFAULT 0,
    "cardsAttempted"    INTEGER     NOT NULL DEFAULT 0,
    "cardsCorrect"      INTEGER     NOT NULL DEFAULT 0,
    "accuracyRate"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    -- SM-2 uyum
    "sm2DueCards"       INTEGER     NOT NULL DEFAULT 0,
    "sm2OnTimeCards"    INTEGER     NOT NULL DEFAULT 0,
    "sm2EarlyCards"     INTEGER     NOT NULL DEFAULT 0,
    -- Anomali
    "isAnomaly"         BOOLEAN     NOT NULL DEFAULT FALSE,
    "anomalyReason"     TEXT,
    "createdAt"         TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT "study_session_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "study_session_logs_userId_startedAt_idx"
    ON "study_session_logs"("userId", "startedAt");

CREATE INDEX IF NOT EXISTS "study_session_logs_userId_createdAt_idx"
    ON "study_session_logs"("userId", "createdAt");

ALTER TABLE "study_session_logs"
    ADD CONSTRAINT "study_session_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. content_adoption_logs — İçerik adoption takibi
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "content_adoption_logs" (
    "id"                TEXT        NOT NULL,
    "moduleId"          TEXT        NOT NULL,
    "ownerId"           TEXT        NOT NULL,
    "studentId"         TEXT        NOT NULL,
    "firstStudyAt"      TIMESTAMP   NOT NULL DEFAULT NOW(),
    "cardsStudied"      INTEGER     NOT NULL DEFAULT 0,
    "lastStudyAt"       TIMESTAMP   NOT NULL DEFAULT NOW(),
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

ALTER TABLE "content_adoption_logs"
    ADD CONSTRAINT "content_adoption_logs_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content_adoption_logs"
    ADD CONSTRAINT "content_adoption_logs_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
