"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LibraryList from "@/app/_components/common/manage/LibraryList";
import { Search, X, LayoutDashboard, ChevronRight } from "lucide-react";

type SearchCategory =
  | "all"
  | "vc_plugin"
  | "vc_model"
  | "ns_plugin"
  | "ns_model"
  | "etc";

const CATEGORIES: { id: SearchCategory; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "vc_plugin", label: "VC PlugIn" },
  { id: "vc_model", label: "VC Model" },
  { id: "ns_plugin", label: "NS PlugIn" },
  { id: "ns_model", label: "NS Model" },
  { id: "etc", label: "기타" },
];

const SearchClientPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const typeParam = searchParams.get("type") || "all";
  const sortByParam = (searchParams.get("sortBy") || "latest") as
    | "latest"
    | "downloads"
    | "name";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [inputValue, setInputValue] = useState(search);
  const [selectedType, setSelectedType] = useState<SearchCategory>(
    CATEGORIES.some((cat) => cat.id === typeParam) ? (typeParam as SearchCategory) : "all"
  );
  const [activeSort, setActiveSort] = useState<"latest" | "downloads" | "name">(sortByParam);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const handleTotalCountChange = useCallback((count: number) => {
    setTotalCount(count);
  }, []);

  useEffect(() => {
    setInputValue(search);
    setSelectedType(CATEGORIES.some((cat) => cat.id === typeParam) ? (typeParam as SearchCategory) : "all");
    setActiveSort(sortByParam);
  }, [search, typeParam, sortByParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (inputValue.trim()) params.set("search", inputValue.trim());
    if (selectedType && selectedType !== "all") params.set("type", selectedType);
    params.set("sortBy", activeSort);
    params.set("page", "1");
    router.push(`/manage/search?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setInputValue("");
    const params = new URLSearchParams();
    if (selectedType && selectedType !== "all") params.set("type", selectedType);
    params.set("sortBy", activeSort);
    params.set("page", "1");
    router.push(`/manage/search?${params.toString()}`);
  };

  const handleCategoryChange = (catId: SearchCategory) => {
    setSelectedType(catId);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (catId && catId !== "all") params.set("type", catId);
    params.set("sortBy", activeSort);
    params.set("page", "1");
    router.push(`/manage/search?${params.toString()}`);
  };

  const handleSortChange = (sort: "latest" | "downloads" | "name") => {
    setActiveSort(sort);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedType && selectedType !== "all") params.set("type", selectedType);
    params.set("sortBy", sort);
    params.set("page", "1");
    router.push(`/manage/search?${params.toString()}`);
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedType && selectedType !== "all") params.set("type", selectedType);
    params.set("sortBy", activeSort);
    params.set("page", newPage.toString());
    router.push(`/manage/search?${params.toString()}`);
  };

  return (
    <div className="min-h-full flex flex-col p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
      {/* 1. 상단 브레드크럼 & 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              대시보드
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
            <span className="text-foreground font-medium">
              {search ? "검색 결과 목록" : "전체 목록"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {search ? (
              <>
                <span className="text-primary font-semibold">&ldquo;{search}&rdquo;</span> 검색 결과
              </>
            ) : (
              "전체 목록"
            )}
            {totalCount !== null && (
              <span className="text-[15px] font-normal text-muted ml-2">
                (총 {totalCount}개)
              </span>
            )}
          </h1>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-card-hover border border-border text-muted hover:text-foreground text-[13px] font-medium transition-all active:scale-95 self-start md:self-auto shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>대시보드로 이동</span>
        </Link>
      </div>

      {/* 2. 컨트롤 바: 카테고리 필터 + 검색창 + 정렬 셀렉터 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 rounded-2xl shadow-xs">
        {/* 카테고리 필터 탭 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all ${
                selectedType === cat.id
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/[0.04]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 우측 검색 인풋 + 정렬 */}
        <div className="flex items-center gap-3">
          {/* 검색창 */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-[260px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="결과 내 재검색..."
                className="w-full h-[38px] pl-9 pr-16 rounded-xl bg-input hover:bg-card-hover focus:bg-input border border-input-border text-foreground placeholder-muted text-[13px] outline-none focus:ring-1 focus:ring-primary/40 transition-all"
            />
            <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-12 text-muted hover:text-foreground p-1 transition-colors"
                title="검색어 지우기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 h-[26px] px-2.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-foreground text-[12px] font-medium transition-all active:scale-95"
            >
              검색
            </button>
          </form>

          {/* 정렬 셀렉터 */}
          <div className="flex items-center bg-black/5 dark:bg-white/[0.04] p-1 rounded-xl flex-shrink-0">
            {(
              [
                { id: "latest", label: "최신순" },
                { id: "downloads", label: "다운로드순" },
                { id: "name", label: "이름순" },
              ] as const
            ).map((sort) => (
              <button
                key={sort.id}
                onClick={() => handleSortChange(sort.id)}
                className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                  activeSort === sort.id
                    ? "bg-card text-primary dark:text-white font-semibold shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 검색 결과 리스트 (LibraryList 기반 풀 테이블 뷰) */}
      <div className="w-full">
        <LibraryList
          type={selectedType}
          curPage={page}
          goToPage={goToPage}
          onTotalCountChange={handleTotalCountChange}
        />
      </div>
    </div>
  );
};

export default SearchClientPage;
