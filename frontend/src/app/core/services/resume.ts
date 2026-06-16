import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Resume as ResumeModel, ResumeDetail } from '../../models/resume.model';

@Injectable({
  providedIn: 'root',
})
export class Resume {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/resume`;

  getResumes(): Observable<ResumeModel[]> {
    return this.http.get<ResumeModel[]>(this.apiUrl);
  }

  getResumeById(id: number): Observable<ResumeDetail> {
    return this.http.get<ResumeDetail>(`${this.apiUrl}/${id}`);
  }

  uploadResume(file: File): Observable<ResumeModel> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ResumeModel>(`${this.apiUrl}/upload`, formData);
  }

  deleteResume(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
