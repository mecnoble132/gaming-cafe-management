import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PROD = import.meta.env.PROD;

// Initialize Sentry dynamically if a DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions for performance profiling
    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample rate for regular sessions
    replaysOnErrorSampleRate: 1.0, // Sample rate for sessions with errors
    environment: IS_PROD ? 'production' : 'development',
  });
  console.log('[CoreControl Logger] Centralized error tracking initialized with Sentry.');
} else {
  console.warn('[CoreControl Logger] VITE_SENTRY_DSN not found. Error tracking running in local mode.');
}

/**
 * Capture and log an error to Sentry (if enabled) and local diagnostics console.
 */
export function logError(error: Error | string, context?: Record<string, any>) {
  const errObject = typeof error === 'string' ? new Error(error) : error;

  // Log locally
  console.error('[CoreControl Error]', {
    message: errObject.message,
    stack: errObject.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // Report to Sentry
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(errObject);
    });
  }
}

/**
 * Log informational logs, capturing breadcrumbs for future errors.
 */
export function logInfo(message: string, context?: Record<string, any>) {
  console.log(`[CoreControl Info] ${message}`, context || '');

  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category: 'app-info',
      message,
      level: 'info',
      data: context,
    });
  }
}
