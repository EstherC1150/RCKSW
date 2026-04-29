"use client";

import LibraryList from "@/app/_components/common/manage/LibraryList";
import SelectBox from "@/app/_components/common/SelectBox";
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
import { useRouter, useSearchParams } from "next/navigation";

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
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [inputValue, setInputValue] = useState(search);
  const [activeSort, setActiveSort] = useState<"latest" | "downloads" | "name">(
    sortBy
  );

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

  const handleSubmitComponent = async (formData: TComponentFormData) => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      alert("로그인이 필요한 서비스입니다.");
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

    if (formData.iconFile) {
      formDataToSend.append("iconFile", formData.iconFile);
    }

    if (formData.fbxFile) {
      formDataToSend.append("fbxFile", formData.fbxFile);
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
      const response = await fetch(`${apiUrl}/api/components`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        alert(`${typeName}가 등록되었습니다.`);
        handleCloseModal();
        // 컴포넌트 목록 새로고침
        refreshList();
      } else {
        // 토큰 만료 등의 인증 오류 처리
        if (response.status === 401) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
          return;
        }
        alert(
          data.message || `${typeName} 등록에 실패했습니다.`
        );
      }
    } catch (err) {
      console.error(`${typeName} 등록 중 오류 발생:`, err);
      alert(`${typeName} 등록 중 오류가 발생했습니다.`);
    }
  };

  useEffect(() => {
    setInputValue(search);
    setActiveSort(sortBy);
  }, [search, sortBy]);

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

  // 정렬 기준 변경 핸들러 (타입별 경로 사용)
  const handleSortChange = (sort: "latest" | "downloads" | "name") => {
    setActiveSort(sort);
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", sort);
    params.set("page", "1");
    if (search) params.set("search", search);
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
    <div className="h-full flex flex-col p-8">
      {/* 프리미엄 리부트 탭 네비게이션 (Grouping & Toggle) */}
      <div className="flex items-center mb-8 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          {tabGroups.map((group) => {
            const isGroupActive = activeGroup?.id === group.id;
            const hasSubItems = group.subItems.length > 0;
            
            return (
              <div 
                key={group.id} 
                className={`flex items-center rounded-2xl transition-all duration-500 overflow-hidden ${
                  isGroupActive ? "bg-white/5 shadow-inner" : "hover:bg-white/5"
                }`}
              >
                {/* 대분류 아이콘 버튼 */}
                <button
                  onClick={() => {
                    if (group.id === "etc") handleTabChange("etc");
                    else if (group.subItems.length > 0) handleTabChange(group.subItems[0].id);
                  }}
                  className={`flex items-center justify-center w-[54px] h-[54px] transition-all duration-300 relative ${
                    isGroupActive ? "opacity-100" : "opacity-40 hover:opacity-100 grayscale hover:grayscale-0"
                  }`}
                >
                  <img src={group.icon} alt={group.label} className={`w-6 h-6 object-contain transition-transform duration-300 ${isGroupActive ? "scale-110" : "scale-100"}`} />
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
                            ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                            : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
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

      <div className="flex items-center justify-between bg-card p-5 mb-6 z-10 rounded-xl border border-border">
        <div className="flex items-center gap-6">

          {/* 검색 섹션 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                className="border border-input-border rounded-lg w-[240px] h-[40px] outline-none px-4 bg-input text-foreground text-[14px] placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                value={inputValue}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="검색어를 입력하세요"
              />
            </div>
            <button
              className="bg-white/10 text-white px-4 h-[40px] rounded-xl text-[14px] font-medium hover:bg-white/20 border border-white/5 transition-colors shadow-sm"
              onClick={handleSearch}
            >
              검색
            </button>
          </div>
        </div>

        {/* 등록/삭제 버튼 */}
        <div className="flex gap-2">
          {/* 정렬 섹션 */}
          <div className="flex items-center gap-2 mr-5">
            <p className="text-white text-[14px] mr-3">정렬기준</p>
            <div className="flex gap-4">
              <span
                className={`text-[14px] cursor-pointer ${
                  activeSort === "latest"
                    ? "text-blue-400 font-medium"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                onClick={() => handleSortChange("latest")}
              >
                최신순
              </span>
              <span
                className={`text-[14px] cursor-pointer ${
                  activeSort === "downloads"
                    ? "text-blue-400 font-medium"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                onClick={() => handleSortChange("downloads")}
              >
                다운로드순
              </span>
              <span
                className={`text-[14px] cursor-pointer ${
                  activeSort === "name"
                    ? "text-blue-400 font-medium"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                onClick={() => handleSortChange("name")}
              >
                이름순
              </span>
            </div>
          </div>
          {user?.role === "admin" && (
            <>
              <button
                className="px-6 h-[40px] bg-cyan-600/90 hover:bg-cyan-500 border border-cyan-400/50 text-white rounded-lg text-[14px] font-medium shadow-[0_0_15px_rgba(8,145,178,0.3)] transition-all duration-300 flex items-center justify-center"
                onClick={handleOpenModal}
              >
                등록
              </button>
              <button
                className="px-6 h-[40px] bg-rose-600/20 hover:bg-rose-500/80 border border-rose-500/50 text-rose-300 hover:text-white rounded-lg text-[14px] font-medium hover:shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
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
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center w-full mt-[16px] text-white">
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
