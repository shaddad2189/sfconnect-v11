/**
 * Stub SDK file - Manus OAuth removed for standalone deployment
 * This file is kept for compatibility but all OAuth functionality is disabled
 */

export class SDK {
  constructor() {
    console.warn("[SDK] Manus OAuth is disabled in standalone mode");
  }

  async getUserFromSession() {
    throw new Error("Manus OAuth is not available in standalone mode. Use email/password authentication.");
  }
}

export const sdk = new SDK();
