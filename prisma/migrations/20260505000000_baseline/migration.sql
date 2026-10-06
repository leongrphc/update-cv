-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CVVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "cvText" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'optimization',
    "sourceId" TEXT,
    "atsScore" INTEGER,
    "targetRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CVVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CVProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "fileName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CVProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT NOT NULL,
    "preferredSkills" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "experienceLevel" TEXT,
    "industry" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Optimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "cvProfileId" TEXT,
    "jobPostingId" TEXT NOT NULL,
    "originalCV" TEXT NOT NULL,
    "optimizedCV" TEXT NOT NULL,
    "atsScoreBefore" INTEGER NOT NULL,
    "atsScoreAfter" INTEGER NOT NULL,
    "matchedKeywords" TEXT NOT NULL,
    "addedKeywords" TEXT NOT NULL,
    "missingSkills" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "targetRole" TEXT,
    "roleAdaptations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Optimization_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Optimization_cvProfileId_fkey" FOREIGN KEY ("cvProfileId") REFERENCES "CVProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Optimization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "jobPostingId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoverLetter_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoverLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillGap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "missingSkill" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "learningPath" TEXT,
    "estimatedTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillGap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "keywords" TEXT NOT NULL,
    "location" TEXT,
    "jobType" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobSearchResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobSearchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "jobType" TEXT,
    "postedAt" TEXT,
    "url" TEXT,
    "description" TEXT,
    "salary" TEXT,
    "experienceLevel" TEXT,
    "sector" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobSearchResult_jobSearchId_fkey" FOREIGN KEY ("jobSearchId") REFERENCES "JobSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreatedCV" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "personalInfo" TEXT NOT NULL,
    "experiences" TEXT NOT NULL,
    "educations" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "templateId" TEXT NOT NULL DEFAULT 'modern',
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreatedCV_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "cvText" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "totalQuestions" INTEGER NOT NULL DEFAULT 5,
    "currentQuestion" INTEGER NOT NULL DEFAULT 0,
    "overallScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "expectedTopics" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "userAnswer" TEXT,
    "score" REAL,
    "feedback" TEXT,
    "strengths" TEXT,
    "improvements" TEXT,
    "sampleAnswer" TEXT,
    "answeredAt" DATETIME,
    CONSTRAINT "InterviewQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkedInProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "headline" TEXT,
    "location" TEXT,
    "summary" TEXT,
    "experience" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "certifications" TEXT,
    "languages" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'pdf',
    "originalText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkedInProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "location" TEXT,
    "jobType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastChecked" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobAlertId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'job_match',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "jobUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_jobAlertId_fkey" FOREIGN KEY ("jobAlertId") REFERENCES "JobAlert" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CVVersion_userId_idx" ON "CVVersion"("userId");

-- CreateIndex
CREATE INDEX "CVProfile_userId_idx" ON "CVProfile"("userId");

-- CreateIndex
CREATE INDEX "Optimization_userId_idx" ON "Optimization"("userId");

-- CreateIndex
CREATE INDEX "Optimization_jobPostingId_idx" ON "Optimization"("jobPostingId");

-- CreateIndex
CREATE INDEX "CoverLetter_userId_idx" ON "CoverLetter"("userId");

-- CreateIndex
CREATE INDEX "CoverLetter_jobPostingId_idx" ON "CoverLetter"("jobPostingId");

-- CreateIndex
CREATE INDEX "SkillGap_userId_idx" ON "SkillGap"("userId");

-- CreateIndex
CREATE INDEX "JobSearch_userId_idx" ON "JobSearch"("userId");

-- CreateIndex
CREATE INDEX "JobSearchResult_jobSearchId_idx" ON "JobSearchResult"("jobSearchId");

-- CreateIndex
CREATE INDEX "CreatedCV_userId_idx" ON "CreatedCV"("userId");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_idx" ON "InterviewSession"("userId");

-- CreateIndex
CREATE INDEX "InterviewQuestion_sessionId_idx" ON "InterviewQuestion"("sessionId");

-- CreateIndex
CREATE INDEX "LinkedInProfile_userId_idx" ON "LinkedInProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "JobAlert_userId_idx" ON "JobAlert"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_jobAlertId_idx" ON "Notification"("jobAlertId");

