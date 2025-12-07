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
import {
  applyEach,
  email,
  Field,
  form,
  required,
  validate,
} from '@angular/forms/signals';
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
    required(path.firstName, { message: 'First name is required' });
    required(path.lastName, { message: 'Last name is required' });
  });

  // Contact Info (Step 2)
  protected readonly contactInfo = signal<onBoardingContactInfo>({
    email: '',
    phoneNumbers: [],
    secondaryEmail: '',
    preferredContactMethod: 'Email',
  });

  protected readonly contactForm = form(this.contactInfo, (path) => {
    //email
    required(path.email);
    email(path.email, { message: 'Please enter a valid email address' });
    //secondary email
    required(path.secondaryEmail);
    email(path.secondaryEmail, {
      message: 'Please enter a valid email address',
    });
    validate(path.secondaryEmail, ({ value, valueOf }) => {
      const secondaryEmailValue = value();
      const emailValue = valueOf(path.email);
      if (secondaryEmailValue === emailValue) {
        return {
          kind: 'secondaryEmailMatch',
          message: 'Secondary email must be different from primary email',
        };
      }
      return null;
    });
    //preferredContactMethod
    validate(path.preferredContactMethod, ({ value, valueOf }) => {
      const method = value();
      const phoneNumbers = valueOf(path.phoneNumbers);
      if (method === 'Phone' && phoneNumbers.length === 0) {
        return {
          kind: 'noPhoneNumbers',
          message:
            'Please add at least one phone number to be contacted via Phone',
        };
      }
      return null;
    });
    //phone number item
    applyEach(path.phoneNumbers, (phonePath) => {
      required(phonePath.type);
      required(phonePath.number, { message: 'Phone number is required' });
      validate(phonePath.number, ({ value }) => {
        const number = value();

        // Tylko cyfry i opcjonalnie +
        if (number && !/^\+?\d+$/.test(number)) {
          return {
            kind: 'onlyDigits',
            message: 'Only digits allowed',
          };
        }
        return null;
      });
    });
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

  updatePhoneNumber(
    index: number,
    field: 'type' | 'number',
    value: string
  ): void {
    const current = this.contactInfo();
    const phoneNumber = current.phoneNumbers[index];

    if (phoneNumber === undefined) {
      console.error(`Phone number at index ${index} does not exist`);
      return;
    }

    const updated = [...current.phoneNumbers];
    updated[index] = { ...phoneNumber, [field]: value };
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
