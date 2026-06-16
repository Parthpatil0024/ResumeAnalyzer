import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Analysis } from '../../core/services/analysis';
import { Analysis as AnalysisModel } from '../../models/analysis.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-history',
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private analysisService = inject(Analysis);

  // States
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly analyses = signal<AnalysisModel[]>([]);
  readonly searchQuery = signal<string>('');

  // Computed state for filtered history list
  readonly filteredAnalyses = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.analyses();

    if (!query) {
      return list;
    }

    return list.filter((item) => {
      const matchJobTitle = item.jobDescription.title?.toLowerCase().includes(query) ?? false;
      const matchCompany = item.jobDescription.company?.toLowerCase().includes(query) ?? false;
      const matchResume = item.resume.fileName?.toLowerCase().includes(query) ?? false;
      return matchJobTitle || matchCompany || matchResume;
    });
  });

  // Computed stats on filtered selection
  readonly totalCount = computed(() => this.filteredAnalyses().length);
  readonly averageScore = computed(() => {
    const list = this.filteredAnalyses();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + curr.matchScore, 0);
    return Math.round(sum / list.length);
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.analysisService
      .getAnalyses()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          // Sort descending by analyzedAt date
          const sorted = data.sort(
            (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
          );
          this.analyses.set(sorted);
        },
        error: (err) => {
          console.error('Error loading matching history:', err);
          this.errorMessage.set('Failed to retrieve matching history. Please check if backend is running.');
        },
      });
  }

  updateSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }
}
