import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';
import {
  LucideAngularModule,
  AlertTriangle,
  Sparkles,
  Zap,
  ChartBar,
  FolderOpen,
  FileText,
  Briefcase,
  Search,
  Lightbulb,
  Rocket,
  CheckCircle,
  AlertCircle,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(
      LucideAngularModule.pick({
        AlertTriangle,
        Sparkles,
        Zap,
        ChartBar,
        FolderOpen,
        FileText,
        Briefcase,
        Search,
        Lightbulb,
        Rocket,
        CheckCircle,
        AlertCircle,
      })
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ]
};
