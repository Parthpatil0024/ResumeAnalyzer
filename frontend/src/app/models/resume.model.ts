export interface Resume {
  id: number;
  fileName: string;
  blobUrl?: string;
  uploadedAt: string;
  textLength?: number;
}

export interface ResumeDetail extends Resume {
  extractedText: string;
}