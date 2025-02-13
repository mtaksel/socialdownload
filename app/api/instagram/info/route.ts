import { NextResponse } from 'next/server';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

function extractInstagramId(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([^\/\?#]+)/,
    /instagram\.com\/reels?\/([^\/\?#]+)/,
    /instagram\.com\/tv\/([^\/\?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const mediaId = extractInstagramId(url);
    if (!mediaId) {
      return NextResponse.json({ error: 'Invalid Instagram URL' }, { status: 400 });
    }

    const isReel = url.includes('/reel/') || url.includes('/reels/');

    if (isReel) {
      // Create temporary directory for thumbnail
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'instagram-thumb-'));
      const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');

      try {
        // Download thumbnail using yt-dlp
        await execAsync(`yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg -o "${thumbnailPath}" ${url}`);
        
        // Read the thumbnail file
        const thumbnailBuffer = await fs.readFile(`${thumbnailPath}.jpg`);
        const base64Thumbnail = thumbnailBuffer.toString('base64');

        // Clean up
        await fs.rm(tempDir, { recursive: true, force: true });

        return NextResponse.json({
          title: 'Instagram Reel',
          thumbnail: `data:image/jpeg;base64,${base64Thumbnail}`,
          type: 'video',
          author: 'Instagram User',
          formats: [{
            quality: 'Original',
            format: 'best',
            container: 'mp4',
            hasAudio: true
          }]
        });
      } catch (error) {
        // Clean up on error
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        throw error;
      }
    } else {
      // For photos, use the direct media URL
      const mediaUrl = `https://www.instagram.com/p/${mediaId}/media/?size=l`;
      
      try {
        const mediaResponse = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const base64Image = Buffer.from(mediaResponse.data).toString('base64');
        const thumbnailUrl = `data:image/jpeg;base64,${base64Image}`;

        return NextResponse.json({
          title: 'Instagram Post',
          thumbnail: thumbnailUrl,
          type: 'image',
          author: 'Instagram User',
          formats: [{
            quality: 'Original',
            format: 'best',
            container: 'jpg',
            hasAudio: false
          }]
        });
      } catch (error) {
        // Fallback if direct media URL fails
        return NextResponse.json({
          title: 'Instagram Post',
          thumbnail: mediaUrl,
          type: 'image',
          author: 'Instagram User',
          formats: [{
            quality: 'Original',
            format: 'best',
            container: 'jpg',
            hasAudio: false
          }]
        });
      }
    }

  } catch (error) {
    console.error('Instagram info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram content. Please make sure the URL is correct and the content is public.' },
      { status: 500 }
    );
  }
} 