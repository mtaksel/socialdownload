import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    // For now, return mock data
    return NextResponse.json({
      type: 'image',
      url: 'https://picsum.photos/800/600', // placeholder image
    });
    
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    );
  }
} 