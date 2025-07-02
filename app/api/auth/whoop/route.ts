import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing Whoop API configuration' },
      { status: 500 }
    );
  }

  // Generate a random state parameter for security
  const state = Math.random().toString(36).substring(2, 10);
  
  const authUrl = new URL('https://api.prod.whoop.com/oauth/oauth2/auth');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'read:recovery read:sleep read:workout read:profile');
  authUrl.searchParams.append('state', state);

  // Store state in a cookie for validation
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('whoop_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  return response;
}