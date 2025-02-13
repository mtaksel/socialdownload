import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { url, format } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Create temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-dlp-'));
    const outputPath = path.join(tempDir, 'video.mp4');

    // Download video using yt-dlp
    await execAsync(`yt-dlp -f ${format} -o "${outputPath}" ${url}`);

    // Read the downloaded file
    const videoBuffer = await fs.readFile(outputPath);

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="video.mp4"',
      },
    });
    
  } catch (error) {
    console.error('YouTube download error:', error);
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    );
  }
} 