export interface LoginVerificationState {
  isVerifying: boolean;
  verificationCode: string;
  phoneNumber: string;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  cooldownUntil: number | null;
}

export class LoginVerificationManager {
  private state: LoginVerificationState = {
    isVerifying: false,
    verificationCode: '',
    phoneNumber: '',
    error: null,
    attempts: 0,
    maxAttempts: 3,
    cooldownUntil: null
  };

  private listeners: Array<(state: LoginVerificationState) => void> = [];

  getState(): LoginVerificationState {
    return { ...this.state };
  }

  subscribe(listener: (state: LoginVerificationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  startVerification(phoneNumber: string): void {
    if (this.isInCooldown()) {
      this.state.error = 'Please wait before requesting another verification code';
      this.notifyListeners();
      return;
    }

    this.state = {
      ...this.state,
      isVerifying: true,
      phoneNumber,
      error: null,
      verificationCode: ''
    };
    this.notifyListeners();
  }

  setVerificationCode(code: string): void {
    this.state.verificationCode = code;
    this.state.error = null;
    this.notifyListeners();
  }

  submitVerification(): boolean {
    if (!this.state.verificationCode.trim()) {
      this.state.error = 'Please enter the verification code';
      this.notifyListeners();
      return false;
    }

    // Simulate verification logic
    const isValid = this.state.verificationCode.length >= 4;
    
    if (isValid) {
      this.state = {
        ...this.state,
        isVerifying: false,
        error: null,
        attempts: 0
      };
    } else {
      this.state.attempts += 1;
      this.state.error = 'Invalid verification code';
      
      if (this.state.attempts >= this.state.maxAttempts) {
        this.state.cooldownUntil = Date.now() + (5 * 60 * 1000); // 5 minutes
        this.state.isVerifying = false;
        this.state.error = 'Too many failed attempts. Please try again later.';
      }
    }

    this.notifyListeners();
    return isValid;
  }

  cancelVerification(): void {
    this.state = {
      ...this.state,
      isVerifying: false,
      verificationCode: '',
      error: null
    };
    this.notifyListeners();
  }

  setError(error: string): void {
    this.state.error = error;
    this.notifyListeners();
  }

  clearError(): void {
    this.state.error = null;
    this.notifyListeners();
  }

  isInCooldown(): boolean {
    if (!this.state.cooldownUntil) return false;
    return Date.now() < this.state.cooldownUntil;
  }

  getCooldownTimeRemaining(): number {
    if (!this.isInCooldown()) return 0;
    return Math.max(0, this.state.cooldownUntil! - Date.now());
  }

  reset(): void {
    this.state = {
      isVerifying: false,
      verificationCode: '',
      phoneNumber: '',
      error: null,
      attempts: 0,
      maxAttempts: 3,
      cooldownUntil: null
    };
    this.notifyListeners();
  }
}

// Export a singleton instance
export const loginVerificationManager = new LoginVerificationManager();