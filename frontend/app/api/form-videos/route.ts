/**
 * Frontend API Route for Form Videos
 * Proxies requests to backend Veo2 form video service
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/form-videos/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate form video' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Form Video API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exerciseId = searchParams.get('exerciseId');
    const variation = searchParams.get('variation') || 'standard';
    const difficulty = searchParams.get('difficulty') || 'intermediate';

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/form-videos/${exerciseId}?variation=${variation}&difficulty=${difficulty}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (backendResponse.status === 404) {
      return NextResponse.json(
        { error: 'Form video not found', needsGeneration: true },
        { status: 404 }
      );
    }

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch form video' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Form Video API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}