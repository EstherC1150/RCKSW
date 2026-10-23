"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

// 파일 다운로드 헬퍼 함수
export const downloadFileHelper = async (
  fileId: number,
  fileType: "icon" | "source" | "fbx" | "package",
  onStart?: (fileId: number) => void,
  onEnd?: (fileId: number) => void
) => {
  onStart?.(fileId);
  try {
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/components/download/${fileId}/${fileType}`;
    
    const link = document.createElement("a");
    link.href = downloadUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Download error:", err);
  } finally {
    setTimeout(() => {
      onEnd?.(fileId);
    }, 1200);
  }
};

// 파일 다운로드 버튼 컴포넌트
export const FileDownloadButton = ({
  fileId,
  fileType,
  componentType,
  onDownloadStart,
  onDownloadEnd,
}: {
  fileId: number;
  fileType: "icon" | "source" | "fbx" | "package";
  componentType?: string;
  onDownloadStart?: (fileId: number) => void;
  onDownloadEnd?: (fileId: number) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    await downloadFileHelper(fileId, fileType, onDownloadStart, onDownloadEnd);
    setIsLoading(false);
  };

  return (
    <div
      onClick={handleDownload}
      className={`px-3 py-1.5 text-xs rounded font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap
        ${isLoading ? "bg-primary text-white cursor-wait opacity-90" : "bg-card hover:bg-card-hover border border-border text-foreground shadow-sm"}`}
    >
      {isLoading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
          <span>다운로드 중...</span>
        </>
      ) : (
        <>
          {fileType === "source" || fileType === "package" ? (
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
      className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 mb-2 right-0 bg-card rounded-lg shadow-xl p-2 min-w-[125px] border border-border z-[10]"
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
            fileType="package"
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
  variant = "icon",
  onClick,
  onClose,
  onDownloadStart,
  onDownloadEnd,
}: {
  item: { id: number; type?: string; fileLinks: { source?: string; icon?: string; fbx?: string } };
  isActive: boolean;
  isDownloading?: boolean;
  variant?: "icon" | "button";
  onClick: (e: React.MouseEvent) => void;
  onClose: () => void;
  onDownloadStart?: (fileId: number) => void;
  onDownloadEnd?: (fileId: number) => void;
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  // 멀티 파일 옵션 유무 (VC Model 타입이고 FBX와 source가 모두 있을 때만 팝업 표시)
  const hasMultipleFiles = Boolean(
    item.type === "vc_model" && item.fileLinks.fbx && item.fileLinks.source
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    if (hasMultipleFiles) {
      // 다운로드 파일이 여러 개(FBX + VCMX)인 경우 옵션 팝업 띄움
      onClick(e);
    } else {
      // 바깥 리스트에서 1클릭 다운로드 시: 서브 파일이 있으면 ZIP 패키지, 없으면 단일 파일 자동 다운로드
      const targetFileType = item.fileLinks.source ? "package" : item.fileLinks.fbx ? "fbx" : "package";
      if (item.fileLinks.source || item.fileLinks.fbx) {
        downloadFileHelper(item.id, targetFileType, onDownloadStart, onDownloadEnd);
      }
    }
  };

  return (
    <div className="flex font-[600] items-center justify-center flex-[2] relative">
      <div
        ref={buttonRef}
        className={
          variant === "button"
            ? "h-[28px] px-2.5 rounded-lg relative cursor-pointer flex items-center gap-1.5 bg-blue-500/10 hover:bg-primary text-primary hover:text-white transition-all text-[12px] font-medium active:scale-95"
            : "w-[28px] h-[28px] rounded-lg relative cursor-pointer flex items-center justify-center hover:bg-card-hover transition-colors text-muted hover:text-primary active:scale-95"
        }
        onClick={handleClick}
        title={
          isDownloading
            ? "다운로드 진행 중..."
            : hasMultipleFiles
            ? "다운로드 옵션 선택"
            : "다운로드"
        }
      >
        {isDownloading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
            {variant === "button" && <span className="text-[11px] font-medium">다운 중</span>}
          </>
        ) : (
          <>
            <Download className={variant === "button" ? "w-3.5 h-3.5" : "w-4 h-4 text-foreground/80 hover:text-primary transition-colors"} />
            {variant === "button" && <span className="text-[11px] font-medium">받기</span>}
          </>
        )}
        {isActive && hasMultipleFiles && (
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
