"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import VersionUpdateModal from "./VersionUpdateModal";
import useUserStore from "@/app/stores/UserStore";
import { useAlertStore } from "@/app/stores/alertStore";
import { authenticatedFetch } from "@/app/utils/api";
import { AdditionalFile } from "@/app/_types/manage/manage.types";
import { Plus, Paperclip, ChevronDown, Download, X, FileText } from "lucide-react";

interface FileLinks {
  source: string | null;
  icon: string | null;
  fbx?: string | null;
  vcmx?: string | null;
}

interface RelatedFile {
  id: number;
  fileName: string;
  version: string;
  thumbnailImage: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string; // 업데이트 날짜 추가
  description: string;
  mainFeatures: string[];
  recommendedEnvironment: string;
  componentId: number;
  categoryName: string;
  fileLinks: FileLinks;
  additionalFiles?: AdditionalFile[];
}

// 현재 버전을 포함하는 확장된 RelatedFile 타입
interface VersionItem extends RelatedFile {
  isCurrent?: boolean;
}

interface ComponentListProps {
  componentData: {
    id: number;
    fileName: string;
    version: string;
    description: string;
    mainFeatures: string[];
    recommendedEnvironment: string;
    thumbnailImage: string;
    fileLinks: FileLinks;
    additionalFiles?: AdditionalFile[];
    relatedFiles: RelatedFile[];
    componentId: number;
    createdAt: string;
    updatedAt: string; // 업데이트 날짜 추가
    downloadCount: number;
    type: string;
    modelType?: string;
  };
  onRelatedComponentClick: (file: RelatedFile) => void;
  refreshKey?: number;
  onRefresh?: () => void;
  onLastVersionDeleted?: () => void;
  onCurrentVersionDeleted?: (nextId: number) => void;
}

