"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";

// 파일 다운로드 버튼 컴포넌트
export const FileDownloadButton = ({
  fileId,
  fileType,
  componentType,
  onDownloadStart,
  onDownloadEnd,
}: {
  fileId: number;
  fileType: "icon" | "source" | "fbx";
  componentType?: string;
  onDownloadStart?: (fileId: number) => void;
  onDownloadEnd?: (fileId: number) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    onDownloadStart?.(fileId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/components/download/${fileId}/${fileType}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const fileName = contentDisposition
        ? decodeURIComponent(
            contentDisposition.split("filename=")[1].replace(/"/g, "")
          )
        : `download.${fileType}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsLoading(false);
      onDownloadEnd?.(fileId);
    }
  };

  return (
    <div
      onClick={handleDownload}
      className={`px-3 py-1.5 text-xs rounded font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap
        ${isLoading ? "bg-cyan-700 text-white cursor-wait opacity-90" : "bg-gray-700 hover:bg-gray-600 text-white"}`}
    >
      {isLoading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
          <span>다운로드 중...</span>
        </>
      ) : (
        <>
          {fileType === "source" ? (
            componentType === "vc_model" ? "VCMX" : "파일"
          ) : fileType === "fbx" ? (
            "FBX"
          ) : fileType === "icon" ? (
            "아이콘"
          ) : (
            (fileType as string).toUpperCase()
          )}
        </>
      )}
    </div>
  );
};

// 다운로드 옵션 팝업 컴포넌트
export const DownloadOptions = ({
  fileLinks,
  fileId,
  onClose,
  componentType,
  onDownloadStart,
  onDownloadEnd,
}: {
  fileLinks: { source?: string; icon?: string; fbx?: string };
  fileId: number;
  onClose: () => void;
  componentType?: string;
  onDownloadStart?: (fileId: number) => void;
  onDownloadEnd?: (fileId: number) => void;
}) => {
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={optionsRef}
      className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 mb-2 right-0 bg-gray-800 rounded-lg shadow-xl p-2 min-w-[125px] border border-gray-700 z-[10]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-2">
        {/* 타입별로 노출할 버튼 필터링 */}
        {fileLinks.fbx && componentType === "vc_model" && (
          <FileDownloadButton
            fileId={fileId}
            fileType="fbx"
            componentType={componentType}
            onDownloadStart={onDownloadStart}
            onDownloadEnd={onDownloadEnd}
          />
        )}
        {fileLinks.source && (
          <FileDownloadButton
            fileId={fileId}
            fileType="source"
            componentType={componentType}
            onDownloadStart={onDownloadStart}
            onDownloadEnd={onDownloadEnd}
          />
        )}
      </div>
    </div>
  );
};

// 다운로드 아이콘 버튼 컴포넌트
export const DownloadIconButton = ({
  item,
  isActive,
  isDownloading = false,
  onClick,
  onClose,
  onDownloadStart,
  onDownloadEnd,
}: {
  item: { id: number; type?: string; fileLinks: { source?: string; icon?: string; fbx?: string } };
  isActive: boolean;
  isDownloading?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onClose: () => void;
  onDownloadStart?: (fileId: number) => void;
  onDownloadEnd?: (fileId: number) => void;
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex font-[600] items-center justify-center flex-[2] relative">
      <div
        ref={buttonRef}
        className="w-[24px] h-[24px] relative cursor-pointer flex items-center justify-center"
        onClick={onClick}
        title={isDownloading ? "다운로드 진행 중..." : "다운로드 옵션"}
      >
        {isDownloading ? (
          <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <Image src="/images/ic-download-white.png" alt="download" fill />
        )}
        {isActive && (
          <DownloadOptions
            fileLinks={item.fileLinks}
            fileId={item.id}
            onClose={onClose}
            componentType={item.type}
            onDownloadStart={onDownloadStart}
            onDownloadEnd={onDownloadEnd}
          />
        )}
      </div>
    </div>
  );
};
