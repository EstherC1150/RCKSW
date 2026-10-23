"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useUserStore from "@/app/stores/UserStore";
import ThumbnailPlaceholder from "@/app/_components/common/ThumbnailPlaceholder";
import VideoThumbnail, { isVideoThumbnail } from "@/app/_components/common/VideoThumbnail";
import { DownloadIconButton } from "@/app/_components/common/manage/DownloadButton";
import {
  Search,
  Download,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";

interface TypeStat {
  component_count: number;
  total_downloads: number;
}

interface DashboardTotals {
  totalComponents: number;
  totalFiles: number;
  totalDownloads: number;
  totalUsers: number;
}

interface DashboardFileItem {
  id: number;
  component_id: number;
  file_name: string;
  version: string;
  type: "vc_plugin" | "ns_plugin" | "vc_model" | "ns_model" | "etc";
  model_type?: string | null;
  thumbnail_image: string | null;
  created_at: string;
  updated_at: string;
  download_count: number;
  source_file_link?: string | null;
  vcmx_file_link?: string | null;
  icon_file_link?: string | null;
  fbx_file_link?: string | null;
}

interface DashboardData {
  typeStats: {
    vc_plugin: TypeStat;
    vc_model: TypeStat;
    ns_plugin: TypeStat;
    ns_model: TypeStat;
    etc: TypeStat;
  };
  totals: DashboardTotals;
  recentFiles: DashboardFileItem[];
  popularFiles: DashboardFileItem[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"recent" | "popular">("recent");
  const [activeDownloadId, setActiveDownloadId] = useState<number | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<number[]>([]);

  const handleDownloadStart = (id: number) => {
    setDownloadingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleDownloadEnd = (id: number) => {
    setDownloadingIds((prev) => prev.filter((itemId) => itemId !== id));
  };

  const handleDownloadClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDownloadId(activeDownloadId === id ? null : id);
  };

  const handleCloseDownloadOptions = () => {
    setActiveDownloadId(null);
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
        const res = await fetch(`${apiUrl}/api/stats/dashboard`);
        if (!res.ok) throw new Error("대시보드 데이터를 불러오지 못했습니다.");
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/manage/search?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const [datePart] = dateString.split("T");
    if (!datePart) return dateString;
    const [year, month, day] = datePart.split("-");
    return `${year}.${month}.${day}`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "vc_plugin":
        return "VC PlugIn";
      case "vc_model":
        return "VC Model";
      case "ns_plugin":
        return "NS PlugIn";
      case "ns_model":
        return "NS Model";
      case "etc":
      default:
        return "기타";
    }
  };

  const currentGalleryList = activeTab === "recent" ? (data?.recentFiles ?? []) : (data?.popularFiles ?? []);

  return (
    <div className="min-h-full flex flex-col p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
      {/* 1. 상단 타이틀 & 검색바 (절제된 모던 톤) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          대시보드
        </h1>

        {/* 상단 통합 검색바 */}
        <form onSubmit={handleSearchSubmit} className="flex items-center w-full md:w-[360px] relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="전체 파일명 검색..."
            className="w-full h-[40px] pl-10 pr-24 rounded-xl bg-card border border-border text-foreground placeholder-muted text-[13px] outline-none focus:ring-1 focus:ring-primary/40 transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-16 text-muted hover:text-foreground p-1 transition-colors"
              title="검색어 지우기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 h-[28px] px-3 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-foreground text-[12px] font-medium transition-all active:scale-95 cursor-pointer"
          >
            검색
          </button>
        </form>
      </div>

      {/* 2. 핵심 지표 KPI 카드 (원래의 깔끔하고 부드러운 무테 카드) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 등록 컴포넌트 */}
        <div className="p-5 rounded-2xl bg-card hover:bg-card-hover transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between">
          <span className="text-[13px] font-medium text-muted">총 등록 컴포넌트</span>
          <div className="mt-3 space-y-1">
            <div className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {loading ? "..." : data?.totals?.totalComponents ?? 0}
              <span className="text-[13px] font-normal text-muted ml-1">개</span>
            </div>
            <p className="text-[11px] text-muted truncate">
              총 {data?.totals?.totalFiles ?? 0}개 파일 보관 중
            </p>
          </div>
        </div>

        {/* 3D 시뮬레이션 모델 */}
        <div className="p-5 rounded-2xl bg-card hover:bg-card-hover transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between">
          <span className="text-[13px] font-medium text-muted">3D 시뮬레이션 모델</span>
          <div className="mt-3 space-y-1">
            <div className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {loading
                ? "..."
                : (data?.typeStats?.vc_model?.component_count ?? 0) +
                  (data?.typeStats?.ns_model?.component_count ?? 0)}
              <span className="text-[13px] font-normal text-muted ml-1">개</span>
            </div>
            <p className="text-[11px] text-muted truncate">
              VC {data?.typeStats?.vc_model?.component_count ?? 0}개 · NS {data?.typeStats?.ns_model?.component_count ?? 0}개
            </p>
          </div>
        </div>

        {/* 소프트웨어 플러그인 */}
        <div className="p-5 rounded-2xl bg-card hover:bg-card-hover transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between">
          <span className="text-[13px] font-medium text-muted">소프트웨어 플러그인</span>
          <div className="mt-3 space-y-1">
            <div className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {loading
                ? "..."
                : (data?.typeStats?.vc_plugin?.component_count ?? 0) +
                  (data?.typeStats?.ns_plugin?.component_count ?? 0)}
              <span className="text-[13px] font-normal text-muted ml-1">개</span>
            </div>
            <p className="text-[11px] text-muted truncate">
              확장 기능 및 도구
            </p>
          </div>
        </div>

        {/* 누적 다운로드 */}
        <div className="p-5 rounded-2xl bg-card hover:bg-card-hover transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between">
          <span className="text-[13px] font-medium text-muted">누적 다운로드</span>
          <div className="mt-3 space-y-1">
            <div className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {loading ? "..." : (data?.totals?.totalDownloads ?? 0).toLocaleString()}
              <span className="text-[13px] font-normal text-muted ml-1">회</span>
            </div>
            <p className="text-[11px] text-muted truncate">
              전체 다운로드 누적 수치
            </p>
          </div>
        </div>
      </div>

      {/* 3. 메인 컴포넌트 갤러리 */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          {/* 탭: 최근 등록 vs 인기 순위 */}
          <div className="flex items-center bg-black/5 dark:bg-white/[0.05] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === "recent"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/[0.05]"
              }`}
            >
              최근 등록 및 업데이트
            </button>
            <button
              onClick={() => setActiveTab("popular")}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === "popular"
                  ? "bg-primary text-white shadow-sm font-semibold"
                  : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/[0.05]"
              }`}
            >
              인기 다운로드
            </button>
          </div>

          <Link
            href="/manage/search"
            className="text-[13px] text-muted hover:text-foreground flex items-center gap-1 transition-colors group"
          >
            <span>전체 목록</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 컴포넌트 갤러리 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-muted text-[14px]">
              파일 목록을 불러오는 중...
            </div>
          ) : currentGalleryList.length > 0 ? (
            currentGalleryList.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/manage/${item.id}`)}
                className="group relative flex flex-col justify-between rounded-2xl bg-card hover:bg-card-hover transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md cursor-pointer overflow-hidden"
              >
                {/* 상단 썸네일 프리뷰 */}
                <div className="relative w-full h-[150px] bg-black/5 dark:bg-white/[0.03] overflow-hidden flex items-center justify-center">
                  {(!item.thumbnail_image || item.thumbnail_image.includes("ic-") || item.thumbnail_image.includes("thumbnail.png")) ? (
                    <ThumbnailPlaceholder type={item.type} name={item.file_name} />
                  ) : isVideoThumbnail(item.thumbnail_image || "") ? (
                    <VideoThumbnail
                      src={`${process.env.NEXT_PUBLIC_API_URL}${item.thumbnail_image}`}
                      alt={item.file_name}
                      alwaysPlay={false}
                    />
                  ) : (
                    <Image
                      src={
                        item.thumbnail_image
                          ? `${process.env.NEXT_PUBLIC_API_URL}${item.thumbnail_image}`
                          : "/images/thumbnail.png"
                      }
                      alt={item.file_name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* 배지: 상단 좌/우 오버레이 */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                      {getTypeLabel(item.type)}
                    </span>
                    {item.model_type && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/40 text-gray-200 backdrop-blur-md">
                        {item.model_type === "layout" ? "레이아웃" : "컴포넌트"}
                      </span>
                    )}
                  </div>

                  <span className="absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-gray-200 backdrop-blur-md">
                    v{item.version}
                  </span>
                </div>

                {/* 카드 본문: 파일명 & 일자 */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.file_name}
                    </h3>
                    <p className="text-[11px] text-muted">
                      {formatDate(item.updated_at || item.created_at)}
                    </p>
                  </div>

                  {/* 카드 하단: 다운로드 수 & 버튼 */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[12px] text-muted">
                      <span>다운로드 </span>
                      <span className="font-semibold text-foreground/90">{item.download_count}</span>
                      <span>회</span>
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadClick(item.id, e);
                      }}
                    >
                      <DownloadIconButton
                        variant="button"
                        item={{
                          id: item.id,
                          type: item.type,
                          fileLinks: {
                            source: item.source_file_link || item.vcmx_file_link || undefined,
                            icon: item.icon_file_link || undefined,
                            fbx: item.fbx_file_link || undefined,
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
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-400 text-[14px]">
              등록된 파일이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 5. 관리자 / 개발자 컨트롤 타워 */}
      {(user?.role === "admin" || user?.role === "developer") && (
        <div className="p-5 rounded-2xl bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-foreground">
                시스템 관리자 컨트롤 타워
              </h4>
              <p className="text-[11px] text-muted">
                총 {data?.totals?.totalUsers ?? 0}명의 계정 및 접근 권한 관리
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/user"
              className="px-3.5 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-muted hover:text-foreground text-[12px] font-medium transition-all active:scale-95"
            >
              사용자 계정 관리
            </Link>
            <Link
              href="/log"
              className="px-3.5 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-muted hover:text-foreground text-[12px] font-medium transition-all active:scale-95"
            >
              시스템 로그 조회
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
