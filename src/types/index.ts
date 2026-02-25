// ============================================
// CV OPTIMIZER - TYPE DEFINITIONS
// ============================================

// ============================================
// OPTIMIZATION OPTIONS & MODES
// ============================================

export type OptimizationMode = 'standard' | 'aggressive' | 'corporate' | 'startup';
export type ExperienceLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead';
export type CVLanguage = 'tr' | 'en';
export type IndustryType = 'tech' | 'finance' | 'health' | 'ecommerce' | 'consulting' | 'manufacturing' | 'other';
export type PDFTemplateId = 'modern' | 'classic' | 'creative' | 'executive' | 'minimal' | 'diamond';
export type EnhanceType = 'metrics' | 'summary' | 'keywords';

export interface CVTemplateTheme {
  primaryColor: string;
  accentColor: string;
  fontFamily: 'Open Sans' | 'Helvetica' | 'Times-Roman' | 'Courier';
  fontSize: number;
}

export const DEFAULT_THEME: CVTemplateTheme = {
  primaryColor: '#1a1a1a',
  accentColor: '#2563eb',
  fontFamily: 'Open Sans',
  fontSize: 10,
};

export interface OptimizationOptions {
  mode: OptimizationMode;
  experienceLevel: ExperienceLevel;
  language: CVLanguage;
  industry?: IndustryType;
}

export interface ProTip {
  category: 'interview' | 'networking' | 'application' | 'skills';
  tip: string;
}

export interface CVData {
  originalText: string;
  optimizedText: string;
  sections: CVSection[];
}

export interface CVSection {
  title: string;
  originalContent: string;
  optimizedContent: string;
}

// Optimization Result Types
export interface OptimizationResult {
  success: boolean;
  originalCV: string;
  optimizedCV: string;
  targetRole: string;
  improvements: string[];
  roleAdaptations: string[];
  keywords: KeywordAnalysis;
  atsScore: ATSScore;
  skillGaps: SkillGapItem[];
  proTips?: ProTip[];
  options?: OptimizationOptions;
}

export interface KeywordAnalysis {
  matched: string[];
  added: string[];
  missing: string[];
}

export interface ATSScore {
  before: number;
  after: number;
}

export interface SkillGapItem {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  suggestion: string;
}

// Job Analysis Types
export interface JobAnalysis {
  title: string;
  company?: string;
  industry: string;
  experienceLevel: "Junior" | "Mid" | "Senior" | "Lead";
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  responsibilities: string[];
  benefits?: string[];
  redFlags?: string[];
  applicationTips: string[];
}

// Cover Letter Types
export interface CoverLetterResult {
  coverLetter: string;
  highlights: string[];
  callToAction: string;
}

export type CoverLetterTone = "professional" | "enthusiastic" | "formal";

// Skill Gap Analysis Types
export interface SkillGapAnalysis {
  gaps: DetailedSkillGap[];
  overallReadiness: number;
  strongPoints: string[];
  recommendations: string[];
}

export interface DetailedSkillGap {
  skill: string;
  category: "technical" | "soft" | "certification" | "domain";
  importance: "critical" | "important" | "nice-to-have";
  currentLevel: "none" | "beginner" | "intermediate" | "advanced";
  requiredLevel: "beginner" | "intermediate" | "advanced" | "expert";
  learningPath: LearningPath;
  workaround: string;
}

export interface LearningPath {
  resources: string[];
  courses: string[];
  certifications: string[];
  estimatedTime: string;
}

// Job Comparison Types
export interface JobComparison {
  jobId: string;
  title: string;
  company?: string;
  matchScore: number;
  strengths: string[];
  gaps: string[];
  effort: "low" | "medium" | "high";
  recommendation: string;
}

export interface JobComparisonResult {
  comparisons: JobComparison[];
  bestMatch: string;
  overallStrategy: string;
}

// API Request/Response Types
export interface ParsePDFResponse {
  success: boolean;
  text: string;
  error?: string;
}

export interface OptimizeRequest {
  cvText: string;
  jobDescription: string;
  targetRole?: string;
}

export interface CoverLetterRequest {
  cvText: string;
  jobDescription: string;
  tone?: CoverLetterTone;
}

export interface SkillGapRequest {
  cvText: string;
  jobDescription: string;
}

export interface CompareJobsRequest {
  cvText: string;
  jobs: { id: string; description: string }[];
}

// UI State Types
export interface AppState {
  cvText: string;
  jobDescriptions: JobDescriptionItem[];
  activeTab: "optimize" | "compare" | "gap" | "cover-letter";
  isLoading: boolean;
  error: string | null;
}

