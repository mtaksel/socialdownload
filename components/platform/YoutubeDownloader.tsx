'use client';

import { useState } from 'react';
import { FaYoutube, FaDownload, FaMusic } from 'react-icons/fa';

interface VideoFormat {
  quality: string;
  format: string;
  container: string;
  hasAudio: boolean;
  size?: string;
}

export default function YoutubeDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{
    title: string;
    thumbnail: string;
    type: 'video';
    author: string;
    formats: VideoFormat[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/youtube/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video info');
      }

      const data = await response.json();
      setVideoInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: VideoFormat, type: string = 'video') => {
    try {
      const response = await fetch('/api/youtube/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url,
          type,
          format: format.format,
          title: videoInfo?.title
        }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `youtube-${type}-${format.quality}.${format.container}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaYoutube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-xl" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube link here..."
              className="w-full pl-12 pr-4 py-4 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:ring-2 focus:ring-red-400 focus:outline-none backdrop-blur-sm"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm bg-red-900/50 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-red-600 font-bold py-4 px-6 rounded-lg 
              disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
              hover:bg-red-50 transform hover:scale-[1.02]"
          >
            {loading ? 'Processing...' : 'Get Video Info'}
          </button>
        </form>
      </div>

      {videoInfo && (
        <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-4">{videoInfo.title}</h3>
          
          <div className="aspect-video rounded-lg overflow-hidden shadow-xl mb-6 relative">
            <img 
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-full h-full object-contain bg-gray-900"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/placeholder-image.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Download Options:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Video quality options */}
              {videoInfo.formats
                .filter(format => format.quality !== 'Audio Only')
                .map((format, index) => (
                  <button
                    key={index}
                    onClick={() => handleDownload(format, 'video')}
                    className="flex items-center justify-between bg-gray-700/50 hover:bg-gray-600/50 
                      p-4 rounded-lg transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-3">
                      <FaDownload className="text-gray-400 group-hover:text-white" />
                      <div className="text-left">
                        <div className="text-white font-medium">{format.quality}</div>
                        <div className="text-gray-400 text-sm">{format.size || 'Unknown size'}</div>
                      </div>
                    </div>
                  </button>
                ))}
              
              {/* Audio-only option */}
              <button
                onClick={() => handleDownload({ 
                  quality: 'Audio Only',
                  format: 'bestaudio',
                  container: 'm4a',
                  hasAudio: true
                }, 'audio')}
                className="flex items-center justify-between bg-gray-700/50 hover:bg-gray-600/50 
                  p-4 rounded-lg transition-all duration-300 group col-span-full"
              >
                <div className="flex items-center space-x-3">
                  <FaMusic className="text-gray-400 group-hover:text-white" />
                  <div className="text-left">
                    <div className="text-white font-medium">Audio Only (M4A)</div>
                    <div className="text-gray-400 text-sm">High Quality Audio</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 