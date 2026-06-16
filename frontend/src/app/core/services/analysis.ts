import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Analysis as AnalysisModel, AnalyzeRequest } from '../../models/analysis.model';

@Injectable({
  providedIn: 'root',
})
export class Analysis {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/resume`;

  analyzeResume(request: AnalyzeRequest): Observable<AnalysisModel> {
    return this.http.post<AnalysisModel>(`${this.apiUrl}/analyze`, request);
  }

  getAnalyses(): Observable<AnalysisModel[]> {
    return this.http.get<AnalysisModel[]>(`${this.apiUrl}/analyses`);
  }

  improveResume(analysisId: number): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/${analysisId}/improve`, {}, {
      responseType: 'blob'
    });
  }
}
