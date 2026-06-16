export interface JobDescription {
  id: number;
  title: string;
  company: string;
  createdAt: string;
  contentLength?: number;
}

export interface JobDetail extends JobDescription {
  content: string;
}

export interface CreateJobRequest {
  title: string;
  company: string;
  content: string;
}