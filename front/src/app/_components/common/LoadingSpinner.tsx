import React from 'react';
import Image from 'next/image';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] h-full w-full">
      <div className="relative w-16 h-16 animate-spin">
        <Image
          src="/images/RCK LogoIcon.png"
          alt="Loading..."
          fill
          className="object-contain"
        />
      </div>
      <p className="mt-4 text-primary font-medium animate-pulse">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
