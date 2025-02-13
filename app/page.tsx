import Link from 'next/link';
import { FaInstagram, FaYoutube, FaTiktok, FaTwitter, FaTwitch } from 'react-icons/fa';

const platforms = [
  { name: 'Instagram', icon: FaInstagram, color: 'from-pink-500 to-purple-500', href: '/instagram' },
  { name: 'YouTube', icon: FaYoutube, color: 'from-red-600 to-red-700', href: '/youtube' },
  { name: 'TikTok', icon: FaTiktok, color: 'from-black to-gray-900', href: '/tiktok' },
  { name: 'Twitter', icon: FaTwitter, color: 'from-blue-400 to-blue-600', href: '/twitter' },
  { name: 'Twitch', icon: FaTwitch, color: 'from-purple-500 to-purple-700', href: '/twitch' },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Media Downloader
          </h1>
          <p className="text-gray-400 text-lg">
            Download your favorite content with one click
          </p>
        </div>

        <div className="space-y-4">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <Link
                key={platform.name}
                href={platform.href}
                className={`w-full p-4 rounded-xl flex items-center space-x-4 
                  bg-gradient-to-r ${platform.color} 
                  transform transition-all duration-300 
                  hover:scale-105 hover:shadow-xl hover:-translate-y-1`}
              >
                <Icon className="text-2xl text-white" />
                <span className="text-lg font-semibold text-white">{platform.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 