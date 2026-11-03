import { registerStageChangedTask } from './stage-changed-task';

import { registerAutoReply } from './auto-reply';

let isRegistered = false;

export function registerAutomationModules() {
  if (isRegistered) return;
  isRegistered = true;

  registerAutoReply();
  registerStageChangedTask(); 
  
  console.log('✅ [AUTOMATION] Модули автоматизации зарегистрированы');
}