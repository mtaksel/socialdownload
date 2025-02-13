interface MediaPreviewProps {
  type: 'image' | 'video';
  url: string;
}

export function MediaPreview({ type, url }: MediaPreviewProps) {
  return (
    <div className="aspect-video w-full bg-gray-800 rounded-lg overflow-hidden">
      {type === 'image' ? (
        <img
          src={url}
          alt="Preview"
          className="w-full h-full object-contain"
        />
      ) : (
        <video
          src={url}
          controls
          className="w-full h-full"
        />
      )}
    </div>
  );
} 