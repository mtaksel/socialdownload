'use client';

import { useState } from 'react';
import { FaInstagram, FaDownload } from 'react-icons/fa';

interface PostFormat {
  quality: string;
  format: string;
  container: string;
  hasAudio: boolean;
}

export default function InstagramDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postInfo, setPostInfo] = useState<{
    title: string;
    thumbnail: string;
    type: 'video' | 'image';
    formats: PostFormat[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/instagram/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post info');
      }

      const data = await response.json();
      setPostInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/instagram/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url,
          type: postInfo?.type
        }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `instagram-${postInfo?.type}.${postInfo?.type === 'video' ? 'mp4' : 'jpg'}`;
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
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaInstagram className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-xl" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Instagram post link here..."
              className="w-full pl-12 pr-4 py-4 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:ring-2 focus:ring-pink-400 focus:outline-none backdrop-blur-sm"
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
            className="w-full bg-white text-pink-600 font-bold py-4 px-6 rounded-lg 
              disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
              hover:bg-pink-100 transform hover:scale-[1.02]"
          >
            {loading ? 'Processing...' : 'Get Post Info'}
          </button>
        </form>
      </div>

      {postInfo && (
        <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-4">{postInfo.title}</h3>
          
          <div className="aspect-square rounded-lg overflow-hidden shadow-xl mb-6 relative">
            <img 
              src={postInfo.thumbnail}
              alt={postInfo.title}
              className="w-full h-full object-contain bg-gray-900"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/placeholder-image.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          </div>

          <button
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 px-6 rounded-lg
              transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2
              hover:shadow-lg hover:from-pink-600 hover:to-purple-600"
          >
            <FaDownload className={loading ? 'animate-bounce' : ''} />
            <span>Download {postInfo.type === 'video' ? 'Reel' : 'Photo'}</span>
          </button>
        </div>
      )}
    </div>
  );
} 