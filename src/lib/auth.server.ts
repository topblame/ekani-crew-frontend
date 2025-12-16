import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from './env';

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.toString();
}

export async function checkAuthServer(): Promise<boolean> {
  const cookieHeader = await getCookieHeader();

  try {
    const response = await fetch(`${env.API_BASE_URL}/auth/status`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.logged_in === true;
  } catch {
    return false;
  }
}

async function checkProfileComplete(): Promise<boolean> {
  const cookieHeader = await getCookieHeader();

  try {
    const response = await fetch(`${env.API_BASE_URL}/user/profile`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const data = await response.json();
    return !!(data.mbti && data.gender);
  } catch {
    return false;
  }
}

export async function requireAuth(): Promise<void> {
  const isLoggedIn = await checkAuthServer();
  if (!isLoggedIn) {
    redirect('/login');
  }

  const hasProfile = await checkProfileComplete();
  if (!hasProfile) {
    redirect('/profile');
  }
}