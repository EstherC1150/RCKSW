"use client";

import LibraryList from "@/app/_components/common/manage/LibraryList";
import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
  useRef,
} from "react";
import ComponentModal from "@/app/(Header)/manage/ComponentModal";
import { TComponentFormData } from "@/app/_types/manage/manage.types";
import useUserStore from "@/app/stores/UserStore";
import { useAlertStore } from "@/app/stores/alertStore";
import { authenticatedFetch, authenticatedUpload, UploadProgress } from "@/app/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Plus, Trash2 } from "lucide-react";

// 카테고리 타입 정의
interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

interface ComponentPageLayoutProps {
  type: "vc_plugin" | "ns_plugin" | "vc_model" | "ns_model" | "etc";
  initialPage?: number;
}

const ComponentPageLayout = ({
  type,
  initialPage = 1,
}: ComponentPageLayoutProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const sortBy = (searchParams.get("sortBy") || "latest") as
    | "latest"
    | "downloads"
    | "name";
  const modelType = searchParams.get("modelType") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [inputValue, setInputValue] = useState(search);
  const [activeSort, setActiveSort] = useState<"latest" | "downloads" | "name">(
    sortBy
  );
  const [activeModelType, setActiveModelType] = useState(modelType);

  const { user, getAccessToken } = useUserStore();

  const libraryListRef = useRef<any>(null);

  // 타입별 기본 경로
  const basePath = type === "vc_model" ? "/manage/vc-model" : type === "ns_model" ? "/manage/ns-model" : type === "etc" ? "/manage/etc" : type === "ns_plugin" ? "/manage/ns-plugin" : "/manage/vc-plugin";

  // 타입별 표시 텍스트
  const typeName = type === "vc_plugin" ? "VC PlugIn" : type === "ns_plugin" ? "NS PlugIn" : type === "vc_model" ? "VC Model" : type === "ns_model" ? "NS Model" : "etc";


  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };


  const refreshList = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleSubmitComponent = async (
    formData: TComponentFormData,
    onProgress?: (progress: UploadProgress) => void
  ) => {
    const accessToken = getAccessToken();
    const { showAlert, showToast } = useAlertStore.getState();

    if (!accessToken) {
      showAlert("로그인이 필요한 서비스입니다.", { title: "접근 제한", type: "warning" });
      return;
    }

    // FormData 객체 생성
    const formDataToSend = new FormData();

    // 일반 텍스트 필드 추가
    formDataToSend.append("componentName", formData.componentName || "null");
    formDataToSend.append("version", formData.version || "null");
    formDataToSend.append("description", formData.description || "null");
    formDataToSend.append("environment", formData.environment || "null");
    formDataToSend.append("type", formData.type || type);
    if ((formData.type || type) === "vc_model") {
      formDataToSend.append("modelType", formData.modelType || "component");
    }

    // 카테고리 정보는 null로 전송
    formDataToSend.append("categoryId", "null");
    formDataToSend.append("subCategoryId", "null");

    // features 추가 (한 블록으로 전송)
    formDataToSend.append("features", formData.features);

    // 파일 추가 (null이 아닌 경우에만)
    if (formData.thumbnail) {
      formDataToSend.append("thumbnail", formData.thumbnail);
    }

    if (formData.sourceFile) {
      formDataToSend.append("sourceFile", formData.sourceFile);
    }

    if (formData.fbxFile) {
      formDataToSend.append("fbxFile", formData.fbxFile);
    }

    if (formData.additionalFiles && formData.additionalFiles.length > 0) {
      formData.additionalFiles.forEach((file) => {
        formDataToSend.append("additionalFiles", file);
      });
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      const data = await authenticatedUpload(
        `${apiUrl}/api/components`,
        formDataToSend,
        "POST",
        onProgress
      );

      if (data && data.success) {
        showToast(`${typeName}가 등록되었습니다.`, "success");
        handleCloseModal();
        // 컴포넌트 목록 새로고침
        refreshList();
      } else {
        showAlert(data?.message || `${typeName} 등록에 실패했습니다.`, { title: "등록 실패", type: "error" });
      }
    } catch (err) {
      console.error(`${typeName} 등록 중 오류 발생:`, err);
      showAlert(err instanceof Error ? err.message : `${typeName} 등록 중 오류가 발생했습니다.`, { title: "오류 발생", type: "error" });
    }
  };

  useEffect(() => {
    setInputValue(search);
    setActiveSort(sortBy);
    setActiveModelType(modelType);
  }, [search, sortBy, modelType]);

  // 검색 입력 핸들러
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 검색 버튼 클릭 핸들러 (타입별 경로 사용)
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (inputValue) {
      params.set("search", inputValue);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    params.set("sortBy", activeSort);
    router.push(`${basePath}?${params.toString()}`);
  };

  // 검색어 초기화 핸들러 (입력값 삭제와 동시에 목록도 즉시 초기화)
  const handleClearSearch = () => {
    setInputValue("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.set("page", "1");
    params.set("sortBy", activeSort);
    router.push(`${basePath}?${params.toString()}`);
  };

  // 정렬 기준 변경 핸들러 (타입별 경로 사용)
  const handleSortChange = (sort: "latest" | "downloads" | "name") => {
    setActiveSort(sort);
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", sort);
    params.set("page", "1");
    if (search) params.set("search", search);
    router.push(`${basePath}?${params.toString()}`);
  };


  // 모델 타입 필터 변경 핸들러 (VC Model 전용)
  const handleModelTypeChange = (value: string) => {
    setActiveModelType(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("modelType", value);
    } else {
      params.delete("modelType");
    }
    params.set("page", "1");
    if (search) params.set("search", search);
    params.set("sortBy", activeSort);
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "vc_plugin" && type !== "vc_plugin") {
      // 검색어 초기화
      setInputValue("");
      setActiveSort("latest");
      router.push("/manage/vc-plugin");
    } else if (tab === "ns_plugin" && type !== "ns_plugin") {
      // 검색어 초기화
      setInputValue("");
      setActiveSort("latest");
      router.push("/manage/ns-plugin");
    } else if (tab === "vc_model" && type !== "vc_model") {
      // 검색어 초기화
      setInputValue("");
      setActiveSort("latest");
      router.push("/manage/vc-model");
    } else if (tab === "ns_model" && type !== "ns_model") {
      // 검색어 초기화
      setInputValue("");
      setActiveSort("latest");
      router.push("/manage/ns-model");
    } else if (tab === "etc" && type !== "etc") {
      // 검색어 초기화
      setInputValue("");
      setActiveSort("latest");
      router.push("/manage/etc");
    }
  };

  useEffect(() => {
    // 페이지 파라미터가 없는 경우 1페이지로 강제 이동 (타입별 경로 사용)
    if (!initialPage || isNaN(initialPage) || initialPage < 1) {
      router.replace(`${basePath}?page=1`);
    }
    // initialPage가 유효하면 해당 페이지를 보여줌 (curPage는 이미 상태로 관리)
  }, [initialPage, router, basePath]);

  // 페이지 이동 함수 (router.push로 쿼리 동기화, 타입별 경로 사용)
  const goToPage = (pageNum: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNum.toString());
    if (search) params.set("search", search);
    params.set("sortBy", activeSort);
    router.push(`${basePath}?${params.toString()}`);
  };

  const tabGroups = [
    { 
      id: "vc", 
      label: "Visual Components", 
      icon: "/images/ic-vc.png",
      subItems: [
        { id: "vc_plugin", label: "PlugIn" },
        { id: "vc_model", label: "Model" },
      ]
    },
    { 
      id: "ns", 
      label: "Nextspace", 
      icon: "/images/ic-ns.png", 
      subItems: [
        { id: "ns_plugin", label: "PlugIn" },
        { id: "ns_model", label: "Model" },
      ]
    },
    { 
      id: "etc", 
      label: "etc", 
      icon: "/images/ic-etc.png",
      subItems: []
    },
  ];

  // 현재 어떤 대분류가 활성 상태인지 확인
  const activeGroup = tabGroups.find(group => 
    group.id === type || group.subItems.some(sub => sub.id === type)
  );

  return (
    <div className="min-h-full flex flex-col p-8">
      {/* 프리미엄 리부트 탭 네비게이션 (Grouping & Toggle) */}
      <div className="flex items-center mb-6">
        <div className="flex items-center gap-4">
          {tabGroups.map((group) => {
            const isGroupActive = activeGroup?.id === group.id;
            const hasSubItems = group.subItems.length > 0;
            
            return (
              <div 
                key={group.id} 
                className={`flex items-center rounded-2xl transition-all duration-300 overflow-hidden ${
                  isGroupActive ? "bg-card shadow-sm" : "hover:bg-card-hover"
                }`}
              >
                {/* 대분류 아이콘 버튼 */}
                <button
                  onClick={() => {
                    if (group.id === "etc") handleTabChange("etc");
                    else if (group.subItems.length > 0) handleTabChange(group.subItems[0].id);
                  }}
                  className={`flex items-center justify-center w-[54px] h-[54px] transition-all duration-300 relative ${
                    isGroupActive ? "opacity-100" : "opacity-45 hover:opacity-85"
                  }`}
                >
                  <img src={group.icon} alt={group.label} className={`w-6 h-6 object-contain transition-all duration-300 invert dark:invert-0 ${isGroupActive ? "opacity-65 dark:opacity-100 scale-110" : "opacity-60 dark:opacity-90 scale-100"}`} />
                </button>

                {/* 소분류 토글 (옆으로 늘어뜨린 느낌) */}
                <div 
                  className={`flex items-center transition-all duration-500 ease-out overflow-hidden ${
                    isGroupActive && group.subItems.length > 0 ? "max-w-[400px] opacity-100 px-3" : "max-w-0 opacity-0 px-0"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {group.subItems.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleTabChange(sub.id)}
                        className={`px-4 py-2 rounded-xl text-[14px] font-black tracking-tight whitespace-nowrap transition-all duration-300 ${
                          type === sub.id 
                            ? "text-white bg-primary shadow-sm" 
                            : "text-muted hover:text-foreground hover:bg-card-hover"
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* etc 전용 텍스트 (아이콘 옆에 표시 - 크기 맞춰서 일관성 있게) */}
                {group.id === "etc" && (
                  <div className={`transition-all duration-500 flex items-center ${isGroupActive ? "max-w-[100px] opacity-100 pr-5" : "max-w-0 opacity-0 overflow-hidden"}`}>
                    <span className="text-[14px] font-black text-primary tracking-widest uppercase ml-[-4px]">etc</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 컨트롤 바 (통합 검색, 정렬/필터 탭, 등록/삭제 버튼) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 mb-6 z-10 rounded-2xl shadow-xs">
        {/* 좌측: 통합 검색 인풋 */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center w-full sm:w-[280px]">
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="파일명 검색..."
              className="w-full h-[38px] pl-9 pr-16 rounded-xl bg-input hover:bg-card-hover focus:bg-input text-foreground placeholder-muted text-[13px] outline-none focus:ring-1 focus:ring-primary/40 border border-input-border transition-all"
            />
            <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="검색어 초기화"
                className="absolute right-12 text-muted hover:text-foreground p-1 transition-colors"
                title="검색어 지우기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-1.5 h-[28px] px-2.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-foreground text-[12px] font-medium transition-all active:scale-95"
            >
              검색
            </button>
          </div>
        </div>

        {/* 우측: 필터/정렬 세그먼트 + 등록/삭제 버튼 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 모델 타입 필터 (VC Model 전용) */}
          {type === "vc_model" && (
            <div className="flex items-center bg-black/5 dark:bg-white/[0.04] p-1 rounded-xl">
              {[
                { value: "", label: "전체" },
                { value: "component", label: "컴포넌트" },
                { value: "layout", label: "레이아웃" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleModelTypeChange(option.value)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                    activeModelType === option.value
                      ? "bg-primary text-white font-semibold shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* 정렬 셀렉터 */}
          <div className="flex items-center bg-black/5 dark:bg-white/[0.04] p-1 rounded-xl">
            {[
              { id: "latest", label: "최신순" },
              { id: "downloads", label: "다운로드순" },
              { id: "name", label: "이름순" },
            ].map((sort) => (
              <button
                key={sort.id}
                type="button"
                onClick={() => handleSortChange(sort.id as any)}
                className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                  activeSort === sort.id
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>

          {/* 등록 / 삭제 버튼 */}
          {(user?.role === "admin" || user?.role === "developer") && (
            <div className="flex items-center gap-2 pl-1">
              <button
                type="button"
                onClick={handleOpenModal}
                className="h-[38px] px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-[13px] font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>등록</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (
                    libraryListRef.current &&
                    libraryListRef.current.handleDeleteSelected
                  ) {
                    const deleted =
                      await libraryListRef.current.handleDeleteSelected();
                    if (deleted) refreshList();
                  }
                }}
                className="h-[38px] px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[13px] font-medium transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center w-full mt-[16px] text-muted">
            로딩 중...
          </div>
        }
      >
        <LibraryList
          ref={libraryListRef}
          categoryId={null}
          subCategoryId={"0"}
          type={type}
          key={refreshKey}
          curPage={page}
          goToPage={goToPage}
        />
      </Suspense>

      {/* 모달 컴포넌트 */}
      <ComponentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitComponent}
        categories={[]}
        type={type as any}
      />

    </div>
  );
};

export default ComponentPageLayout;
