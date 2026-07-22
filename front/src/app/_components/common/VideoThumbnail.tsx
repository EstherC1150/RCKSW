"use client";

import { useEffect, useRef, useState } from "react";

type VideoThumbnailProps = {
  src: string;
  alt: string;
  className?: string;
  controls?: boolean;
  previewOnHover?: boolean;
  alwaysPlay?: boolean; // 맨 위/첫 번째 동영상 카드 자동 재생 여부
};

const VideoThumbnail = ({
  src,
  alt,
  className = "",
  controls = false,
  previewOnHover = true,
  alwaysPlay = false,
}: VideoThumbnailProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (alwaysPlay) {
      video.muted = true;
      void video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [alwaysPlay, src]);

  const handleLoadedData = () => {
    if (alwaysPlay && videoRef.current) {
      videoRef.current.muted = true;
      void videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const playPreview = () => {
    if (!previewOnHover || !videoRef.current) return;

    const video = videoRef.current;
    video.muted = true;
    void video
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const stopPreview = () => {
    if (!previewOnHover || !videoRef.current) return;

    // 항상 재생 모드가 아닌 경우 마우스가 떠나면 정지
    if (!alwaysPlay) {
      const video = videoRef.current;
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const togglePlayback = (event: React.MouseEvent<HTMLVideoElement>) => {
    event.stopPropagation();
    if (!videoRef.current || controls) return;

    const video = videoRef.current;
    if (video.paused) {
      video.muted = true;
      void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      className={`relative h-full w-full ${className}`}
      onMouseEnter={playPreview}
      onMouseLeave={stopPreview}
    >
      <video
        ref={videoRef}
        src={src}
        aria-label={alt}
        muted
        loop
        playsInline
        autoPlay={alwaysPlay}
        preload="auto"
        controls={controls}
        onLoadedData={handleLoadedData}
        onClick={togglePlayback}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="h-full w-full object-cover"
      />
      {!controls && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 text-2xl text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {isPlaying ? "Ⅱ" : "▶"}
        </span>
      )}
    </div>
  );
};

export const isVideoThumbnail = (url?: string | null) =>
  Boolean(url && /\.(mp4|webm)(?:[?#].*)?$/i.test(url));

export default VideoThumbnail;
