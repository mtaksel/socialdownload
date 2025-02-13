import { FC, ReactNode } from 'react';
import Link from 'next/link';
import { FaHome } from 'react-icons/fa';

interface PlatformLayoutProps {
  title: string;
  description: string;
  platform: string;
  children: ReactNode;
}

const PlatformLayout: FC<PlatformLayoutProps> = ({
  title,
  description,
  platform,
  children
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        href="/"
        className="inline-flex items-center text-white hover:text-blue-400 mb-8"
      >
        <FaHome className="mr-2" />
        Back to Home
      </Link>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-2">
          {title}
        </h1>
        <p className="text-gray-400 text-center mb-8">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
};

export default PlatformLayout; 