export interface Analysis {
  id: number;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  aiSummary: string;
  analyzedAt: string;
  resume: {
    fileName: string;
  };
  jobDescription: {
    title: string;
    company: string;
  };
}

export interface AnalyzeRequest {
  resumeId: number;
  jobDescriptionId: number;
}