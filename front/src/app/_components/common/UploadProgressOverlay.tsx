"use client";

import React from "react";
import { UploadProgress, formatBytes } from "@/app/utils/api";

interface UploadProgressOverlayProps {
  isSubmitting: boolean;
  progress: UploadProgress | null;
  title?: string;
}

export const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
  isSubmitting,
  progress,
  title = "파일 업로드",
}) => {
  if (!isSubmitting) return null;

  const percent = progress?.percent ?? 0;
  const isServerProcessing = percent >= 100;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-[100] p-6 text-center animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gray-900/95 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center">
        {/* 원형 SVG 프로그레스 링 */}
        <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="7"
              className="text-gray-800"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="7"
              className="text-cyan-400 transition-all duration-200 ease-out drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - percent / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isServerProcessing ? (
              <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-2xl font-extrabold text-cyan-300 font-mono tracking-tight">
                {percent}%
              </span>
            )}
          </div>
        </div>

        {/* 상태 타이틀 */}
        <h4 className="text-white font-bold text-lg mb-1.5">
          {isServerProcessing
            ? "서버에서 저장 및 등록 처리 중..."
            : `${title} 중입니다...`}
        </h4>

        {/* 전송 바이트 카운터 */}
        {progress && progress.total > 0 && (
          <div className="mb-4">
            <span className="text-cyan-200 text-xs font-mono bg-cyan-950/80 border border-cyan-800/60 px-3 py-1 rounded-full shadow-inner">
              {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
            </span>
          </div>
        )}

        {/* 가로 프로그레스 바 */}
        <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4 overflow-hidden border border-gray-700 shadow-inner">
          <div
            className={`h-2.5 rounded-full transition-all duration-200 ${
              isServerProcessing
                ? "bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 animate-pulse"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* 설명 안내문 */}
        <p className="text-gray-300 text-xs leading-relaxed max-w-sm">
          {isServerProcessing ? (
            <>
              파일 전송이 완료되어 <strong className="text-cyan-300 font-medium">서버 저장 및 압축 처리</strong>를 진행하고 있습니다.<br />
              처리가 끝날 때까지 잠시만 기다려 주세요.
            </>
          ) : (
            <>
              파일 크기에 따라 소요 시간이 달라질 수 있습니다.<br />
              업로드가 완료될 때까지 창을 닫거나 새로고침하지 마세요.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default UploadProgressOverlay;
