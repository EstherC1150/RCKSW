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
  title = "등록",
}) => {
  if (!isSubmitting) return null;

  const percent = progress?.percent ?? 0;
  const isServerProcessing = percent >= 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-sm bg-[#0f172a] border border-slate-700/80 rounded-xl p-6 shadow-2xl text-center">
        {/* 상단 타이틀 & 스피너 */}
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <h4 className="text-white font-semibold text-sm">
            {isServerProcessing ? "저장 처리 중..." : "등록 중..."}
          </h4>
        </div>

        {/* 심플한 단일 프로그레스 바 */}
        <div className="w-full bg-slate-800 rounded-full h-2 mb-2.5 overflow-hidden">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* 퍼센트 & 전송 용량 수치 */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-0.5 mb-3">
          <span className="font-semibold text-slate-300">{percent}%</span>
          {progress && progress.total > 0 && (
            <span>
              {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
            </span>
          )}
        </div>

        {/* 하단 단정한 안내 문구 */}
        <p className="text-slate-400 text-xs leading-relaxed">
          {isServerProcessing
            ? "파일 등록을 완료하고 있습니다."
            : "업로드가 진행 중입니다. 잠시만 기다려 주세요."}
        </p>
      </div>
    </div>
  );
};

export default UploadProgressOverlay;
