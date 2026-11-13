-- CreateTable
CREATE TABLE "LearningJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "depth" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "syllabus" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSlide" (
    "id" TEXT NOT NULL,
    "learningJourneyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "peekingQuestion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserJourneyLibrary" (
    "userId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserJourneyLibrary_pkey" PRIMARY KEY ("userId","journeyId")
);

-- CreateIndex
CREATE INDEX "LearningJourney_userId_idx" ON "LearningJourney"("userId");

-- CreateIndex
CREATE INDEX "LearningJourney_status_idx" ON "LearningJourney"("status");

-- CreateIndex
CREATE INDEX "LearningSlide_learningJourneyId_idx" ON "LearningSlide"("learningJourneyId");

-- AddForeignKey
ALTER TABLE "LearningJourney" ADD CONSTRAINT "LearningJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSlide" ADD CONSTRAINT "LearningSlide_learningJourneyId_fkey" FOREIGN KEY ("learningJourneyId") REFERENCES "LearningJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJourneyLibrary" ADD CONSTRAINT "UserJourneyLibrary_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "LearningJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJourneyLibrary" ADD CONSTRAINT "UserJourneyLibrary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
