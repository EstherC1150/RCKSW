"use client";

import React, { useState, useEffect } from "react";
import VersionUpdateModal from "./VersionUpdateModal";
import useUserStore from "@/app/stores/UserStore";
import { useAlertStore } from "@/app/stores/alertStore";
import { authenticatedFetch } from "@/app/utils/api";
import { AdditionalFile } from "@/app/_types/manage/manage.types";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUserStore();
  const [allVersions, setAllVersions] = useState<VersionItem[]>([]);
  const [expandedVersionId, setExpandedVersionId] = useState<number | null>(null);

  const toggleExpandVersion = (fileId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedVersionId((prev) => (prev === fileId ? null : fileId));
  };

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

  // 날짜 포맷 함수 - UTC 시간을 그대로 사용
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    // UTC 시간을 그대로 파싱 (브라우저 시간대 변환 방지)
    const [datePart] = dateString.split("T");
    if (!datePart) return dateString;

    const [year, month, day] = datePart.split("-");
    return `${year}.${month}.${day}`;
  };

  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleFileDownload = async (
    e: React.MouseEvent,
    fileId: number,
    fileType: string
  ) => {
    e.stopPropagation();
    const key = `${fileId}_${fileType}`;
    if (downloadingKey) return;
    setDownloadingKey(key);

    try {
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/components/download/${fileId}/${fileType}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("파일 다운로드 중 오류 발생:", error);
      useAlertStore.getState().showAlert("파일 다운로드에 실패했습니다.", {
        title: "다운로드 실패",
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setDownloadingKey(null);
      }, 1200);
    }
  };

  const handleAdditionalFileDownload = async (
    e: React.MouseEvent,
    additionalFileId: number
  ) => {
    e.stopPropagation();
    const key = `add_${additionalFileId}`;
    if (downloadingKey) return;
    setDownloadingKey(key);

    try {
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/components/download/additional/${additionalFileId}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("추가 파일 다운로드 중 오류 발생:", error);
      useAlertStore.getState().showAlert("추가 파일 다운로드에 실패했습니다.", {
        title: "다운로드 실패",
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setDownloadingKey(null);
      }, 1200);
    }
  };

  // 단일 버전 삭제 핸들러
  const handleDeleteVersion = async (e: React.MouseEvent, file: VersionItem) => {
    e.stopPropagation();

    // 단일 버전만 남았을 때는 삭제 불가 알림
    if (allVersions.length <= 1) {
      useAlertStore.getState().showAlert(
        "버전이 1개만 남아있는 컴포넌트는 삭제할 수 없습니다. 상위 목록에서 컴포넌트 전체를 삭제해주세요.",
        { title: "삭제 불가", type: "warning" }
      );
      return;
    }

    const isConfirmed = await useAlertStore.getState().showConfirm(
      `정말로 ${file.version} 버전을 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`,
      { title: "버전 삭제", type: "warning" }
    );

    if (!isConfirmed) return;

    setDeletingId(file.id);
    try {
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/components/${file.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        useAlertStore.getState().showAlert(
          `${file.version} 버전이 성공적으로 삭제되었습니다.`,
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
    <div className="bg-card rounded-xl border border-border p-6 mt-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">버전 기록</h2>
          <p className="text-sm text-gray-400 mt-1">이 컴포넌트의 이전 버전 목록입니다.</p>
        </div>
        {(user?.role === "admin" || user?.role === "developer") && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-5 h-[40px] bg-cyan-600/90 hover:bg-cyan-500 border border-cyan-400/50 text-white rounded-lg text-[14px] font-medium shadow-[0_0_15px_rgba(8,145,178,0.3)] transition-all duration-300 cursor-pointer"
          >
            <span>+ 새 버전 업데이트</span>
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-700/60 bg-gray-900/40">
        <div className="max-h-[360px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-900/90 text-gray-400 sticky top-0 z-10 border-b border-gray-700/80 backdrop-blur-md">
              <tr>
                <th scope="col" className="py-3 pl-6 pr-4 text-left font-semibold">파일명</th>
                <th scope="col" className="py-3 px-4 text-center font-semibold w-24">버전</th>
                <th scope="col" className="py-3 px-4 text-center font-semibold w-32">업데이트 일자</th>
                <th scope="col" className="py-3 px-6 text-center font-semibold min-w-[280px]">다운로드</th>
                {(user?.role === "admin" || user?.role === "developer") && (
                  <th scope="col" className="py-3 px-4 text-center font-semibold w-24 min-w-[72px] whitespace-nowrap">관리</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/40">
              {allVersions.map((file) => {
                const isExpanded = expandedVersionId === file.id;
                const hasAdditionalFiles = Boolean(file.additionalFiles && file.additionalFiles.length > 0);

                return (
                  <React.Fragment key={file.id}>
                    <tr
                      className={`text-gray-200 transition-colors ${
                        file.isCurrent
                          ? "bg-blue-950/40 border-l-4 border-l-blue-500 text-white font-medium"
                          : "bg-gray-800/40 hover:bg-gray-800/80"
                      }`}
                    >
                      <td
                        className="py-3.5 pl-6 pr-4 text-left align-middle cursor-pointer hover:text-blue-300 transition-colors truncate"
                        onClick={() =>
                          !file.isCurrent && onRelatedComponentClick(file)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span>{file.fileName}</span>
                          {file.isCurrent && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full shrink-0">
                              현재 선택됨
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle font-mono text-xs">{file.version}</td>
                      <td className="py-3.5 px-4 text-center align-middle text-xs text-gray-400">{formatDate(file.updatedAt)}</td>
                      <td className="py-3.5 px-6 text-center align-middle min-w-[280px]">
                        <div className="flex items-center justify-center gap-2">
                          {file.fileLinks.source && (() => {
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
                                className="flex items-center justify-center gap-1.5 min-w-[130px] whitespace-nowrap px-3.5 py-1.5 text-xs font-medium rounded-lg
                                  bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/60 disabled:text-gray-400 text-white
                                  transition-all duration-200 shadow-md shadow-blue-950/40 disabled:cursor-not-allowed cursor-pointer"
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
                          })()}

                          {file.fileLinks.fbx && componentData.type === "vc_model" && (() => {
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
                                className="flex items-center justify-center gap-1.5 min-w-[105px] whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg
                                  bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/60 disabled:text-gray-400 text-white
                                  transition-all duration-200 shadow-md shadow-indigo-950/40 disabled:cursor-not-allowed cursor-pointer"
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
                          })()}

                          {/* 서브 파일 목록 펼치기/접기 버튼 (아이콘 제거) */}
                          {hasAdditionalFiles && (
                            <button
                              onClick={(e) => toggleExpandVersion(file.id, e)}
                              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer shadow-sm whitespace-nowrap ${
                                isExpanded
                                  ? "bg-cyan-600 text-white border-cyan-400 ring-1 ring-cyan-400"
                                  : "bg-gray-800 hover:bg-gray-700 border-cyan-500/50 text-cyan-300"
                              }`}
                              title="서브 파일 목록 펼치기/접기"
                            >
                              <span>서브 파일 ({file.additionalFiles?.length})</span>
                              <span className="text-[10px] font-bold">{isExpanded ? "▲" : "▼"}</span>
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
                                bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300
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

                    {/* 슬림하고 세련된 서브 파일 인라인 바 */}
                    {isExpanded && hasAdditionalFiles && (
                      <tr className="bg-cyan-950/20 border-b border-cyan-500/30">
                        <td colSpan={user?.role === "admin" || user?.role === "developer" ? 5 : 4} className="px-6 py-2.5 bg-gray-900/95 border-y border-cyan-500/30">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-cyan-400 shrink-0 mr-1 flex items-center gap-1.5">
                              <span className="text-sm">↳</span>
                              <span>서브 파일:</span>
                            </span>
                            {file.additionalFiles?.map((af) => (
                              <div
                                key={af.id}
                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-gray-800/90 border border-gray-700/80 hover:border-cyan-500/50 text-xs text-gray-200 transition-all shadow-sm group"
                              >
                                <span className="font-medium text-gray-300 group-hover:text-white transition-colors truncate max-w-[220px]" title={af.originalName}>
                                  {af.originalName}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  ({af.fileSize ? (af.fileSize / 1024 < 1024 ? `${(af.fileSize / 1024).toFixed(1)} KB` : `${(af.fileSize / (1024 * 1024)).toFixed(2)} MB`) : "-"})
                                </span>
                                <button
                                  onClick={(e) => handleAdditionalFileDownload(e, af.id)}
                                  disabled={downloadingKey === `add_${af.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-cyan-700 hover:bg-cyan-600 text-white shrink-0 transition-all cursor-pointer disabled:opacity-50"
                                  title={`${af.originalName} 다운로드`}
                                >
                                  {downloadingKey === `add_${af.id}` ? (
                                    <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                  ) : (
                                    <span>다운로드</span>
                                  )}
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={(e) => toggleExpandVersion(file.id, e)}
                              className="text-xs text-gray-400 hover:text-gray-200 ml-auto px-2 py-1 rounded hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
                            >
                              ✕ 닫기
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
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
          const latest = allVersions[0];
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
              icon: latest?.fileLinks?.icon || componentData.fileLinks.icon || undefined,
              fbx: latest?.fileLinks?.fbx || componentData.fileLinks.fbx || undefined,
              vcmx: latest?.fileLinks?.vcmx || componentData.fileLinks.vcmx || undefined,
            },
          };
        })()}
      />
    </div>
  );
};

export default ComponentList;
