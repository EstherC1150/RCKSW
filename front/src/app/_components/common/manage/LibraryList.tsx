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

type ApiResponse = {
  files: Omit<TLibrary, "selected">[];
  sortBy: string;
  totalPages: number;
  currentPage: number;
  type: "vc_plugin" | "ns_plugin" | "vc_model" | "ns_model" | "etc";
};

type LibraryListProps = {
  categoryId: string | null;
  subCategoryId: string;
  type?: "vc_plugin" | "ns_plugin" | "vc_model" | "ns_model" | "etc";
  curPage: number;
  goToPage: (page: number) => void;
};

const LibraryList = forwardRef(function LibraryList(
  {
    type = "vc_plugin",
    curPage,
    goToPage,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDownloadId, setActiveDownloadId] = useState<number | null>(null);
  const { setSearch } = useSearchStore();
  const { getAccessToken } = useUserStore();
  // 전체 선택 체크박스 ref
  const selectAllRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 4;

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

    const confirmed = await showConfirm(`선택한 ${selectedIds.length}개 항목을 삭제하시겠습니까?`, {
      title: "항목 삭제 확인",
      type: "warning",
      confirmText: "삭제",
      cancelText: "취소",
    });

    if (!confirmed) return false;
    const accessToken = getAccessToken();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/components`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
          type: type,
          categoryId: "0",
          subCategoryId: "0",
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
  }, [curPage, search, sortBy, type, itemsPerPage, modelType]);

  useImperativeHandle(ref, () => ({
    handleDeleteSelected,
  }));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center w-full mt-[16px] text-white">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center w-full mt-[16px] text-white">
        오류: {error}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full mt-[20px] h-full overflow-hidden">
      {/* 헤더 (우측 스크롤바 영역 보정 패딩 pr-[15px] 추가하여 어긋남 100% 원천 해결) */}
      <div className="flex bg-input border border-input-border w-full h-[48px] sticky top-0 z-20 rounded-t-lg mt-2 font-medium pr-[15px]">
        <div className="flex font-[600] items-center justify-center flex-[1.5] text-white">
          <input
            type="checkbox"
            ref={selectAllRef}
            checked={allSelected}
            onChange={handleSelectAll}
            className="w-[20px] h-[20px]"
          />
        </div>
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
            className={`flex font-[600] items-center justify-center ${header.flex} text-white`}
          >
            {header.label}
          </p>
        ))}
      </div>

      {/* 리스트 (스크롤바 공간 고정) */}
      <div className="flex-1 overflow-y-scroll [scrollbar-gutter:stable]">
        {libraryList.length > 0 ? (
          libraryList.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleComponentClick(item.id)}
              className="flex bg-card w-full items-center border-b-[1px] border-border hover:bg-input cursor-pointer h-[124px] overflow-hidden transition-colors duration-200"
            >
              <div className="flex items-center justify-center flex-[1.5] h-full">
                <input
                  type="checkbox"
                  className="w-[20px] h-[20px]"
                  checked={item.selected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => toggleSelect(index, e)}
                />
              </div>
              <div
                className="flex items-center justify-center flex-[2] relative aspect-square w-[100px] overflow-hidden"
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {(item.thumbnail_image === "/images/ic-vc.png" || 
                    item.thumbnail_image === "/images/ic-ns.png" || 
                    item.thumbnail_image === "/images/ic-etc.png" ||
                    item.thumbnail_image === "/uploads/thumbnails/ic-vc.png" || 
                    item.thumbnail_image === "/uploads/thumbnails/ic-ns.png" || 
                    item.thumbnail_image === "/uploads/thumbnails/ic-etc.png") ? (
                    <ThumbnailPlaceholder type={type} name={item.file_name} />
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
                      width={100}
                      height={100}
                      className="object-cover w-full h-full max-h-full"
                    />
                  )}
                </div>
              </div>
              <p
                className="flex items-center justify-center gap-2 font-[600] flex-[8] text-white h-full"
              >
                {item.file_name}
                {type === "vc_model" && item.model_type && (
                  <span
                    className={`text-[11px] px-2 py-[2px] rounded-full font-medium ${
                      item.model_type === "layout"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-cyan-500/20 text-cyan-300"
                    }`}
                  >
                    {item.model_type === "layout" ? "레이아웃" : "컴포넌트"}
                  </span>
                )}
              </p>
              <p
                className="flex font-[600] items-center justify-center flex-[2] text-white h-full"
              >
                {item.version}
              </p>
              <p
                className="flex font-[600] items-center justify-center flex-[4] text-white h-full"
              >
                {formatDate(item.registration_date)}
              </p>
              <p
                className="flex font-[600] items-center justify-center flex-[4] text-white h-full"
              >
                {formatDate(item.updated_at)}
              </p>
              <p
                className="flex font-[600] items-center justify-center flex-[2] text-white h-full"
              >
                {item.download_count}
              </p>
              <div className="flex font-[600] items-center justify-center flex-[2] h-full">
                <DownloadIconButton
                  item={{
                    id: item.id,
                    type: type, // 컴포넌트 타입 전달
                    fileLinks: {
                      source: item.source_file_link,
                      icon: item.icon_file_link,
                      fbx: item.fbx_file_link,
                    },
                  }}
                  isActive={activeDownloadId === item.id}
                  onClick={(e) => handleDownloadClick(item.id, e)}
                  onClose={handleCloseDownloadOptions}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-[200px] text-white">
            데이터가 없습니다.
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center items-center mt-4 mb-4 text-white">
        <div className="flex space-x-2">
          <button
            onClick={() => goToPage(curPage - 1)}
            disabled={curPage === 1}
            className={`px-3 py-1 rounded-md transition-all ${
              curPage === 1
                ? "bg-input border border-input-border text-muted cursor-not-allowed"
                : "bg-input border border-input-border text-white hover:bg-card-hover transition-colors"
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
                    <span className="px-2">...</span>
                    <button
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        curPage === page
                          ? "bg-primary text-white shadow-sm"
                          : "bg-input border border-input-border text-white hover:bg-card-hover transition-colors"
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
                  className={`px-3 py-1 rounded-md ${
                    curPage === page
                      ? "bg-primary text-white shadow-sm"
                      : "bg-input border border-input-border text-white hover:bg-card-hover transition-colors"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          <button
            onClick={() => goToPage(curPage + 1)}
            disabled={curPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              curPage === totalPages
                ? "bg-input border border-input-border text-muted cursor-not-allowed"
                : "bg-input border border-input-border text-white hover:bg-card-hover transition-colors"
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
