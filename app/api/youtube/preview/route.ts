import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const info = await ytdl.getInfo(url);
    
    // Get the highest quality format that includes both video and audio
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highest',
      filter: 'audioandvideo' 
    });

    // Get the highest quality thumbnail
    const thumbnail = info.videoDetails.thumbnails.reduce((prev, current) => {
      return (prev.width > current.width) ? prev : current;
    }).url;

    return NextResponse.json({
      type: 'video',
      url: format.url,
      title: info.videoDetails.title,
      thumbnail: thumbnail,
      duration: info.videoDetails.lengthSeconds
    });
    
  } catch (error) {
    console.error('YouTube preview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video preview' },
      { status: 500 }
    );
  }
} 