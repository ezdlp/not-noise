
/**
 * Service for handling browser session identifiers
 */
class SessionService {
  private sessionId: string | null = null;
  private readonly SESSION_ID_KEY = 'soundraiser_session_id';
  
  constructor() {
    // Initialize session ID when the service is created
    this.initSessionId();
  }
  
  /**
   * Get the current session ID
   */
  getSessionId(): string {
    if (!this.sessionId) {
      this.initSessionId();
    }
    
    return this.sessionId as string;
  }
  
  /**
   * Initialize or retrieve an existing session ID
   */
  private initSessionId(): void {
    try {
      // Try to get the session ID from sessionStorage
      let id = sessionStorage.getItem(this.SESSION_ID_KEY);
      
      // Create a new session ID if one doesn't exist
      if (!id) {
        id = this.generateSessionId();
        sessionStorage.setItem(this.SESSION_ID_KEY, id);
      }
      
      this.sessionId = id;
    } catch (error) {
      // Fallback in case sessionStorage is not available (e.g., private browsing mode)
      console.error('Error accessing sessionStorage:', error);
      this.sessionId = this.generateSessionId();
    }
  }
  
  /**
   * Generate a new random session ID
   */
  private generateSessionId(): string {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Clear the current session ID
   */
  clearSession(): void {
    try {
      sessionStorage.removeItem(this.SESSION_ID_KEY);
      this.sessionId = null;
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }
}

export const sessionService = new SessionService();
