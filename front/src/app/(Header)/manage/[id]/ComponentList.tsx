"use client";

import { useState, useEffect } from "react";
import VersionUpdateModal from "./VersionUpdateModal";
import useUserStore from "@/app/stores/UserStore";
import { useAlertStore } from "@/app/stores/alertStore";

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
}

const ComponentList = ({
  componentData,
  onRelatedComponentClick,
  refreshKey,
  onRefresh,
}: ComponentListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUserStore();
  const [allVersions, setAllVersions] = useState<VersionItem[]>([]);

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

  const handleFileDownload = async (
    e: React.MouseEvent,
    fileId: number,
    fileType: string,
    fileName: string
  ) => {
    e.stopPropagation();
    try {
      // 백엔드 API를 통해 다운로드 (카운트 증가됨)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/components/download/${fileId}/${fileType}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/octet-stream",
          },
        }
      );

      if (!response.ok) throw new Error("다운로드에 실패했습니다.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName; // 파일 이름 설정
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("파일 다운로드 중 오류 발생:", error);
      useAlertStore.getState().showAlert("파일 다운로드에 실패했습니다.", {
        title: "다운로드 실패",
        type: "error",
      });
    }
  };

  // refreshKey가 변경될 때마다 데이터를 새로고침
  useEffect(() => {
    // 데이터 새로고침 로직이 필요한 경우 여기에 추가
  }, [refreshKey]);

  return (
    <div className="w-full flex-1 mt-10">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-[20px] font-semibold text-white">버전 목록</h2>
          {(user?.role === "admin" || user?.role === "developer") && (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 text-sm font-medium rounded-lg 
              bg-cyan-600/90 hover:bg-cyan-500 border border-cyan-400/50 text-white
              transition-all duration-300 ease-in-out 
              shadow-[0_0_15px_rgba(8,145,178,0.3)]"
            >
              새 버전 등록
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-700/60 bg-gray-900/60 backdrop-blur-md shadow-xl">
        <div className="max-h-[320px] overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-800/90 backdrop-blur-md text-gray-300 font-medium z-10 border-b border-gray-700">
              <tr>
                <th className="py-3 pl-6 pr-4 text-left whitespace-nowrap">파일명</th>
                <th className="py-3 px-3 text-center w-24 whitespace-nowrap">버전</th>
                <th className="py-3 px-3 text-center w-32 whitespace-nowrap">업데이트 날짜</th>
                <th className="py-3 px-6 text-center w-64 min-w-[260px] whitespace-nowrap">다운로드</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {allVersions.map((file) => (
                <tr
                  key={file.id}
                  className={`text-gray-200 transition-colors ${
                    file.isCurrent
                      ? "bg-blue-950/40 border-l-4 border-l-blue-500 text-white font-medium"
                      : "bg-gray-800/40 hover:bg-gray-800/80"
                  }`}
                >
                  <td
                    className="py-3 pl-6 pr-4 text-left cursor-pointer hover:text-blue-300 transition-colors truncate"
                    onClick={() =>
                      !file.isCurrent && onRelatedComponentClick(file)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>{file.fileName}</span>
                      {file.isCurrent && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                          현재 선택됨
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs">{file.version}</td>
                  <td className="py-3 px-4 text-center text-xs text-gray-400">{formatDate(file.updatedAt)}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {file.fileLinks.source && (
                        <button
                          onClick={(e) =>
                            handleFileDownload(
                              e,
                              file.id,
                              "source",
                              `${file.fileName}_${file.version}${file.fileLinks.source ? "." + file.fileLinks.source.split(".").pop() : ""}`
                            )
                          }
                          className="px-3 py-1.5 text-xs font-medium rounded-lg
                            bg-blue-600 hover:bg-blue-500 text-white
                            transition-all duration-200 shadow-md shadow-blue-950/40"
                        >
                          {componentData.type === "vc_model" ? (
                            "VCMX 다운로드"
                          ) : componentData.type === "vc_plugin" ? (
                            "dll 파일 다운로드"
                          ) : (
                            "파일 다운로드"
                          )}
                        </button>
                      )}

                      {file.fileLinks.fbx && componentData.type === "vc_model" && (
                        <button
                          onClick={(e) =>
                            handleFileDownload(
                              e,
                              file.id,
                              "fbx",
                              `${file.fileName}_${file.version}${file.fileLinks.fbx ? "." + file.fileLinks.fbx.split(".").pop() : ""}`
                            )
                          }
                          className="px-3 py-1.5 text-xs font-medium rounded-lg
                            bg-indigo-600 hover:bg-indigo-500 text-white
                            transition-all duration-200 shadow-md shadow-indigo-950/40"
                        >
                          FBX 다운로드
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
