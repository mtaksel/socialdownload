import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Get video info using yt-dlp
    const { stdout } = await execAsync(`yt-dlp -J ${url}`);
    const videoInfo = JSON.parse(stdout);

    // Filter and organize video formats
    const videoFormats = videoInfo.formats
      .filter(format => format.ext === 'mp4' && format.height)
      .map(format => ({
        quality: `${format.height}p`,
        format: format.format_id,
        container: 'mp4',
        hasAudio: Boolean(format.acodec !== 'none'),
        filesize: format.filesize || format.filesize_approx || null,
        height: format.height,
        fps: format.fps,
        vcodec: format.vcodec,
        acodec: format.acodec
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
      format: 'bestaudio[ext=m4a]',
      container: 'm4a',
      hasAudio: true,
      filesize: videoInfo.formats.find(f => f.acodec !== 'none')?.filesize,
      size: videoInfo.formats.find(f => f.acodec !== 'none')?.filesize 
        ? formatFileSize(videoInfo.formats.find(f => f.acodec !== 'none').filesize)
        : 'Variable size'
    };

    return NextResponse.json({
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      type: 'video',
      author: videoInfo.uploader || 'YouTube User',
      duration: videoInfo.duration,
      formats: [...sortedFormats, audioFormat]
    });

  } catch (error) {
    console.error('YouTube info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video info' },
      { status: 500 }
    );
  }
} 