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
  const [hasError, setHasError] = useState(false);

  // 미디어 프래그먼트(#t=0.001)로 대용량 동영상 전체 다운로드 없이 첫 프레임 미리보기 로딩 강제
  const videoSrc =
    src && !src.includes("#") && !src.startsWith("blob:") && !src.startsWith("data:")
      ? `${src}#t=0.001`
      : src;

  useEffect(() => {
    setHasError(false);
    const video = videoRef.current;
    if (!video) return;

    // 대용량 동영상 첫 프레임 썸네일 디코딩 강제 렌더링
    const handleLoadedMetadata = () => {
      if (!alwaysPlay && video.paused && video.currentTime === 0) {
        try {
          video.currentTime = 0.001;
        } catch (e) {
          // ignore
        }
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (alwaysPlay) {
      video.muted = true;
      void video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
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
    if (!previewOnHover || !videoRef.current || hasError) return;

    const video = videoRef.current;
    video.muted = true;
    void video
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const stopPreview = () => {
    if (!previewOnHover || !videoRef.current || hasError) return;

    // 항상 재생 모드가 아닌 경우 마우스가 떠나면 정지
    if (!alwaysPlay) {
      const video = videoRef.current;
      video.pause();
      try {
        video.currentTime = 0.001;
      } catch (e) {
        // ignore
      }
      setIsPlaying(false);
    }
  };

  const togglePlayback = (event: React.MouseEvent<HTMLVideoElement>) => {
    event.stopPropagation();
    if (!videoRef.current || controls || hasError) return;

    const video = videoRef.current;
    if (video.paused) {
      video.muted = true;
      void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  if (hasError) {
    return (
      <div className={`relative h-full w-full bg-gray-900 flex flex-col items-center justify-center text-gray-400 p-2 text-xs text-center ${className}`}>
        <span className="text-2xl mb-1">🎬</span>
        <span>동영상 미리보기</span>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full w-full ${className}`}
      onMouseEnter={playPreview}
      onMouseLeave={stopPreview}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        aria-label={alt}
        muted
        loop
        playsInline
        autoPlay={alwaysPlay}
        preload="metadata"
        controls={controls}
        onLoadedData={handleLoadedData}
        onError={() => setHasError(true)}
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
  Boolean(
    url &&
      (url.startsWith("blob:") ||
        url.startsWith("data:video/") ||
        /\.(mp4|webm|mov|mkv|avi)(?:[?#].*)?$/i.test(url))
  );

export default VideoThumbnail;
