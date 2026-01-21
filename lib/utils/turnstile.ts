export async function verifyTurnstileToken(token: string): Promise<boolean> {
  // Allow development bypass
  if (process.env.NODE_ENV === 'development' && token === 'dev-bypass-token') {
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token
      })
    });

    const result = await response.json();
    return result.success === true;
  } catch (_) {
    return false;
  }
}
