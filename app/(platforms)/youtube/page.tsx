import PlatformLayout from '@/components/PlatformLayout';
import DownloadForm from '@/components/platform/YoutubeDownloader';

export default function YoutubePage() {
  return (
    <PlatformLayout 
      title="YouTube Downloader" 
      description="Download YouTube videos and shorts"
      platform="youtube"
    >
      <DownloadForm />
    </PlatformLayout>
  );
} 