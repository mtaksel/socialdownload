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

// Standard quality presets
const QUALITY_PRESETS = [360, 480, 720, 1080, 1440, 2160];

function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const tweetId = extractTwitterId(url);
    if (!tweetId) {
      return NextResponse.json({ error: 'Invalid Twitter URL' }, { status: 400 });
    }

    // Create temporary directory for thumbnail
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'twitter-thumb-'));
    const thumbnailPath = path.join(tempDir, 'thumbnail');

    try {
      // Get tweet info using yt-dlp with format selection for best quality
      const { stdout } = await execAsync(`yt-dlp -J ${url}`);
      const tweetInfo = JSON.parse(stdout);

      // Determine content type and get available formats
      const isVideo = tweetInfo.formats && tweetInfo.formats.length > 0;
      const isGif = tweetInfo.webpage_url?.includes('/video/1') || false;

      if (isVideo && !isGif) {
        // Filter and organize video formats
        const videoFormats = tweetInfo.formats
          .filter(format => format.ext === 'mp4' && format.height)
          .map(format => ({
            quality: `${format.height}p`,
            format: format.format_id,
            container: 'mp4',
            hasAudio: Boolean(format.acodec !== 'none'),
            filesize: format.filesize || format.filesize_approx || null,
            height: format.height,
            width: format.width,
            fps: format.fps,
            vcodec: format.vcodec,
            acodec: format.acodec,
            url: format.url
          }));

        // Group by resolution and select best quality for each resolution
        const qualityGroups = new Map();
        videoFormats.forEach(format => {
          const height = format.height;
          if (!qualityGroups.has(height) || format.filesize > qualityGroups.get(height).filesize) {
            qualityGroups.set(height, format);
          }
        });

        // Sort formats by resolution
        const sortedFormats = Array.from(qualityGroups.values())
          .sort((a, b) => b.height - a.height)
          .map(format => ({
            ...format,
            quality: `${format.height}p${format.fps > 30 ? ` ${format.fps}fps` : ''}`,
            size: format.filesize ? formatFileSize(format.filesize) : 'Unknown size'
          }));

        // Add audio-only option
        const audioFormat = {
          quality: 'Audio Only',
          format: 'bestaudio',
          container: 'mp3',
          hasAudio: true,
          filesize: tweetInfo.formats.find(f => f.acodec !== 'none')?.filesize,
          size: 'Variable',
          height: 0
        };

        // Download thumbnail
        await execAsync(`yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg -o "${thumbnailPath}" ${url}`);
        const thumbnailBuffer = await fs.readFile(`${thumbnailPath}.jpg`);
        const base64Thumbnail = thumbnailBuffer.toString('base64');

        // Clean up
        await fs.rm(tempDir, { recursive: true, force: true });

        return NextResponse.json({
          title: tweetInfo.title || 'Twitter Video',
          thumbnail: `data:image/jpeg;base64,${base64Thumbnail}`,
          type: 'video',
          author: tweetInfo.uploader || 'Twitter User',
          duration: tweetInfo.duration,
          formats: [...sortedFormats, audioFormat]
        });
      } else {
        // Handle images and GIFs
        await execAsync(`yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg -o "${thumbnailPath}" ${url}`);
        const thumbnailBuffer = await fs.readFile(`${thumbnailPath}.jpg`);
        const base64Thumbnail = thumbnailBuffer.toString('base64');

        await fs.rm(tempDir, { recursive: true, force: true });

        return NextResponse.json({
          title: tweetInfo.title || 'Twitter Post',
          thumbnail: `data:image/jpeg;base64,${base64Thumbnail}`,
          type: isGif ? 'gif' : 'image',
          author: tweetInfo.uploader || 'Twitter User',
          formats: [{
            quality: 'Original',
            format: 'best',
            container: isGif ? 'mp4' : 'jpg',
            hasAudio: false,
            size: tweetInfo.filesize ? formatFileSize(tweetInfo.filesize) : 'Unknown size'
          }]
        });
      }

    } catch (error) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }

  } catch (error) {
    console.error('Twitter info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Twitter content. Please make sure the URL is correct and the content is public.' },
      { status: 500 }
    );
  }
} 