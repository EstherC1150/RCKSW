"use client";

import useUserStore from "@/app/stores/UserStore";
import Image from "next/image";
import ThumbnailPlaceholder from "../../../_components/common/ThumbnailPlaceholder";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { IoArrowBack } from "react-icons/io5";
import dynamic from "next/dynamic";
import ComponentList from "./ComponentList";

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
  relatedFiles: RelatedFile[];
  type: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    const fetchComponentData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
        const response = await fetch(
          `${apiUrl}/api/components/${id}`
        );

        if (!response.ok) {
          throw new Error("데이터를 가져오는데 실패했습니다");
        }

        const result = await response.json();
        if (result.success) {
          setComponentData(result.data);
          setDescription(result.data.description);
          setFeatures(result.data.mainFeatures.join("\n"));
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

  const handleSave = async () => {
    // TODO: API 요청 구현
    // 1. PUT /api/components/{id} 엔드포인트로 요청
    // 2. description과 features를 서버에 전송
    // 3. 성공 시 isEditing을 false로 변경
    // 4. 실패 시 에러 메시지 표시
    setIsEditing(false);
    // 저장 후 데이터 새로고침
    refreshList();
  };

  const backToList = () => {
    const fromType = searchParams.get("fromType") || "vc_plugin";
    let basePath = "/manage/vc-plugin";
    
    if (fromType === "ns_plugin") basePath = "/manage/ns-plugin";
    else if (fromType === "vc_model") basePath = "/manage/vc-model";
    else if (fromType === "ns_model") basePath = "/manage/ns-model";
    else if (fromType === "etc") basePath = "/manage/etc";

    const params = new URLSearchParams();
    const fromPage = searchParams.get("fromPage");
    const fromSortBy = searchParams.get("fromSortBy");
    const fromSearch = searchParams.get("fromSearch");
    const fromCategory = searchParams.get("fromCategory");
    const fromSubCategory = searchParams.get("fromSubCategory");

    if (fromPage) params.set("page", fromPage);
    if (fromSortBy) params.set("sortBy", fromSortBy);
    if (fromSearch) params.set("search", fromSearch);

    // 카테고리/서브카테고리는 리스트 내부 상태로 반영되므로 URL 파라미터 필요 없으면 생략 가능
    // 필요 시 아래처럼 붙일 수 있음 (리스트에서 읽어 사용하려면)
    // if (fromCategory && fromCategory !== "all") params.set("categoryId", fromCategory);
    // if (fromSubCategory && fromSubCategory !== "0") params.set("subCategoryId", fromSubCategory);

    const target = params.toString()
      ? `${basePath}?${params.toString()}`
      : basePath;
    router.push(target);
  };

  // 관련 컴포넌트 클릭 핸들러
  const handleRelatedComponentClick = (relatedFile: RelatedFile) => {
    router.replace(`/manage/${relatedFile.id}`);
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

  return (
    <div className="h-full flex flex-col py-[20px] px-[30px] text-white">
      {/* 상단 버튼 영역 수정 */}
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

        {/* <div className="flex gap-3">
          {user?.role === "admin" && (
            <>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg
                  bg-gradient-to-r from-blue-600 to-blue-700
                  hover:from-blue-700 hover:to-blue-800
                  text-white font-medium text-sm
                  transition-all duration-300 ease-in-out
                  shadow-lg shadow-blue-500/20
                  border border-blue-600/30"
                >
                  저장
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg
                  bg-gradient-to-r from-blue-600 to-blue-700
                  hover:from-blue-700 hover:to-blue-800
                  text-white font-medium text-sm
                  transition-all duration-300 ease-in-out
                  shadow-lg shadow-blue-500/20
                  border border-blue-600/30"
                >
                  수정
                </button>
              )}
            </>
          )}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg
              bg-gradient-to-r from-gray-700 to-gray-800
              hover:from-gray-800 hover:to-gray-900
              text-white font-medium text-sm
              transition-all duration-300 ease-in-out
              shadow-lg shadow-gray-800/20
              border border-gray-700/30"
          >
            목록
          </button>
        </div> */}
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
        </div>
      </div>

      {/* 상단 컴포넌트 상세 정보 영역 */}
      <div className="w-full rounded-lg mb-6">
        <div className="flex flex-wrap gap-8">
          {/* 컴포넌트 이미지 영역 수정 */}
          <div className="flex flex-col">
             <h2 className="text-[20px] font-semibold mb-4 text-white">
                {componentData.fileLinks?.fbx || 
                 (componentData.fileLinks?.source?.toLowerCase()?.endsWith(".fbx"))
                  ? "3D 프리뷰"
                  : "썸네일"}
              </h2>
            <div
              className="relative bg-gray-900 h-[360px] w-[360px] rounded-md shadow-lg overflow-hidden
              border border-gray-700/30 backdrop-blur-sm"
            >
              {componentData.fileLinks?.fbx || 
               (componentData.fileLinks?.source?.toLowerCase()?.endsWith(".fbx")) ? (
                <div className="relative w-full h-full">
                  <FbxViewer
                    key={componentData.fileLinks?.fbx || componentData.fileLinks?.source}
                    fbxUrl={componentData.fileLinks?.fbx || componentData.fileLinks?.source || ""}
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md text-xs text-gray-300 z-10">
                    마우스 좌클릭: 회전 | 우클릭: 이동 | 휠: 확대/축소
                  </div>
                </div>
              ) : (componentData.thumbnailImage === "/images/ic-vc.png" || 
                   componentData.thumbnailImage === "/images/ic-ns.png" || 
                   componentData.thumbnailImage === "/images/ic-etc.png" ||
                   componentData.thumbnailImage === "/uploads/thumbnails/ic-vc.png" || 
                   componentData.thumbnailImage === "/uploads/thumbnails/ic-ns.png" || 
                   componentData.thumbnailImage === "/uploads/thumbnails/ic-etc.png") ? (
                <ThumbnailPlaceholder type={componentData.type} name={componentData.fileName} />
              ) : (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${componentData.thumbnailImage}`}
                  alt="thumbnail"
                  className="object-cover"
                  fill
                />
              )}
            </div>
          </div>

          {/* 주요 기능 영역 */}
          <div className="flex flex-col flex-1">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h2 className="text-[18px] font-semibold mb-4 text-white">
                  주요 기능
                </h2>
                {user?.role === "admin" && isEditing ? (
                  <textarea
                    className="w-full h-[360px] bg-[#A7A7A7] resize-none px-[12px] py-[8px] rounded-md mb-4 text-white"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                  />
                ) : (
                  <div className="w-full h-[360px] px-[12px] py-[8px] rounded-md mb-4 text-white overflow-y-auto border-gray-700 border-[1px] bg-gray-800 whitespace-pre-wrap">
                    {features}
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
      />
    </div>
  );
};

export default ManageItemList;
