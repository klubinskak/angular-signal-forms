import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  onBoardingContactInfo,
  OnboardingUserInfo,
  OnboardingPreferences,
  OnboardingData,
} from '../../../models/onboarding';
import { Field, form, required } from '@angular/forms/signals';
import { CommonModule } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule, Field],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.dark-theme]': 'isDarkTheme()',
  },
})
export class OnboardingComponent {
  // Step management
  currentStep = signal(0);
  totalSteps = 4;

  isDarkTheme = computed(() => {
    const theme = this.preferencesForm().value().theme;
    if (theme === 'auto') {
      return this.getSystemTheme() === 'dark';
    }
    return theme === 'dark';
  });

  // User Info (Step 1)
  protected readonly userInfo = signal<OnboardingUserInfo>({
    firstName: '',
    lastName: '',
    company: '',
    role: '',
  });

  protected readonly userInfoForm = form(this.userInfo, (path) => {
    required(path.firstName);
    required(path.lastName);
  });

  // Contact Info (Step 2)
  protected readonly contactInfo = signal<onBoardingContactInfo>({
    email: '',
    phoneNumbers: [],
    secondaryEmail: '',
    preferredContactMethod: 'Email',
  });

  protected readonly contactForm = form(this.contactInfo, (path) => {
    required(path.email);
  });

  // Preferences (Step 3)
  protected readonly preferences = signal<OnboardingPreferences>({
    newsletter: true,
    notifications: true,
    theme: 'auto',
    language: 'en',
  });

  protected readonly preferencesForm = form(this.preferences, (path) => {
    required(path.theme);
    required(path.language);
  });

  isFirstStep = computed(() => this.currentStep() === 0);
  isLastStep = computed(() => this.currentStep() === this.totalSteps - 1);
  canProceed = computed(() => {
    const step = this.currentStep();
    if (step === 1) return this.userInfoForm().valid();
    if (step === 2) return this.contactForm().valid();
    return true;
  });

  progressPercentage = computed(
    () => ((this.currentStep() + 1) / this.totalSteps) * 100
  );

  constructor() {
    toObservable(this.preferencesForm().value).subscribe((value) => {
      console.log('Preferences Updated:', value);
    });
  }

  addPhoneNumber() {
    const current = this.contactInfo();
    this.contactInfo.set({
      ...current,
      phoneNumbers: [...current.phoneNumbers, { type: 'Mobile', number: '' }],
    });
  }

  removePhoneNumber(index: number) {
    const current = this.contactInfo();
    this.contactInfo.set({
      ...current,
      phoneNumbers: current.phoneNumbers.filter((_, i) => i !== index),
    });
  }

  updatePhoneNumber(index: number, field: 'type' | 'number', value: string) {
    const current = this.contactInfo();
    const updated = [...current.phoneNumbers];
    updated[index] = { ...updated[index], [field]: value };
    this.contactInfo.set({ ...current, phoneNumbers: updated });
  }

  // Navigation
  nextStep() {
    if (this.currentStep() < this.totalSteps - 1 && this.canProceed()) {
      this.currentStep.update((step) => step + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update((step) => step - 1);
    }
  }

  goToStep(step: number) {
    if (step >= 0 && step < this.totalSteps) {
      this.currentStep.set(step);
    }
  }

  submitOnboarding() {
    const onboardingData: OnboardingData = {
      userInfo: this.userInfo(),
      contactInfo: this.contactInfo(),
      preferences: this.preferences(),
    };
    console.log('Onboarding Complete!', onboardingData);
  }

  private getSystemTheme(): 'light' | 'dark' {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  }
}
