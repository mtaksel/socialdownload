import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

function extractTwitterId(url: string): string | null {
  const patterns = [
    /(?:twitter|x)\.com\/\w+\/status\/(\d+)/,
    /(?:twitter|x)\.com\/\w+\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

export async function POST(request: Request) {
  let tempDir = '';
  
  try {
    const { url, type, format, title } = await request.json();
    console.log('Received request:', { url, type, format, title });
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const tweetId = extractTwitterId(url);
    if (!tweetId) {
      return NextResponse.json({ error: 'Invalid Twitter URL' }, { status: 400 });
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'twitter-dl-'));
    const outputPath = path.join(tempDir, `content`);

    try {
      let ytdlpCommand = '';

      if (type === 'audio') {
        // Modified audio download command
        ytdlpCommand = `yt-dlp -f "ba" --extract-audio --audio-format mp4 -o "${outputPath}.%(ext)s" ${url}`;
      } else if (type === 'video') {
        ytdlpCommand = `yt-dlp -f ${format || 'best'} -o "${outputPath}.%(ext)s" ${url}`;
      } else {
        ytdlpCommand = `yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg -o "${outputPath}" ${url}`;
      }

      console.log('Executing command:', ytdlpCommand);
      const { stdout, stderr } = await execAsync(ytdlpCommand);
      console.log('Command output:', stdout);
      if (stderr) console.error('Command stderr:', stderr);

      const files = await fs.readdir(tempDir);
      console.log('Files in temp directory:', files);

      const downloadedFile = files.find(file => file.startsWith('content'));
      if (!downloadedFile) {
        throw new Error('Downloaded file not found');
      }

      const filePath = path.join(tempDir, downloadedFile);
      const buffer = await fs.readFile(filePath);

      const contentType = type === 'audio' ? 'audio/mp4' : 
                         type === 'video' ? 'video/mp4' : 
                         'image/jpeg';
      
      const extension = type === 'audio' ? 'm4a' : 
                       type === 'video' ? 'mp4' : 
                       'jpg';

      const safeTitle = sanitizeFilename(title || 'twitter_content');
      const filename = `${safeTitle}_${tweetId}.${extension}`;

      await fs.rm(tempDir, { recursive: true, force: true });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error('Download process error:', error);
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(e => 
          console.error('Cleanup error:', e)
        );
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Twitter download error:', error);
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(e => 
        console.error('Final cleanup error:', e)
      );
    }
    return NextResponse.json(
      { error: 'Failed to download Twitter content. Please try again later.' },
      { status: 500 }
    );
  }
} 