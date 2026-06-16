import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';

export interface DialogData {
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-dialog',
  imports: [CommonModule, MatDialogModule, LucideAngularModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title class="dialog-title">
          <lucide-icon [name]="data.type === 'confirm' ? 'alert-circle' : 'alert-triangle'" [size]="24" class="mr-2" [class.text-destructive]="data.type === 'alert'"></lucide-icon>
          <span>{{ data.title }}</span>
        </h2>
      </div>
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </div>
      <div mat-dialog-actions class="dialog-actions">
        <button *ngIf="data.type === 'confirm'" class="btn-cancel" (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
        <button class="btn-confirm" [class.btn-danger]="data.type === 'confirm'" (click)="onConfirm()">{{ data.confirmText || 'OK' }}</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 1.5rem;
      background: hsl(var(--card));
      color: hsl(var(--card-foreground));
      border-radius: var(--radius);
      min-width: 400px;
      max-width: 500px;
      box-sizing: border-box;
    }
    .dialog-header {
      margin-bottom: 1rem;
    }
    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: hsl(var(--foreground));
    }
    .text-destructive {
      color: hsl(var(--destructive));
    }
    .dialog-content {
      margin-bottom: 1.5rem;
      color: hsl(var(--muted-foreground));
      line-height: 1.5;
      font-size: 0.95rem;
    }
    .dialog-content p {
      margin: 0;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin: 0;
      padding: 0;
    }
    button {
      padding: 0.5rem 1rem;
      border-radius: calc(var(--radius) - 2px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      font-size: 0.875rem;
    }
    .btn-cancel {
      background: transparent;
      color: hsl(var(--foreground));
      border: 1px solid hsl(var(--border));
    }
    .btn-cancel:hover {
      background: hsl(var(--muted));
    }
    .btn-confirm {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }
    .btn-confirm:hover {
      opacity: 0.9;
    }
    .btn-danger {
      background: hsl(var(--destructive));
      color: hsl(var(--destructive-foreground));
    }
    .btn-danger:hover {
      opacity: 0.9;
    }
  `]
})
export class DialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
