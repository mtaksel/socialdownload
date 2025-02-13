'use client';

import { useState } from 'react';
import { FaInstagram, FaYoutube, FaTiktok, FaTwitter, FaTwitch } from 'react-icons/fa';

const platforms = [
  { name: 'Instagram', icon: FaInstagram, color: 'bg-pink-600 hover:bg-pink-700' },
  { name: 'YouTube', icon: FaYoutube, color: 'bg-red-600 hover:bg-red-700' },
  { name: 'TikTok', icon: FaTiktok, color: 'bg-black hover:bg-gray-900' },
  { name: 'Twitter', icon: FaTwitter, color: 'bg-blue-400 hover:bg-blue-500' },
  { name: 'Twitch', icon: FaTwitch, color: 'bg-purple-600 hover:bg-purple-700' },
];

export default function PlatformButtons() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {platforms.map((platform) => {
        const Icon = platform.icon;
        return (
          <button
            key={platform.name}
            onClick={() => setSelectedPlatform(platform.name)}
            className={`${platform.color} ${
              selectedPlatform === platform.name ? 'ring-4 ring-white' : ''
            } p-4 rounded-lg flex flex-col items-center justify-center text-white transition-all`}
          >
            <Icon className="text-2xl mb-2" />
            <span className="text-sm">{platform.name}</span>
          </button>
        );
      })}
    </div>
  );
} 