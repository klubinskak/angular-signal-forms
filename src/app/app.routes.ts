import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'onboarding',
        loadComponent: () => import('./feature/pages/onboarding/onboarding.component').then(m => m.OnboardingComponent)
    }
];
