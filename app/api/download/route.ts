import { NextResponse } from 'next/server';
import { validateUrl, downloadMedia } from '@/lib/mediaDownloader';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    const mediaData = await downloadMedia(validatedUrl);
    
    return new NextResponse(mediaData.buffer, {
      headers: {
        'Content-Type': mediaData.type,
        'Content-Disposition': `attachment; filename="${mediaData.filename}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download media' },
      { status: 500 }
    );
  }
} 