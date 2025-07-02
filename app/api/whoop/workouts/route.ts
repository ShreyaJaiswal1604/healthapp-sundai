import { NextRequest, NextResponse } from 'next/server';
import { whoopAPI } from '@/lib/whoop';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('whoop_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated with Whoop' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start') || undefined;
    const end = searchParams.get('end') || undefined;
    const limit = parseInt(searchParams.get('limit') || '25');

    const workouts = await whoopAPI.getWorkouts(accessToken, start, end, limit);
    
    return NextResponse.json(workouts);
  } catch (error) {
    console.error('Failed to fetch Whoop workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout data' },
      { status: 500 }
    );
  }
}