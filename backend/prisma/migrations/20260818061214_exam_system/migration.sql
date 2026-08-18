-- CreateTable
CREATE TABLE "exam_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT 'General',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exam_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_position_key" ON "exam_questions"("position");

-- CreateIndex
CREATE INDEX "exam_questions_isActive_idx" ON "exam_questions"("isActive");

-- CreateIndex
CREATE INDEX "exam_questions_subject_idx" ON "exam_questions"("subject");

-- CreateIndex
CREATE INDEX "exam_attempts_userId_idx" ON "exam_attempts"("userId");

-- CreateIndex
CREATE INDEX "exam_attempts_submittedAt_idx" ON "exam_attempts"("submittedAt");
