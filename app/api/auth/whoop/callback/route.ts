import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=whoop_auth_denied', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=whoop_auth_failed', request.url));
  }

  // Verify state parameter
  const storedState = request.cookies.get('whoop_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/?error=whoop_auth_invalid_state', request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.WHOOP_CLIENT_ID!,
        client_secret: process.env.WHOOP_CLIENT_SECRET!,
        redirect_uri: process.env.WHOOP_REDIRECT_URI!,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();

    // Store tokens securely (you might want to encrypt these)
    const response = NextResponse.redirect(new URL('/?whoop_connected=true', request.url));
    
    // Set secure cookies for tokens
    response.cookies.set('whoop_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokens.expires_in || 3600,
    });

    if (tokens.refresh_token) {
      response.cookies.set('whoop_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Clear the state cookie
    response.cookies.delete('whoop_oauth_state');

    return response;
  } catch (error) {
    console.error('Whoop OAuth error:', error);
    return NextResponse.redirect(new URL('/?error=whoop_auth_failed', request.url));
  }
}