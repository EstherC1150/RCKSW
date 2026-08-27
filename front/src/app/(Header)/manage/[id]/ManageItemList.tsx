import useUserStore from "@/app/stores/UserStore";
import { useAlertStore } from "@/app/stores/alertStore";
import { authenticatedFetch } from "@/app/utils/api";
import Image from "next/image";
import ThumbnailPlaceholder from "../../../_components/common/ThumbnailPlaceholder";
import VideoThumbnail, { isVideoThumbnail } from "../../../_components/common/VideoThumbnail";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { IoArrowBack, IoDownloadOutline, IoPencil } from "react-icons/io5";
import dynamic from "next/dynamic";
import ComponentList from "./ComponentList";
import { AdditionalFile } from "@/app/_types/manage/manage.types";

interface Category {
  id: number;
  name: string;
}

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

interface ComponentDetail {
  id: number;
  fileName: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  thumbnailImage: string;
  description: string;
  mainFeatures: string[];
  recommendedEnvironment: string;
  uploader: string | null;
  componentId: number;
  category: Category;
  fileLinks: {
    source: string;
    icon: string;
    fbx?: string;
    vcmx?: string;
  };
  additionalFiles?: AdditionalFile[];
  relatedFiles: RelatedFile[];
  type: string;
  modelType?: string;
}

interface ManageItemListProps {
  id: string;
}

