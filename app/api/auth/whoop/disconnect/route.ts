import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear the Whoop authentication cookies
    response.cookies.delete('whoop_access_token');
    response.cookies.delete('whoop_refresh_token');
    
    return response;
  } catch (error) {
    console.error('Error disconnecting Whoop:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}