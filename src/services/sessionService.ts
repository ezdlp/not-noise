
class SessionService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    console.log('[SessionService] Session initialized with ID:', this.sessionId);
  }

  private getOrCreateSessionId(): string {
    // Try to get existing session ID from storage
    const existingSession = sessionStorage.getItem('analytics_session_id');
    if (existingSession) {
      console.log('[SessionService] Using existing session ID:', existingSession);
      return existingSession;
    }

    // Create new session ID if none exists
    const newSession = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('analytics_session_id', newSession);
    console.log('[SessionService] Created new session ID:', newSession);
    return newSession;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const sessionService = new SessionService();
