import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

import { AuthService } from '../../core/services/auth.service';
import { Job } from '../../core/services/job';
import { Resume } from '../../core/services/resume';
import { Analysis } from '../../core/services/analysis';

import { Resume as ResumeModel } from '../../models/resume.model';
import { JobDescription as JobModel } from '../../models/job.model';
import { Analysis as AnalysisModel } from '../../models/analysis.model';

import { LucideAngularModule, AlertTriangle, Sparkles, Zap, ChartBar, FolderOpen, FileText, Briefcase } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../../shared/ui/dialog/dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private jobService = inject(Job);
  private resumeService = inject(Resume);
  private analysisService = inject(Analysis);
  private dialog = inject(MatDialog);

  // States
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly matching = signal<boolean>(false);
  readonly matchSuccessMessage = signal<string | null>(null);

  // Data lists
  readonly resumes = signal<ResumeModel[]>([]);
  readonly jobs = signal<JobModel[]>([]);
  readonly analyses = signal<AnalysisModel[]>([]);

  // Selection states for Quick Match
  readonly selectedResumeId = signal<number | null>(null);
  readonly selectedJobId = signal<number | null>(null);

  // Computed Stats
  readonly totalResumes = computed(() => this.resumes().length);
  readonly totalJobs = computed(() => this.jobs().length);
  readonly totalMatches = computed(() => this.analyses().length);
  readonly averageMatchScore = computed(() => {
    const list = this.analyses();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + curr.matchScore, 0);
    return Math.round(sum / list.length);
  });

  // Current User Info
  readonly currentUser = this.authService.getCurrentUser();

  ngOnInit(): void {
    this.loadDashboardData();
  }

  getBlobUrl(blobUrl: string): string {
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${blobUrl}`;
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      resumes: this.resumeService.getResumes(),
      jobs: this.jobService.getJobs(),
      analyses: this.analysisService.getAnalyses(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.resumes.set(data.resumes);
          this.jobs.set(data.jobs);
          // Sort analyses by analyzedAt descending
          const sortedAnalyses = data.analyses.sort(
            (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
          );
          this.analyses.set(sortedAnalyses);
        },
        error: (err) => {
          console.error('Error fetching dashboard data:', err);
          this.errorMessage.set('Failed to load dashboard data. Please check if backend is running.');
        },
      });
  }

  onDeleteResume(id: number): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Delete Resume',
        message: 'Are you sure you want to delete this resume? All associated matches will also be deleted.',
        type: 'confirm',
        confirmText: 'Delete',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.resumeService.deleteResume(id).subscribe({
          next: () => {
            // Remove from list
            this.resumes.update((list) => list.filter((r) => r.id !== id));
            // Refresh analyses just in case CASCADE deleted associated analyses in backend
            this.refreshAnalyses();
          },
          error: (err) => {
            console.error('Error deleting resume:', err);
            this.errorMessage.set('Failed to delete resume.');
          },
        });
      }
    });
  }

  onDeleteJob(id: number): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Delete Job Description',
        message: 'Are you sure you want to delete this job description? All associated matches will also be deleted.',
        type: 'confirm',
        confirmText: 'Delete',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.jobService.deleteJob(id).subscribe({
          next: () => {
            // Remove from list
            this.jobs.update((list) => list.filter((j) => j.id !== id));
            // Refresh analyses just in case CASCADE deleted associated analyses in backend
            this.refreshAnalyses();
          },
          error: (err) => {
            console.error('Error deleting job:', err);
            this.errorMessage.set('Failed to delete job description.');
          },
        });
      }
    });
  }

  private refreshAnalyses(): void {
    this.analysisService.getAnalyses().subscribe({
      next: (list) => {
        const sortedAnalyses = list.sort(
          (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
        );
        this.analyses.set(sortedAnalyses);
      },
      error: (err) => console.error('Error refreshing analyses:', err),
    });
  }

  triggerMatch(): void {
    const resumeId = this.selectedResumeId();
    const jobId = this.selectedJobId();

    if (!resumeId || !jobId) {
      this.errorMessage.set('Please select both a resume and a job description to analyze.');
      return;
    }

    this.matching.set(true);
    this.errorMessage.set(null);
    this.matchSuccessMessage.set(null);

    this.analysisService
      .analyzeResume({ resumeId: +resumeId, jobDescriptionId: +jobId })
      .pipe(finalize(() => this.matching.set(false)))
      .subscribe({
        next: (newMatch) => {
          this.matchSuccessMessage.set('Analysis successfully completed!');
          // Prepend to analyses list
          this.analyses.update((list) => [newMatch, ...list]);
          // Reset selections
          this.selectedResumeId.set(null);
          this.selectedJobId.set(null);
        },
        error: (err) => {
          console.error('Error running resume analysis:', err);
          this.errorMessage.set(
            err.error?.message ?? 'Failed to perform AI analysis. Check backend server and try again.'
          );
        },
      });
  }

  selectResume(eventOrValue: any): void {
    const value = eventOrValue?.target?.value ?? eventOrValue;
    this.selectedResumeId.set(value ? +value : null);
  }

  selectJob(eventOrValue: any): void {
    const value = eventOrValue?.target?.value ?? eventOrValue;
    this.selectedJobId.set(value ? +value : null);
  }
}