const FbxViewer = dynamic(() => import("@/app/_components/common/FbxViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

const ManageItemList = ({ id }: ManageItemListProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const [componentData, setComponentData] = useState<ComponentDetail | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDownloadingThumbnail, setIsDownloadingThumbnail] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "thumbnail">("3d");
  const [isEditingFeatures, setIsEditingFeatures] = useState(false);

  const refreshList = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // 날짜 포맷 함수 - UTC 시간을 그대로 사용
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    // UTC 시간을 그대로 파싱 (브라우저 시간대 변환 방지)
    const [datePart] = dateString.split("T");
    if (!datePart) return dateString;

    const [year, month, day] = datePart.split("-");
    return `${year}.${month}.${day}`;
  };

  const formatFeaturesText = (raw: any): string => {
    if (!raw) return "";
    let text = "";

    if (Array.isArray(raw)) {
      text = raw.join("\n");
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return "";
      if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            text = parsed.join("\n");
          } else {
            text = String(parsed);
          }
        } catch (e) {
          text = raw;
        }
      } else {
        text = raw;
      }
    } else {
      text = String(raw);
    }

    text = text.replace(/\r/g, "");

    // 구 데이터에 불릿 기호(●, •)가 뭉쳐있는데 \n이 전혀 없는 경우에만 불릿 보정
    if ((text.includes("●") || text.includes("•")) && !text.includes("\n")) {
      text = text.replace(/([●•])/g, "\n$1").trim();
    }

    return text;
  };

  useEffect(() => {
    const fetchComponentData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
        const response = await fetch(
          `${apiUrl}/api/components/${id}`
        );

        if (!response.ok) {
          throw new Error("데이터를 가져오는데 실패했습니다");
        }

        const result = await response.json();
        if (result.success) {
          setComponentData(result.data);
          setDescription(result.data.description || "");
          setFeatures(formatFeaturesText(result.data.mainFeatures));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComponentData();
  }, [id, refreshKey]);

  const handleSaveFeatures = async () => {
    if (!componentData) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      const response = await authenticatedFetch(`${apiUrl}/api/components/${id}/info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          features: features,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        useAlertStore.getState().showAlert("주요 기능이 성공적으로 수정되었습니다.", {
          title: "수정 완료",
          type: "success",
        });
        setIsEditingFeatures(false);
        refreshList();
      } else {
        throw new Error(result.message || "주요 기능 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("주요 기능 수정 오류:", err);
      useAlertStore.getState().showAlert(
        err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.",
        { title: "오류 발생", type: "error" }
      );
    }
  };

  const handleThumbnailDownload = async () => {
    if (!componentData?.thumbnailImage) return;
    setIsDownloadingThumbnail(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      const downloadUrl = `${apiUrl}/api/components/download/${componentData.id}/thumbnail`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("썸네일 다운로드 중 오류:", error);
      useAlertStore.getState().showAlert("썸네일 다운로드에 실패했습니다.", {
        title: "다운로드 실패",
        type: "error",
      });
    } finally {
      setTimeout(() => {
        setIsDownloadingThumbnail(false);
      }, 1200);
    }
  };

  const backToList = () => {
    const targetType = searchParams.get("fromType") || componentData?.type || "vc_plugin";
    let basePath = "/manage/vc-plugin";
    
    if (targetType === "ns_plugin") basePath = "/manage/ns-plugin";
    else if (targetType === "vc_model") basePath = "/manage/vc-model";
    else if (targetType === "ns_model") basePath = "/manage/ns-model";
    else if (targetType === "etc") basePath = "/manage/etc";

    const params = new URLSearchParams();
    const fromPage = searchParams.get("fromPage");
    const fromSortBy = searchParams.get("fromSortBy");
    const fromSearch = searchParams.get("fromSearch");

    if (fromPage) params.set("page", fromPage);
    if (fromSortBy) params.set("sortBy", fromSortBy);
    if (fromSearch) params.set("search", fromSearch);

    const target = params.toString()
      ? `${basePath}?${params.toString()}`
      : basePath;
    router.push(target);
  };

  // 관련 컴포넌트 클릭 핸들러 (뒤로가기용 fromType 등 컨텍스트 유지)
  const handleRelatedComponentClick = (relatedFile: RelatedFile) => {
    const query = searchParams.toString();
    router.replace(`/manage/${relatedFile.id}${query ? `?${query}` : ""}`);
  };

  useEffect(() => {
    console.log(componentData);
  }, [componentData]);

  if (loading) {
    return <div className="text-white">로딩 중...</div>;
  }

  if (error || !componentData) {
    return <div className="text-white">에러: {error}</div>;
  }

  const isVcPlugin = componentData.type === "vc_plugin";
  const hasFbxPreview =
    componentData.fileLinks?.fbx ||
    componentData.fileLinks?.source?.toLowerCase()?.endsWith(".fbx");
  const isWideThumbnail = (!hasFbxPreview || viewMode === "thumbnail") && (isVcPlugin || isVideoThumbnail(componentData.thumbnailImage));

  const isPlaceholder =
    componentData.thumbnailImage === "/images/ic-vc.png" ||
    componentData.thumbnailImage === "/images/ic-ns.png" ||
    componentData.thumbnailImage === "/images/ic-etc.png" ||
    componentData.thumbnailImage === "/uploads/thumbnails/ic-vc.png" ||
    componentData.thumbnailImage === "/uploads/thumbnails/ic-ns.png" ||
    componentData.thumbnailImage === "/uploads/thumbnails/ic-etc.png";

  return (
    <div className="h-full flex flex-col py-[20px] px-[30px] text-white">
      {/* 상단 버튼 영역 */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <button
          onClick={backToList}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg 
            bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/60
            transition-all duration-300 ease-in-out
            border border-gray-700/30 shadow-lg"
        >
          <IoArrowBack
            className="w-5 h-5 text-gray-300 
            group-hover:transform group-hover:-translate-x-1 
            transition-transform duration-300"
          />
          <span className="text-gray-300 text-sm font-medium">목록 보기</span>
        </button>
      </div>

      {/* 컴포넌트 제목 추가 */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold bg-clip-text text-transparent 
          bg-gradient-to-r from-white to-gray-400"
        >
          {componentData.fileName}
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-gray-400">
            버전 {componentData.version}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
          <span className="text-sm text-gray-400">
            {formatDate(componentData.updatedAt)}
          </span>
          {componentData.type === "vc_model" && componentData.modelType && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span
                className={`text-[11px] px-2 py-[2px] rounded-full font-medium ${
                  componentData.modelType === "layout"
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-cyan-500/20 text-cyan-300"
                }`}
              >
                {componentData.modelType === "layout" ? "레이아웃" : "컴포넌트"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 상단 컴포넌트 상세 정보 영역 */}
      <div className="w-full rounded-lg mb-6">
        <div className="flex flex-wrap lg:flex-nowrap gap-8">
          {/* 컴포넌트 이미지 / 썸네일 영역 */}
          <div className="flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[20px] font-semibold text-white">
                  {isVcPlugin ? "동영상 썸네일" : "미리보기"}
                </h2>
                {hasFbxPreview && !isPlaceholder && componentData.thumbnailImage && (
                  <div className="flex items-center bg-gray-800/90 p-0.5 rounded-lg border border-gray-700">
                    <button
                      type="button"
                      onClick={() => setViewMode("3d")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        viewMode === "3d"
                          ? "bg-cyan-600 text-white shadow-sm font-semibold"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                      }`}
                    >
                      3D 뷰
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("thumbnail")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        viewMode === "thumbnail"
                          ? "bg-cyan-600 text-white shadow-sm font-semibold"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                      }`}
                    >
                      썸네일
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* VC PlugIn 전용 동영상 썸네일 다운로드 버튼 */}
                {isVcPlugin && !isPlaceholder && componentData.thumbnailImage && (
                  <button
                    onClick={handleThumbnailDownload}
                    disabled={isDownloadingThumbnail}
                    className="flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg
                      bg-blue-950/70 hover:bg-blue-900/90 text-blue-300 hover:text-blue-200
                      border border-blue-500/40 hover:border-blue-400
                      transition-all duration-200 shadow-md shadow-blue-950/40 disabled:cursor-not-allowed cursor-pointer"
                    title="동영상 썸네일 다운로드"
                  >
                    {isDownloadingThumbnail ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>다운로드 중...</span>
                      </>
                    ) : (
                      <>
                        <IoDownloadOutline className="w-4 h-4 shrink-0" />
                        <span>동영상 다운로드</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 썸네일 카드 뷰어 */}
            <div
              className={`group relative bg-gray-900 rounded-lg shadow-xl overflow-hidden
              border border-gray-700/50 backdrop-blur-sm transition-all duration-300 ${
                isWideThumbnail
                  ? "w-full max-w-[560px] h-[315px] sm:w-[560px]"
                  : "w-[360px] h-[360px]"
              }`}
            >
              {hasFbxPreview && viewMode === "3d" ? (
                <div className="relative w-full h-full">
                  <FbxViewer
                    key={componentData.fileLinks?.fbx || componentData.fileLinks?.source}
                    fbxUrl={componentData.fileLinks?.fbx || componentData.fileLinks?.source || ""}
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs px-2 py-1 rounded text-xs text-gray-300 z-10 border border-gray-700/40">
                    마우스 좌클릭: 회전 | 우클릭: 이동 | 휠: 확대/축소
                  </div>
                </div>
              ) : isPlaceholder ? (
                <ThumbnailPlaceholder type={componentData.type} name={componentData.fileName} />
              ) : isVideoThumbnail(componentData.thumbnailImage) ? (
                <VideoThumbnail
                  src={`${process.env.NEXT_PUBLIC_API_URL}${componentData.thumbnailImage}`}
                  alt={`${componentData.fileName} 동영상 썸네일`}
                  alwaysPlay={true}
                  controls={true}
                />
              ) : (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${componentData.thumbnailImage}`}
                  alt="thumbnail"
                  className="object-cover"
                  fill
                  unoptimized
                />
              )}
            </div>
          </div>

          {/* 주요 기능 영역 */}
          <div className="flex flex-col flex-1 min-w-[300px]">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[20px] font-semibold text-white">
                    주요 기능
                  </h2>
                  {(user?.role === "admin" || user?.role === "developer") && (
                    <div className="flex items-center gap-2">
                      {isEditingFeatures ? (
                        <>
                          <button
                            onClick={handleSaveFeatures}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg
                              bg-blue-600 hover:bg-blue-500 text-white
                              transition-all duration-200 shadow-md"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingFeatures(false);
                              if (componentData) {
                                setFeatures(formatFeaturesText(componentData.mainFeatures));
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg
                              bg-gray-700 hover:bg-gray-600 text-gray-200
                              transition-all duration-200"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditingFeatures(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                            bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white
                            border border-gray-600/50 hover:border-gray-500
                            transition-all duration-200 shadow-md"
                        >
                          <IoPencil className="w-3.5 h-3.5" />
                          <span>주요 기능 수정</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditingFeatures ? (
                  <textarea
                    className={`w-full bg-gray-900 border border-cyan-500/50 resize-none px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-normal leading-relaxed text-sm ${
                      isWideThumbnail ? "h-[315px]" : "h-[360px]"
                    }`}
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="주요 기능 내용을 줄바꿈으로 나누어 작성해 주세요..."
                  />
                ) : (
                  <div
                    className={`w-full px-4 py-4 rounded-xl text-gray-200 overflow-y-auto border border-gray-700/60 bg-gray-900/80 backdrop-blur-md text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isWideThumbnail ? "h-[315px]" : "h-[360px]"
                    }`}
                  >
                    {features && features.trim()
                      ? features
                      : "등록된 주요 기능 설명이 없습니다."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ComponentList
        componentData={componentData}
        onRelatedComponentClick={handleRelatedComponentClick}
        refreshKey={refreshKey}
        onRefresh={refreshList}
        onLastVersionDeleted={backToList}
        onCurrentVersionDeleted={(nextId: number) => {
          const query = searchParams.toString();
          router.replace(`/manage/${nextId}${query ? `?${query}` : ""}`);
        }}
      />
    </div>
  );
};

export default ManageItemList;