const ComponentList = ({
  componentData,
  onRelatedComponentClick,
  refreshKey,
  onRefresh,
  onLastVersionDeleted,
  onCurrentVersionDeleted,
}: ComponentListProps) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUserStore();
  const [allVersions, setAllVersions] = useState<VersionItem[]>([]);
  const [popoverState, setPopoverState] = useState<{
    file: VersionItem;
    placement: "top" | "bottom";
    maxHeight: number;
    position: {
      top?: number;
      bottom?: number;
      right: number;
    };
  } | null>(null);

  const handleOpenPopover = (file: VersionItem, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (popoverState?.file.id === file.id) {
      setPopoverState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const fileCount = file.additionalFiles?.length || 1;
    const neededHeight = Math.min(320, 76 + fileCount * 56);

    // 아래 공간이 부족하고 위 공간이 넓으면 위로 펼침 (Flip to Top)
    const placement: "top" | "bottom" =
      spaceBelow < neededHeight + 16 && spaceAbove > spaceBelow ? "top" : "bottom";

    const maxHeight = Math.min(
      320,
      Math.max(160, placement === "top" ? spaceAbove - 24 : spaceBelow - 24)
    );

    const popoverWidth = Math.min(380, viewportWidth - 32);
    let right = viewportWidth - rect.right;
    right = Math.min(viewportWidth - popoverWidth - 16, Math.max(16, right));

    setPopoverState({
      file,
      placement,
      maxHeight,
      position: {
        top: placement === "bottom" ? rect.bottom + 6 : undefined,
        bottom: placement === "top" ? viewportHeight - rect.top + 6 : undefined,
        right,
      },
    });
  };

  useEffect(() => {
    if (!popoverState) return;
    const handleClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".additional-files-popover") && !target.closest(".additional-files-trigger")) {
        setPopoverState(null);
      }
    };
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.classList?.contains("additional-files-popover") || target.closest?.(".additional-files-popover"))) {
        return;
      }
      setPopoverState(null);
    };
    window.addEventListener("mousedown", handleClose);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleClose);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [popoverState]);

  useEffect(() => {
    // 현재 버전과 관련 파일을 합친 후 버전별로 정렬하는 함수
    const combineAndSortVersions = () => {
      // 현재 컴포넌트 데이터를 RelatedFile 형식으로 변환
      const currentVersion: VersionItem = {
        id: componentData.id,
        fileName: componentData.fileName,
        version: componentData.version,
        thumbnailImage: componentData.thumbnailImage,
        downloadCount: componentData.downloadCount,
        createdAt: componentData.createdAt,
        updatedAt: componentData.updatedAt, // 업데이트 날짜 추가
        description: componentData.description,
        mainFeatures: componentData.mainFeatures,
        recommendedEnvironment: componentData.recommendedEnvironment,
        componentId: componentData.componentId,
        categoryName: "",
        fileLinks: componentData.fileLinks,
        additionalFiles: componentData.additionalFiles || [],
        isCurrent: true, // 현재 버전 표시를 위한 플래그
      };

      // 현재 버전과 관련 파일들을 합침
      const combined = [currentVersion, ...componentData.relatedFiles];

      // 버전 문자열을 숫자로 변환하여 내림차순으로 정렬
      const sorted = combined.sort((a, b) => {
        const versionA = a.version.split(".").map(Number);
        const versionB = b.version.split(".").map(Number);

        // 버전 번호의 각 부분을 비교
        for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
          const numA = versionA[i] || 0;
          const numB = versionB[i] || 0;

          if (numA !== numB) {
            return numB - numA; // 내림차순 정렬 (최신 버전이 먼저)
          }
        }
        return 0;
      });

      setAllVersions(sorted);
    };

    combineAndSortVersions();
  }, [componentData]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleVersionUpdateSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
    handleCloseModal();
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD 형식으로 변환
  };

  // 파일 다운로드 핸들러
  const handleFileDownload = async (
    e: React.MouseEvent,
    versionId: number,
    fileType: "source" | "fbx"
  ) => {
    e.stopPropagation();
    const downloadKey = `${versionId}_${fileType}`;
    if (downloadingKey) return;

    try {
      setDownloadingKey(downloadKey);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      let downloadUrl = "";
      if (fileType === "source") {
        downloadUrl = `${apiUrl}/api/components/download/${versionId}/source`;
      } else if (fileType === "fbx") {
        downloadUrl = `${apiUrl}/api/components/download/${versionId}/fbx`;
      }

      const response = await authenticatedFetch(downloadUrl);

      if (!response.ok) {
        throw new Error(
          `${fileType === "fbx" ? "FBX" : "주"} 파일 다운로드 실패`
        );
      }

      // Content-Disposition 헤더에서 파일명 추출
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${componentData.fileName}_v${componentData.version}.${
        fileType === "fbx" ? "fbx" : "zip"
      }`;

      if (contentDisposition) {
        // UTF-8 인코딩된 파일명 처리 (filename*=UTF-8''...)
        const utf8FilenameMatch = contentDisposition.match(
          /filename\*=UTF-8''([^;]+)/
        );
        if (utf8FilenameMatch) {
          filename = decodeURIComponent(utf8FilenameMatch[1]);
        } else {
          // 일반 파일명 처리 (filename="...")
          const standardFilenameMatch =
            contentDisposition.match(/filename="?([^";]+)"?/);
          if (standardFilenameMatch) {
            filename = decodeURIComponent(standardFilenameMatch[1]);
          }
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 다운로드 완료 후 새로고침 (다운로드 횟수 업데이트를 위해)
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 1000);
      }
    } catch (error) {
      console.error(
        `${fileType === "fbx" ? "FBX" : "주"} 파일 다운로드 중 오류 발생:`,
        error
      );
      useAlertStore.getState().showAlert(
        `${
          fileType === "fbx" ? "FBX" : "주"
        } 파일 다운로드 중 오류가 발생했습니다.`,
        { title: "다운로드 실패", type: "error" }
      );
    } finally {
      setDownloadingKey(null);
    }
  };

  // 추가 파일 다운로드 핸들러
  const handleAdditionalFileDownload = async (
    e: React.MouseEvent,
    fileId: number
  ) => {
    e.stopPropagation();
    const downloadKey = `add_${fileId}`;
    if (downloadingKey) return;

    try {
      setDownloadingKey(downloadKey);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      const downloadUrl = `${apiUrl}/api/components/download/additional/${fileId}`;
      const response = await authenticatedFetch(downloadUrl);

      if (!response.ok) {
        throw new Error("추가 파일 다운로드 실패");
      }

      // Content-Disposition 헤더에서 파일명 추출
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "download";

      if (contentDisposition) {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (utf8Match) {
          filename = decodeURIComponent(utf8Match[1]);
        } else {
          const match = contentDisposition.match(/filename="?([^";]+)"?/);
          if (match) {
            filename = decodeURIComponent(match[1]);
          }
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("추가 파일 다운로드 오류:", error);
      useAlertStore.getState().showAlert("추가 파일 다운로드 중 오류가 발생했습니다.", {
        title: "다운로드 실패",
        type: "error",
      });
    } finally {
      setDownloadingKey(null);
    }
  };

  // 버전 삭제 처리 핸들러
  const handleDeleteVersion = async (
    e: React.MouseEvent,
    file: VersionItem
  ) => {
    e.stopPropagation();

    // 단일 버전만 남았을 때는 완전히 삭제할지 확인
    const isLastVersion = allVersions.length === 1;
    const confirmMessage = isLastVersion
      ? `현재 버전(${file.version})은 유일한 버전입니다.\n이 버전을 삭제하면 컴포넌트 전체가 삭제됩니다.\n정말 삭제하시겠습니까?`
      : `버전 ${file.version}을(를) 삭제하시겠습니까?`;

    const confirmed = await useAlertStore.getState().showConfirm(confirmMessage, {
      title: isLastVersion ? "컴포넌트 전체 삭제" : "버전 삭제",
      confirmText: "삭제",
      cancelText: "취소",
      type: "warning",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(file.id);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      const response = await authenticatedFetch(
        `${apiUrl}/api/components/version/${file.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        useAlertStore.getState().showAlert(
          isLastVersion
            ? "컴포넌트가 완전히 삭제되었습니다."
            : "버전이 성공적으로 삭제되었습니다.",
          { title: "삭제 완료", type: "success" }
        );

        if (file.isCurrent) {
          const remaining = allVersions.filter((v) => v.id !== file.id);
          if (remaining.length > 0 && onCurrentVersionDeleted) {
            onCurrentVersionDeleted(remaining[0].id);
          } else if (onLastVersionDeleted) {
            onLastVersionDeleted();
          }
        } else {
          if (onRefresh) {
            onRefresh();
          }
        }
      } else {
        useAlertStore.getState().showAlert(
          data.message || "버전 삭제에 실패했습니다.",
          { title: "삭제 실패", type: "error" }
        );
      }
    } catch (error) {
      console.error("버전 삭제 중 오류 발생:", error);
      useAlertStore.getState().showAlert(
        "버전 삭제 중 오류가 발생했습니다.",
        { title: "오류 발생", type: "error" }
      );
    } finally {
      setDeletingId(null);
    }
  };

  // refreshKey가 변경될 때마다 데이터를 새로고침
  useEffect(() => {
    // 데이터 새로고침 로직이 필요한 경우 여기에 추가
  }, [refreshKey]);

  return (
    <div className="mt-8 space-y-3.5">
      {/* 상단 헤더: 타이틀, 버전 카운트, 새 버전 버튼 (중첩 박스 없이 심플하게 배치) */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground tracking-tight">버전 기록</h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary">
              {allVersions.length}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">이 컴포넌트의 이전 버전 목록입니다.</p>
        </div>

        {(user?.role === "admin" || user?.role === "developer") && (
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>새 버전 업데이트</span>
          </button>
        )}
      </div>

      {/* 테이블: 단독 카드형으로 깔끔하게 배치 (헤더 배경 일치 및 내부 인디케이터 처리) */}
      <div className="overflow-hidden rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs uppercase bg-[#EAEFF6] dark:bg-[#182133] text-slate-800 dark:text-slate-100 font-bold border-b border-[#D8E2EF] dark:border-white/10">
              <tr className="bg-[#EAEFF6] dark:bg-[#182133]">
                <th scope="col" className="py-3 pl-6 pr-4 text-left font-semibold">파일명</th>
                <th scope="col" className="py-3 px-4 text-center font-semibold w-24">버전</th>
                <th scope="col" className="py-3 px-4 text-center font-semibold w-32">업데이트 일자</th>
                <th scope="col" className={`py-3 px-4 text-center font-semibold ${componentData.type === "vc_model" ? "w-[380px] min-w-[370px]" : "w-[270px] min-w-[260px]"}`}>다운로드</th>
                {(user?.role === "admin" || user?.role === "developer") && (
                  <th scope="col" className="py-3 px-4 text-center font-semibold w-24 min-w-[72px] whitespace-nowrap">관리</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {allVersions.map((file) => {
                const hasAdditionalFiles = Boolean(file.additionalFiles && file.additionalFiles.length > 0);

                return (
                  <React.Fragment key={file.id}>
                    <tr
                      className={`text-foreground transition-colors ${
                        file.isCurrent
                          ? "bg-primary/10 font-medium"
                          : "bg-card hover:bg-card-hover"
                      }`}
                    >
                      <td
                        className="relative py-3.5 pl-6 pr-4 text-left align-middle cursor-pointer hover:text-primary transition-colors truncate"
                        onClick={() =>
                          !file.isCurrent && onRelatedComponentClick(file)
                        }
                      >
                        {file.isCurrent && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-xs" />
                        )}
                        <div className="flex items-center gap-2">
                          <span>{file.fileName}</span>
                          {file.isCurrent && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-primary/15 text-primary dark:text-blue-300 rounded-full shrink-0">
                              현재 선택됨
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle font-mono text-xs">{file.version}</td>
                      <td className="py-3.5 px-4 text-center align-middle text-xs text-muted">{formatDate(file.updatedAt)}</td>
                      <td className={`py-3.5 px-4 text-center align-middle ${componentData.type === "vc_model" ? "w-[380px] min-w-[370px]" : "w-[270px] min-w-[260px]"}`}>
                        <div className="flex items-center justify-center gap-2">
                          {/* 1. 주 파일(메인/VCMX) 다운로드 슬롯 */}
                          {file.fileLinks.source ? (() => {
                            const key = `${file.id}_source`;
                            const isLoading = downloadingKey === key;
                            return (
                              <button
                                onClick={(e) =>
                                  handleFileDownload(
                                    e,
                                    file.id,
                                    "source"
                                  )
                                }
                                disabled={!!downloadingKey}
                                className={`flex items-center justify-center gap-1.5 ${componentData.type === "vc_model" ? "w-[125px]" : "w-[130px]"} whitespace-nowrap px-3.5 py-1.5 text-xs font-medium rounded-lg
                                  bg-primary hover:bg-primary-hover disabled:opacity-50 text-white
                                  transition-all duration-200 shadow-sm disabled:cursor-not-allowed cursor-pointer shrink-0`}
                                title={componentData.type === "vc_model" ? "VCMX 파일 다운로드" : "주 파일 다운로드"}
                              >
                                {isLoading ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                    <span>다운로드 중...</span>
                                  </>
                                ) : (
                                  <span>
                                    {componentData.type === "vc_model"
                                      ? "VCMX 다운로드"
                                      : "파일 다운로드"}
                                  </span>
                                )}
                              </button>
                            );
                          })() : (
                            <button
                              disabled
                              className={`flex items-center justify-center ${componentData.type === "vc_model" ? "w-[125px]" : "w-[130px]"} whitespace-nowrap px-3.5 py-1.5 text-xs font-medium rounded-lg
                                bg-card-hover text-muted/50 border border-border cursor-not-allowed shrink-0 select-none`}
                              title="이 버전에는 주 파일이 없습니다."
                            >
                              파일 없음
                            </button>
                          )}

                          {/* 2. FBX 다운로드 슬롯 (VC Model 전용) */}
                          {componentData.type === "vc_model" && (
                            file.fileLinks.fbx ? (() => {
                              const key = `${file.id}_fbx`;
                              const isLoading = downloadingKey === key;
                              return (
                                <button
                                  onClick={(e) =>
                                    handleFileDownload(
                                      e,
                                      file.id,
                                      "fbx"
                                    )
                                  }
                                  disabled={!!downloadingKey}
                                  className="flex items-center justify-center gap-1.5 w-[110px] whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg
                                    bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white
                                    transition-all duration-200 shadow-sm disabled:cursor-not-allowed cursor-pointer shrink-0"
                                  title="FBX 파일 다운로드"
                                >
                                  {isLoading ? (
                                    <>
                                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                      <span>다운로드 중...</span>
                                    </>
                                  ) : (
                                    "FBX 다운로드"
                                  )}
                                </button>
                              );
                            })() : (
                              <button
                                disabled
                                className="flex items-center justify-center w-[110px] whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg
                                  bg-card-hover text-muted/50 border border-border cursor-not-allowed shrink-0 select-none"
                                title="이 버전에는 FBX 파일이 없습니다."
                              >
                                FBX 없음
                              </button>
                            )
                          )}

                          {/* 3. 추가 파일 슬롯 (첨부 파일이 있을 때만 표시) */}
                          {hasAdditionalFiles && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenPopover(file, e)}
                              className={`additional-files-trigger inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs border ${
                                popoverState?.file.id === file.id
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "bg-black/5 hover:bg-black/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-foreground hover:text-primary border-black/[0.06] dark:border-white/[0.08] active:scale-95"
                              }`}
                              title="추가 파일 목록 보기"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>첨부 {file.additionalFiles?.length}</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  popoverState?.file.id === file.id ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                      {(user?.role === "admin" || user?.role === "developer") && (
                        <td className="py-3.5 px-4 text-center align-middle w-24 min-w-[72px] whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={(e) => handleDeleteVersion(e, file)}
                              disabled={deletingId === file.id}
                              className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap min-w-[54px]
                                bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400
                                border border-red-500/30 hover:border-red-500/60
                                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              title={`${file.version} 버전 삭제`}
                            >
                              {deletingId === file.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin shrink-0" />
                              ) : (
                                <span className="whitespace-nowrap">삭제</span>
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
        </table>
        </div>
      </div>

      <VersionUpdateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        componentId={componentData.componentId}
        componentType={componentData.type}
        onSuccess={handleVersionUpdateSuccess}
        initialData={(() => {
          let latest = allVersions[0];
          if (!latest && componentData) {
            const combined = [
              {
                id: componentData.id,
                fileName: componentData.fileName,
                version: componentData.version,
                thumbnailImage: componentData.thumbnailImage,
                downloadCount: componentData.downloadCount,
                createdAt: componentData.createdAt,
                updatedAt: componentData.updatedAt,
                description: componentData.description,
                mainFeatures: componentData.mainFeatures,
                recommendedEnvironment: componentData.recommendedEnvironment,
                componentId: componentData.componentId,
                categoryName: "",
                fileLinks: componentData.fileLinks,
                additionalFiles: componentData.additionalFiles || [],
              },
              ...(componentData.relatedFiles || []),
            ];
            const sorted = combined.sort((a, b) => {
              const versionA = a.version.split(".").map(Number);
              const versionB = b.version.split(".").map(Number);
              for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
                const numA = versionA[i] || 0;
                const numB = versionB[i] || 0;
                if (numA !== numB) return numB - numA;
              }
              return 0;
            });
            latest = sorted[0];
          }

          return {
            version: latest?.version || componentData.version,
            description: latest?.description || componentData.description,
            mainFeatures: latest?.mainFeatures || componentData.mainFeatures,
            recommendedEnvironment: latest?.recommendedEnvironment || componentData.recommendedEnvironment,
            thumbnailImage: latest?.thumbnailImage || componentData.thumbnailImage,
            fileName: latest?.fileName || componentData.fileName,
            modelType: componentData.modelType,
            additionalFiles: latest?.additionalFiles || componentData.additionalFiles || [],
            fileLinks: {
              source: latest?.fileLinks?.source || componentData.fileLinks.source || undefined,
              icon: undefined,
              fbx: latest?.fileLinks?.fbx || componentData.fileLinks.fbx || undefined,
              vcmx: latest?.fileLinks?.vcmx || componentData.fileLinks.vcmx || undefined,
            },
          };
        })()}
      />

      {/* 플로팅 추가 파일 팝오버 드롭다운 (Portal to body) */}
      {typeof document !== "undefined" && popoverState && popoverState.file.additionalFiles && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            backgroundColor: "var(--card)",
            ...(popoverState.placement === "top"
              ? { bottom: `${popoverState.position.bottom}px` }
              : { top: `${popoverState.position.top}px` }),
            right: `${popoverState.position.right}px`,
            maxHeight: `${popoverState.maxHeight}px`,
            zIndex: 9999,
          }}
          className="additional-files-popover w-[340px] sm:w-[380px] bg-card rounded-2xl shadow-2xl border border-black/10 dark:border-white/15 p-3.5 flex flex-col"
        >
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-black/10 dark:border-white/10 px-1 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Paperclip className="w-3.5 h-3.5" />
              </div>
              <span className="text-[13px] font-bold text-foreground">
                추가 파일 ({popoverState.file.additionalFiles.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPopoverState(null)}
              className="w-6 h-6 rounded-lg text-muted hover:text-foreground flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto space-y-2 pr-0.5 flex-1 min-h-0">
            {popoverState.file.additionalFiles.map((af) => (
              <div
                key={af.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-foreground truncate" title={af.originalName}>
                      {af.originalName}
                    </p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      {af.fileSize ? (af.fileSize / 1024 < 1024 ? `${(af.fileSize / 1024).toFixed(1)} KB` : `${(af.fileSize / (1024 * 1024)).toFixed(2)} MB`) : "-"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleAdditionalFileDownload(e, af.id)}
                  disabled={downloadingKey === `add_${af.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white shrink-0 transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
                  title={`${af.originalName} 다운로드`}
                >
                  {downloadingKey === `add_${af.id}` ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>다운로드 중</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>다운로드</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ComponentList;
