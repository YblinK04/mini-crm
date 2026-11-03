export async function register() {
 
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  try {
    const { registerAutomationModules } = await import('@/modules/automation');
   
    registerAutomationModules();
  } catch (error) {
    console.error(
      '[instrumentation] Failed to register automation modules:',
      error,
    );

    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}