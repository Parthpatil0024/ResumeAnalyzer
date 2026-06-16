import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard',
	},
	{
		path: 'login',
		loadComponent: () => import('./pages/login/login').then((m) => m.Login),
	},
	{
		path: 'dashboard',
		canActivate: [AuthGuard],
		loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
	},
	{
		path: 'upload',
		canActivate: [AuthGuard],
		loadComponent: () => import('./pages/upload/upload').then((m) => m.Upload),
	},
	{
		path: 'analysis',
		canActivate: [AuthGuard],
		loadComponent: () => import('./pages/analysis/analysis').then((m) => m.Analysis),
	},
	{
		path: 'history',
		canActivate: [AuthGuard],
		loadComponent: () => import('./pages/history/history').then((m) => m.History),
	},
	{
		path: '**',
		redirectTo: 'dashboard',
	},
];
