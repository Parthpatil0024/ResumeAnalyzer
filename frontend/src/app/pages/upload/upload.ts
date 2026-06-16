import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { Job } from '../../core/services/job';
import { Resume } from '../../core/services/resume';
import { Analysis } from '../../core/services/analysis';

import { Resume as ResumeModel } from '../../models/resume.model';
import { JobDescription as JobModel } from '../../models/job.model';
import { LucideAngularModule } from 'lucide-angular';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, FormsModule, LucideAngularModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload implements OnInit {
  private jobService = inject(Job);
  private resumeService = inject(Resume);
  private analysisService = inject(Analysis);
  private router = inject(Router);

  // Loaded resources lists (for match wizard)
  readonly resumes = signal<ResumeModel[]>([]);
  readonly jobs = signal<JobModel[]>([]);

  // Selection states for match wizard
  readonly selectedResumeId = signal<number | null>(null);
  readonly selectedJobId = signal<number | null>(null);

  // Resume Upload State
  selectedFile: File | null = null;
  readonly uploadingResume = signal<boolean>(false);
  readonly resumeSuccess = signal<string | null>(null);
  readonly resumeError = signal<string | null>(null);

  // Job Description Form State
  jobTitle = '';
  jobCompany = '';
  jobContent = '';
  readonly creatingJob = signal<boolean>(false);
  readonly jobSuccess = signal<string | null>(null);
  readonly jobError = signal<string | null>(null);

  // Match Wizard State
  readonly matching = signal<boolean>(false);
  readonly matchError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadResources();
  }

  loadResources(): void {
    forkJoin({
      resumes: this.resumeService.getResumes(),
      jobs: this.jobService.getJobs(),
    }).subscribe({
      next: (data) => {
        this.resumes.set(data.resumes);
        this.jobs.set(data.jobs);
      },
      error: (err) => console.error('Error loading resources in upload:', err),
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.resumeError.set('Only PDF files are allowed.');
        this.selectedFile = null;
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        this.resumeError.set('File size exceeds the 10MB limit.');
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.resumeError.set(null);
      this.resumeSuccess.set(null);
    }
  }

  uploadResume(): void {
    if (!this.selectedFile) return;

    this.uploadingResume.set(true);
    this.resumeError.set(null);
    this.resumeSuccess.set(null);

    this.resumeService
      .uploadResume(this.selectedFile)
      .pipe(finalize(() => this.uploadingResume.set(false)))
      .subscribe({
        next: (uploadedResume) => {
          this.resumeSuccess.set(`Successfully uploaded "${uploadedResume.fileName}"!`);
          this.selectedFile = null;
          // Refresh list and pre-select this resume
          this.resumes.update((list) => [uploadedResume, ...list]);
          this.selectedResumeId.set(uploadedResume.id);
        },
        error: (err) => {
          console.error('Error uploading resume:', err);
          this.resumeError.set(err.error?.message ?? 'Failed to upload resume PDF.');
        },
      });
  }

  createJobDescription(): void {
    if (!this.jobTitle || !this.jobCompany || !this.jobContent) {
      this.jobError.set('Please fill out all fields.');
      return;
    }

    this.creatingJob.set(true);
    this.jobError.set(null);
    this.jobSuccess.set(null);

    this.jobService
      .createJob({
        title: this.jobTitle,
        company: this.jobCompany,
        content: this.jobContent,
      })
      .pipe(finalize(() => this.creatingJob.set(false)))
      .subscribe({
        next: (createdJob) => {
          this.jobSuccess.set(`Successfully created job "${createdJob.title}" at ${createdJob.company}!`);
          // Reset form fields
          this.jobTitle = '';
          this.jobCompany = '';
          this.jobContent = '';
          // Refresh list and pre-select this job description
          this.jobs.update((list) => [createdJob, ...list]);
          this.selectedJobId.set(createdJob.id);
        },
        error: (err) => {
          console.error('Error creating job description:', err);
          this.jobError.set('Failed to create job description.');
        },
      });
  }

  triggerMatch(): void {
    const resumeId = this.selectedResumeId();
    const jobId = this.selectedJobId();

    if (!resumeId || !jobId) {
      this.matchError.set('Please select both a resume and a job description.');
      return;
    }

    this.matching.set(true);
    this.matchError.set(null);

    this.analysisService
      .analyzeResume({ resumeId: +resumeId, jobDescriptionId: +jobId })
      .pipe(finalize(() => this.matching.set(false)))
      .subscribe({
        next: (analysisResult) => {
          // Redirect directly to details page
          this.router.navigate(['/analysis'], { queryParams: { id: analysisResult.id } });
        },
        error: (err) => {
          console.error('Error conducting match:', err);
          this.matchError.set(err.error?.message ?? 'Failed to perform match. Please try again.');
        },
      });
  }

  selectResume(eventOrValue: any): void {
    const val = eventOrValue?.target?.value ?? eventOrValue;
    this.selectedResumeId.set(val ? +val : null);
  }

  selectJob(eventOrValue: any): void {
    const val = eventOrValue?.target?.value ?? eventOrValue;
    this.selectedJobId.set(val ? +val : null);
  }
}
