import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Analysis as AnalysisService } from '../../core/services/analysis';
import { Analysis as AnalysisModel } from '../../models/analysis.model';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../../shared/ui/dialog/dialog.component';

@Component({
  selector: 'app-analysis',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './analysis.html',
  styleUrl: './analysis.scss',
})
export class Analysis implements OnInit {
  private analysisService = inject(AnalysisService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // States
  readonly loading = signal<boolean>(true);
  readonly improving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly analysisDetails = signal<AnalysisModel | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const idString = params.get('id');
      if (idString) {
        const id = +idString;
        this.loadAnalysisDetails(id);
      } else {
        this.loading.set(false);
        this.errorMessage.set('No analysis ID provided in URL parameters.');
      }
    });
  }

  loadAnalysisDetails(id: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.analysisService
      .getAnalyses()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data: AnalysisModel[]) => {
          const matched = data.find((item: AnalysisModel) => item.id === id);
          if (matched) {
            this.analysisDetails.set(matched);
          } else {
            this.errorMessage.set(`Match analysis with ID ${id} was not found.`);
          }
        },
        error: (err: any) => {
          console.error('Error fetching analysis detail:', err);
          this.errorMessage.set('Failed to load analysis details. Check backend server.');
        },
      });
  }

  onImproveResume(): void {
    const analysis = this.analysisDetails();
    if (!analysis) return;

    this.improving.set(true);
    this.analysisService.improveResume(analysis.id)
      .pipe(finalize(() => this.improving.set(false)))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          // Change the extension of the original filename to .docx
          const originalName = analysis.resume.fileName;
          const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          a.download = `Improved_Resume_${baseName}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Error improving resume:', err);
          this.dialog.open(DialogComponent, {
            data: {
              title: 'Generation Failed',
              message: 'Failed to generate improved resume. Please try again.',
              type: 'alert'
            }
          });
        }
      });
  }
}
