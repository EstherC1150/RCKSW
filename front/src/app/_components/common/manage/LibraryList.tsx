"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import useSearchStore from "@/app/stores/SearchStore";
import { TLibrary } from "@/app/_types/manage/manage.types";
import ThumbnailPlaceholder from "../ThumbnailPlaceholder";
import VideoThumbnail, { isVideoThumbnail } from "../VideoThumbnail";
import { DownloadIconButton } from "./DownloadButton";
import useUserStore from "@/app/stores/UserStore";
import { useAlertStore } from "@/app/stores/alertStore";
import { authenticatedFetch } from "@/app/utils/api";
import { Search } from "lucide-react";

type ApiResponse = {
  files: Omit<TLibrary, "selected">[];
  sortBy: string;
  totalPages: number;
  totalCount?: number;
  currentPage: number;
  type: "vc_plugin" | "ns_plugin" | "vc_model" | "ns_model" | "etc";
};

type LibraryListProps = {
  categoryId?: string | null;
  subCategoryId?: string;
  type?: "vc_plugin" | "ns_plugin" | "vc_model" | "ns_model" | "etc" | "all";
  curPage: number;
  goToPage: (page: number) => void;
  onTotalCountChange?: (total: number) => void;
};

const LibraryList = forwardRef(function LibraryList(
  {
    type = "vc_plugin",
    curPage,
    goToPage,
    categoryId,
    subCategoryId,
    onTotalCountChange,
  }: LibraryListProps,
  ref
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const sortBy = (searchParams.get("sortBy") || "latest") as
    | "latest"
    | "downloads"
    | "name";
  const modelType = searchParams.get("modelType") || "";
  const [libraryList, setLibraryList] = useState<TLibrary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDownloadId, setActiveDownloadId] = useState<number | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<number[]>([]);
  const { setSearch } = useSearchStore();

  const handleDownloadStart = (id: number) => {
    setDownloadingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleDownloadEnd = (id: number) => {
    setDownloadingIds((prev) => prev.filter((itemId) => itemId !== id));
  };
  const { user } = useUserStore();
  const canManage = user?.role === "admin" || user?.role === "developer";
  // 전체 선택 체크박스 ref
  const selectAllRef = useRef<HTMLInputElement>(null);

  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // 전체 선택 상태 계산
  const allSelected =
    libraryList.length > 0 && libraryList.every((item) => item.selected);
  const someSelected = libraryList.some((item) => item.selected);

  // 전체 선택/해제 함수
  const handleSelectAll = () => {
    const updatedList = libraryList.map((item) => ({
      ...item,
      selected: !allSelected,
    }));
    setLibraryList(updatedList);
  };

  // indeterminate 상태 반영
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = !allSelected && someSelected;
    }
  }, [allSelected, someSelected]);

  // 체크박스 상태 변경 함수
  const toggleSelect = (index: number, e?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
    if (e) {
      if ('stopPropagation' in e) e.stopPropagation();
      // 'target' in e는 MouseEvent에는 없으므로 타입 가드로 구분
    }
    const updatedList = [...libraryList];
    updatedList[index].selected = !updatedList[index].selected;
    setLibraryList(updatedList);
  };

  // 다운로드 아이콘 클릭 핸들러
  const handleDownloadClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDownloadId(activeDownloadId === id ? null : id);
  };

  // 다운로드 옵션 닫기 핸들러
  const handleCloseDownloadOptions = () => {
    setActiveDownloadId(null);
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

  // 컴포넌트 상세 페이지 사전 로드 (호버 시 즉시 프리페치)
  const handleComponentPrefetch = (itemId: number) => {
    const params = new URLSearchParams({
      fromType: type,
      fromPage: String(curPage),
      fromSortBy: sortBy,
      ...(search ? { fromSearch: search } : {}),
    });

    router.prefetch(`/manage/${itemId}?${params.toString()}`);
  };

  // 컴포넌트 클릭 핸들러
  const handleComponentClick = (itemId: number) => {
    console.log("Navigating to component detail:", itemId);
    const fromType = type;
    const fromPage = curPage;
    const fromSortBy = sortBy;
    const fromSearch = search;

    const params = new URLSearchParams({
      fromType,
      fromPage: String(fromPage),
      fromSortBy,
      ...(fromSearch ? { fromSearch } : {}),
    });

    router.push(`/manage/${itemId}?${params.toString()}`);
  };

  // 카테고리/서브카테고리 감시 로직 제거됨

  // 선택된 항목 id 배열
  const selectedIds = libraryList
    .filter((item) => item.selected)
    .map((item) => item.id);

  // 삭제 함수
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return false;
    const { showConfirm, showAlert, showToast } = useAlertStore.getState();

    const confirmed = await showConfirm(
      `선택한 ${selectedIds.length}개 파일(포함된 모든 버전 및 파일)을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
      {
        title: "일괄 삭제 확인",
        type: "warning",
        confirmText: "전체 삭제",
        cancelText: "취소",
      }
    );

    if (!confirmed) return false;
    try {
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/components`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: selectedIds }),
        }
      );
      if (!response.ok) throw new Error("삭제에 실패했습니다.");
      setLibraryList((prev) => prev.filter((item) => !item.selected));
      showToast("선택한 항목이 삭제되었습니다.", "success");
      return true;
    } catch (err) {
      showAlert(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다",
        { title: "삭제 오류", type: "error" }
      );
      return false;
    }
  };

  // 쿼리파라미터의 search 값이 바뀌면 전역 search 동기화
  useEffect(() => {
    const searchParam = searchParams.get("search") || "";
    if (search !== searchParam) setSearch(searchParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 데이터 fetch
  useEffect(() => {
    const fetchLibraries = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: (curPage ?? 1).toString(),
          limit: itemsPerPage.toString(),
          ...(type && type !== "all" ? { type } : {}),
          categoryId: categoryId || "0",
          subCategoryId: subCategoryId || "0",
          ...(search && { search }),
          ...(sortBy && { sortBy }),
          ...(type === "vc_model" && modelType && { modelType }),
        });

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/components?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("서버에서 데이터를 가져오는데 실패했습니다");
        }

        const data: ApiResponse = await response.json();

        if (data) {
          const librariesWithSelection = data.files.map((file) => ({
            ...file,
            selected: false,
          }));

          setLibraryList(librariesWithSelection);
          setTotalPages(data.totalPages);
          const count = data.totalCount ?? data.files.length;
          setTotalCount(count);
          if (onTotalCountChange) {
            onTotalCountChange(count);
          }
        } else {
          throw new Error("데이터를 가져오는데 실패했습니다");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLibraries();
  }, [
    curPage,
    search,
    sortBy,
    type,
    itemsPerPage,
    modelType,
    categoryId,
    subCategoryId,
    onTotalCountChange,
  ]);

  useImperativeHandle(ref, () => ({
    handleDeleteSelected,
  }));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center w-full mt-[16px] text-muted">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center w-full mt-[16px] text-rose-500 dark:text-rose-400">
        오류: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* 헤더 (모던 미니멀 스타일: 상/좌/우 테두리 제거, 하단 단일 구분선) */}
      <div className="w-full overflow-hidden rounded-2xl bg-card shadow-xs">
        <div className="flex bg-[#EAEFF6] dark:bg-[#182133] border-b border-[#D8E2EF] dark:border-white/10 w-full h-[48px] items-center">
        {canManage && (
          <div className="flex items-center justify-center flex-[1.5]">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={allSelected}
              onChange={handleSelectAll}
              className="w-[18px] h-[18px] rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
            />
          </div>
        )}
        {[
          { label: "미리보기", flex: "flex-[2]" },
          { label: "파일명", flex: "flex-[8]" },
          { label: "버전", flex: "flex-[2]" },
          { label: "등록일", flex: "flex-[4]" },
          { label: "업데이트", flex: "flex-[4]" },
          { label: "다운로드 수", flex: "flex-[2]" },
          { label: "다운로드", flex: "flex-[2]" },
        ].map((header, index) => (
          <p
            key={index}
            className={`flex font-bold text-[13px] text-slate-800 dark:text-slate-100 items-center justify-center ${header.flex} tracking-tight`}
          >
            {header.label}
          </p>
        ))}
      </div>

      {/* 리스트 (선 다이어트: 둔탁한 테두리 대신 부드러운 border-border 적용, 썸네일 엣지투엣지 풀 채움) */}
      <div className="w-full flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {libraryList.length > 0 ? (
          libraryList.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleComponentClick(item.id)}
              onMouseEnter={() => handleComponentPrefetch(item.id)}
              className="flex bg-card w-full items-center hover:bg-card-hover/80 cursor-pointer h-[124px] overflow-hidden transition-colors duration-150"
            >
              {canManage && (
                <div className="flex items-center justify-center flex-[1.5] h-full">
                  <input
                    type="checkbox"
                    className="w-[18px] h-[18px] rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
                    checked={item.selected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => toggleSelect(index, e)}
                  />
                </div>
              )}
              <div
                className="relative flex-[2] h-full overflow-hidden flex items-center justify-center flex-shrink-0"
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {(item.thumbnail_image === "/images/ic-vc.png" || 
                    item.thumbnail_image === "/images/ic-ns.png" || 
                    item.thumbnail_image === "/images/ic-etc.png" ||
                    item.thumbnail_image === "/uploads/thumbnails/ic-vc.png" || 
                    item.thumbnail_image === "/uploads/thumbnails/ic-ns.png" || 
                    item.thumbnail_image === "/uploads/thumbnails/ic-etc.png" || !item.thumbnail_image || item.thumbnail_image === "/images/thumbnail.png") ? (
                    <ThumbnailPlaceholder type={item.type || (type !== "all" ? type : "vc_plugin")} name={item.file_name} />
                  ) : isVideoThumbnail(item.thumbnail_image) ? (
                    <VideoThumbnail
                      src={`${process.env.NEXT_PUBLIC_API_URL}${item.thumbnail_image}`}
                      alt={`${item.file_name} 동영상 썸네일`}
                      alwaysPlay={index === libraryList.findIndex((it) => isVideoThumbnail(it.thumbnail_image))}
                    />
                  ) : (
                    <Image
                      src={
                        item.thumbnail_image
                          ? `${process.env.NEXT_PUBLIC_API_URL}${item.thumbnail_image}`
                          : "/images/thumbnail.png"
                      }
                      alt="thumbnail"
                      width={124}
                      height={124}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
              </div>
              <p
                className="flex items-center justify-center gap-2 font-[600] flex-[8] text-foreground h-full"
              >
                {item.file_name}
                {(type === "all" || !type) && item.type && (
                  <span className="text-[10px] px-2 py-[2px] rounded-md bg-black/5 dark:bg-white/[0.06] text-muted font-medium">
                    {item.type === "vc_plugin"
                      ? "VC PlugIn"
                      : item.type === "vc_model"
                      ? "VC Model"
                      : item.type === "ns_plugin"
                      ? "NS PlugIn"
                      : item.type === "ns_model"
                      ? "NS Model"
                      : "기타"}
                  </span>
                )}
                {item.model_type && (
                  <span
                    className={`text-[11px] px-2 py-[2px] rounded-full font-medium ${
                      item.model_type === "layout"
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-300"
                        : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300"
                    }`}
                  >
                    {item.model_type === "layout" ? "레이아웃" : "컴포넌트"}
                  </span>
                )}
              </p>
              <p
                className="flex font-mono text-[13px] items-center justify-center flex-[2] text-muted h-full"
              >
                {item.version}
              </p>
              <p
                className="flex text-[13px] items-center justify-center flex-[4] text-muted h-full"
              >
                {formatDate(item.registration_date)}
              </p>
              <p
                className="flex text-[13px] items-center justify-center flex-[4] text-muted h-full"
              >
                {formatDate(item.updated_at)}
              </p>
              <p
                className="flex font-medium text-[13px] items-center justify-center flex-[2] text-foreground/80 h-full"
              >
                {item.download_count}
              </p>
              <div className="flex font-[600] items-center justify-center flex-[2] h-full">
                <DownloadIconButton
                  item={{
                    id: item.id,
                    type: type, // 컴포넌트 타입 전달
                    fileLinks: {
                      source: item.file_path || item.source_file_link || item.vcmx_file_link,
                      fbx: item.fbx_file_link,
                    },
                  }}
                  isActive={activeDownloadId === item.id}
                  isDownloading={downloadingIds.includes(item.id)}
                  onClick={(e) => handleDownloadClick(item.id, e)}
                  onClose={handleCloseDownloadOptions}
                  onDownloadStart={handleDownloadStart}
                  onDownloadEnd={handleDownloadEnd}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-card-hover flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-muted" />
            </div>
            <p className="text-[14px] font-semibold text-foreground mb-1">
              {search ? `'${search}'에 대한 검색 결과가 없습니다.` : "등록된 컴포넌트가 없습니다."}
            </p>
            <p className="text-[12px] text-muted">
              {search ? "검색어의 철자를 확인하거나 다른 조건으로 검색해 보세요." : "새로운 컴포넌트를 등록해 보세요."}
            </p>
          </div>
        )}
      </div>
      </div>

      {/* 페이지네이션 및 표시 개수 설정 바 */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 mb-12 px-2 sm:pr-16 gap-4 text-foreground">
        {/* 표시 개수 선택 드롭다운 */}
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <span>보기:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              goToPage(1);
            }}
            className="bg-input border border-input-border text-foreground text-[13px] rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-colors cursor-pointer shadow-sm"
          >
            <option value={10}>10개씩 보기</option>
            <option value={20}>20개씩 보기</option>
            <option value={50}>50개씩 보기</option>
          </select>
          <span className="ml-2 text-muted">
            총 <span className="font-semibold text-foreground">{totalCount}</span>개 항목
          </span>
        </div>

        {/* 페이지 번호 버튼 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => goToPage(curPage - 1)}
            disabled={curPage === 1}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              curPage === 1
                ? "text-muted/30 cursor-not-allowed"
                : "text-muted hover:text-foreground hover:bg-card-hover"
            }`}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              const diff = Math.abs(page - curPage);
              return diff <= 2 || page === 1 || page === totalPages;
            })
            .map((page, index, array) => {
              if (index > 0 && page - array[index - 1] > 1) {
                return (
                  <React.Fragment key={`ellipsis-${page}`}>
                    <span className="px-2 text-muted">...</span>
                    <button
                      onClick={() => goToPage(page)}
                      className={`min-w-[32px] h-[32px] px-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center ${
                        curPage === page
                          ? "bg-primary text-white shadow-xs font-semibold"
                          : "text-muted hover:text-foreground hover:bg-card-hover"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              }
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`min-w-[32px] h-[32px] px-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center ${
                    curPage === page
                      ? "bg-primary text-white shadow-xs font-semibold"
                      : "text-muted hover:text-foreground hover:bg-card-hover"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          <button
            onClick={() => goToPage(curPage + 1)}
            disabled={curPage === totalPages}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              curPage === totalPages
                ? "text-muted/30 cursor-not-allowed"
                : "text-muted hover:text-foreground hover:bg-card-hover"
            }`}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
});

export default LibraryList;