export interface JobDescriptionItem {
  id: string;
  text: string;
  title?: string;
}

// ============================================
// AI INTERVIEW SIMULATION TYPES
// ============================================

export interface InterviewSession {
  id: string;
  cvText: string;
  jobDescription: string;
  targetRole: string;
  status: "in_progress" | "completed";
  totalQuestions: number;
  currentQuestion: number;
  overallScore?: number;
  createdAt: string;
  completedAt?: string;
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  questionNumber: number;
  questionType: "technical" | "behavioral" | "situational" | "competency";
  question: string;
  expectedTopics: string[];
  difficulty: "easy" | "medium" | "hard";
  userAnswer?: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  sampleAnswer?: string;
  answeredAt?: string;
}

export interface InterviewGenerateRequest {
  cvText: string;
  jobDescription: string;
  targetRole?: string;
  questionCount?: number;
}

export interface InterviewGenerateResult {
  sessionId: string;
  questions: GeneratedQuestion[];
  targetRole: string;
}

export interface GeneratedQuestion {
  questionNumber: number;
  questionType: "technical" | "behavioral" | "situational" | "competency";
  question: string;
  expectedTopics: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface InterviewEvaluateRequest {
  sessionId: string;
  questionId: string;
  answer: string;
}

export interface InterviewEvaluateResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
  isLastQuestion: boolean;
  overallScore?: number;
}

export interface InterviewSessionResult {
  session: InterviewSession;
  summary: InterviewSummary;
}

export interface InterviewSummary {
  overallScore: number;
  totalQuestions: number;
  answeredQuestions: number;
  strongAreas: string[];
  improvementAreas: string[];
  generalFeedback: string;
  nextSteps: string[];
}

// ============================================
// LINKEDIN PROFILE TYPES
// ============================================

export interface LinkedInProfile {
  id?: string;
  userId?: string;
  fullName: string;
  headline?: string;
  location?: string;
  summary?: string;
  experience: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
  certifications?: LinkedInCertification[];
  languages?: LinkedInLanguage[];
  sourceType: "pdf" | "manual";
  originalText?: string;
}

export interface LinkedInExperience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface LinkedInEducation {
  school: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface LinkedInCertification {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface LinkedInLanguage {
  language: string;
  proficiency: "elementary" | "limited" | "professional" | "full" | "native";
}

export interface LinkedInParseRequest {
  pdfText: string;
}

export interface LinkedInParseResult {
  success: boolean;
  profile: LinkedInProfile;
  extractedSections: string[];
}

export interface LinkedInMergeRequest {
  cvText: string;
  linkedInProfile: LinkedInProfile;
  priority: "cv" | "linkedin" | "balanced";
}

export interface LinkedInMergeResult {
  mergedCV: string;
  addedFromLinkedIn: string[];
  enhancedSections: string[];
  conflicts: MergeConflict[];
}

export interface MergeConflict {
  section: string;
  cvValue: string;
  linkedInValue: string;
  resolution: string;
}

export interface LinkedInManualRequest {
  profile: Omit<LinkedInProfile, "id" | "sourceType" | "originalText">;
}

// ============================================
// CREATE CV FROM SCRATCH TYPES
// ============================================

export interface CVPersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  summary?: string;
}

export interface CVExperienceEntry {
  id: string;
  position: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  bullets: string[];
}

export interface CVEducationEntry {
  id: string;
  school: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

export interface CVLanguageEntry {
  id: string;
  language: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Ana Dil";
}

export interface CVCertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date?: string;
}

export interface CVSkillsData {
  technical: string[];
  soft: string[];
  languages: CVLanguageEntry[];
  certifications: CVCertificationEntry[];
}

export interface CreateCVFormData {
  personalInfo: CVPersonalInfo;
  experiences: CVExperienceEntry[];
  educations: CVEducationEntry[];
  skills: CVSkillsData;
  templateId: "modern" | "classic" | "creative" | "executive" | "minimal" | "diamond";
  title?: string;
  cvLang?: "tr" | "en";
}

export interface EnhanceCVContentRequest {
  content: string;
  contentType: "bullet" | "summary" | "title";
  context?: string;
}

export interface EnhanceCVContentResult {
  enhanced: string;
  alternatives: string[];
}

export interface GenerateSummaryRequest {
  personalInfo: CVPersonalInfo;
  experiences: CVExperienceEntry[];
  skills: CVSkillsData;
}

export interface GenerateSummaryResult {
  summary: string;
  keywords: string[];
}
