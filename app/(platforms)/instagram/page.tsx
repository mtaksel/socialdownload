import PlatformLayout from '@/components/PlatformLayout';
import DownloadForm from '@/components/platform/InstagramDownloader';

export default function InstagramPage() {
  return (
    <PlatformLayout 
      title="Instagram Downloader" 
      description="Download Instagram photos, videos, and reels"
      platform="instagram"
    >
      <DownloadForm />
    </PlatformLayout>
  );
} 