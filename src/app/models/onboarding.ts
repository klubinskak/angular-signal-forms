export interface onBoardingContactInfo {
  email: string;
  phoneNumbers: { type: 'Mobile' | 'Home' | 'Work'; number: string }[];
  secondaryEmail: string;
  preferredContactMethod: 'Email' | 'Phone' | 'SMS';
}

export interface OnboardingUserInfo {
  firstName: string;
  lastName: string;
  company: string;
  role: string;
}

export interface OnboardingPreferences {
  newsletter: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface OnboardingData {
  userInfo: OnboardingUserInfo;
  contactInfo: onBoardingContactInfo;
  preferences: OnboardingPreferences;
}