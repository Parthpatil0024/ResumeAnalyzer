import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JobDescription, JobDetail, CreateJobRequest } from '../../models/job.model';

@Injectable({
  providedIn: 'root',
})
export class Job {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/jobs`;

  getJobs(): Observable<JobDescription[]> {
    return this.http.get<JobDescription[]>(this.apiUrl);
  }

  getJobById(id: number): Observable<JobDetail> {
    return this.http.get<JobDetail>(`${this.apiUrl}/${id}`);
  }

  createJob(request: CreateJobRequest): Observable<JobDescription> {
    return this.http.post<JobDescription>(this.apiUrl, request);
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
