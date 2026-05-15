interface ErrorLog {
  message: string;
  stack?: string;
  digest?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  componentStack?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private recentErrors: ErrorLog[] = [];
  private readonly MAX_RECENT_ERRORS = 100;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: ErrorLog) {
    // Add to recent errors
    this.recentErrors.unshift(error);
    if (this.recentErrors.length > this.MAX_RECENT_ERRORS) {
      this.recentErrors.pop();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', error);
    }

    // In production, you would typically send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Error tracking integration hook (Sentry/Datadog/etc.) can be added here.
    }
  }

  getRecentErrors(): ErrorLog[] {
    return [...this.recentErrors];
  }

  clearRecentErrors() {
    this.recentErrors = [];
  }
}

export const _logError = (error: ErrorLog) => {
  const _logger = ErrorLogger.getInstance();
  _logger.log(error);
};

export const _getRecentErrors = () => {
  const _logger = ErrorLogger.getInstance();
  return _logger.getRecentErrors();
};

export const _clearRecentErrors = () => {
  const _logger = ErrorLogger.getInstance();
  _logger.clearRecentErrors();
};

export { _logError as logError, _getRecentErrors as getRecentErrors, _clearRecentErrors as clearRecentErrors };
