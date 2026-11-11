import { registerAutoReply } from './auto-reply';
import { registerAutoTaskOnStage } from './auto-task-on-stage';
import { registerEmailOnNewLead } from './email-on-new-lead';
import { registerEmailDailyDigest } from './email-daily-digest';

declare global {
  var __automationRegistered: boolean | undefined;
}

export function registerAutomationModules() {
  if (globalThis.__automationRegistered) return;
  globalThis.__automationRegistered = true;

  registerAutoReply();
  registerAutoTaskOnStage();
  registerEmailOnNewLead();
  registerEmailDailyDigest();

  console.log('✅ [AUTOMATION] Модули автоматизации зарегистрированы');
}