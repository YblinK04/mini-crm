export interface EmailFormState {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  ownerEmail: string;
  emailNotificationsEnabled: boolean;
  notifyOnNewLead: boolean;
  notifyDailyDigest: boolean;
}

export interface EmailSettingsData {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpFrom: string;
  hasSmtpPassword: boolean;
  ownerEmail: string;
  emailNotificationsEnabled: boolean;
  notifyOnNewLead: boolean;
  notifyDailyDigest: boolean;
  smtpLastTestedAt: string | null;
  smtpLastTestOk: boolean | null;
  smtpLastTestError: string | null;
}

export const INITIAL_FORM_STATE: EmailFormState = {
  smtpHost: '',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPassword: '',
  smtpFrom: '',
  ownerEmail: '',
  emailNotificationsEnabled: false,
  notifyOnNewLead: true,
  notifyDailyDigest: true,
};