'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useEffect, useState } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onVerify, onError, onExpire }: TurnstileProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!siteKey) {
      setHasError(true);
    }
    setIsLoading(false);
  }, [siteKey]);

  const handleError = () => {
    setErrorCount((prev) => prev + 1);
    setHasError(true);
    onError?.();
  };

  const handleSuccess = (token: string) => {
    setHasError(false);
    setErrorCount(0);
    onVerify(token);
  };

  const handleDevBypass = () => {
    onVerify('dev-bypass-token');
  };

  if (isLoading) {
    return (
      <div className="flex h-16 items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading security verification...</div>
      </div>
    );
  }

  if (!siteKey || hasError || (isDevelopment && errorCount > 0)) {
    return (
      <div className="flex flex-col items-center space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="text-center text-sm text-blue-800 dark:text-blue-200">
          {!siteKey
            ? 'Turnstile site key not configured'
            : hasError
              ? 'Security verification failed'
              : 'Security verification (Development Mode)'}
        </div>
        <button
          type="button"
          onClick={handleDevBypass}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
        >
          Continue with Development Bypass
        </button>
        {isDevelopment && (
          <div className="text-center text-xs text-blue-600 dark:text-blue-400">
            In production, users will complete Turnstile verification
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex justify-center">
        <Turnstile
          siteKey={siteKey}
          onSuccess={handleSuccess}
          onError={handleError}
          onExpire={onExpire}
        />
      </div>
      {isDevelopment && (
        <button
          type="button"
          onClick={handleDevBypass}
          className="text-muted-foreground text-xs underline hover:no-underline"
        >
          Skip verification (Dev only)
        </button>
      )}
    </div>
  );
}
