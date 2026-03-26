"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";

// 파일 다운로드 버튼 컴포넌트
export const FileDownloadButton = ({
  fileId,
  fileType,
}: {
  fileId: number;
  fileType: "icon" | "source" | "fbx";
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

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
    }
  };

  return (
    <div
      onClick={handleDownload}
      className={`px-2 py-1 text-sm rounded cursor-pointer
        ${isLoading ? "bg-gray-500" : "bg-gray-700 hover:bg-gray-600"}`}
    >
      {isLoading ? "다운로드 중..." : fileType.toUpperCase()}
    </div>
  );
};

// 다운로드 옵션 팝업 컴포넌트
export const DownloadOptions = ({
  fileLinks,
  fileId,
  onClose,
}: {
  fileLinks: { source?: string; icon?: string; fbx?: string };
  fileId: number;
  onClose: () => void;
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
      className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 mb-2 right-0 bg-gray-800 rounded-md shadow-lg p-2 min-w-[100px] z-[10]"
    >
      <div className="flex flex-col gap-2">
        {fileLinks.icon && (
          <FileDownloadButton fileId={fileId} fileType="icon" />
        )}
        {fileLinks.fbx && (
          <FileDownloadButton fileId={fileId} fileType="fbx" />
        )}
        {fileLinks.source && <FileDownloadButton fileId={fileId} fileType="source" />}
      </div>
    </div>
  );
};

// 다운로드 아이콘 버튼 컴포넌트
export const DownloadIconButton = ({
  item,
  isActive,
  onClick,
  onClose,
}: {
  item: { id: number; fileLinks: { source?: string; icon?: string; fbx?: string } };
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  onClose: () => void;
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex font-[600] items-center justify-center flex-[2] relative">
      <div
        ref={buttonRef}
        className="w-[24px] h-[24px] relative cursor-pointer"
        onClick={onClick}
      >
        <Image src="/images/ic-download-white.png" alt="download" fill />
        {isActive && (
          <DownloadOptions
            fileLinks={item.fileLinks}
            fileId={item.id}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};
