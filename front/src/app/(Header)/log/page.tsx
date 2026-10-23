"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "@/app/stores/UserStore";
import { authenticatedFetch } from "@/app/utils/api";
import {
  Search,
  RefreshCw,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  department: string;
  position: string;
  phone_number: string;
  isLoggedIn: boolean;
  role: "user" | "admin" | "developer";
  log: string;
}

const formatDateTime = (isoString: string) => {
  if (!isoString) return "-";

  const [datePart, timePart] = isoString.split("T");
  if (!datePart || !timePart) return isoString;

  const [year, month, day] = datePart.split("-");
  const [time] = timePart.split(".");
  const [hours, minutes, seconds] = time ? time.split(":") : ["00", "00", "00"];

  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};

const LogPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { getAccessToken, user } = useUserStore();

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        setError("인증 토큰이 없습니다. 다시 로그인 해주세요.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: "log",
      });

      if (searchQuery) {
        params.set("search", searchQuery);
        params.set("type", "all");
      }

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("유저 접속 로그를 불러오지 못했습니다.");
      const data = await response.json();
      setUsers(data.users || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleResetSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-full flex flex-col p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
      {/* 1. 상단 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[12px] font-semibold text-muted tracking-wider uppercase">
            RCK System Log
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">유저 접속 로그</h1>
            <span className="text-[12px] font-medium text-muted px-2.5 py-0.5 rounded-full bg-card shadow-xs">
              총 {totalCount}건
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchUsers()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-card-hover text-muted hover:text-foreground text-[13px] font-medium transition-all active:scale-95 self-start md:self-auto shadow-xs"
          title="새로고침"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>새로고침</span>
        </button>
      </div>

      {/* 2. 컨트롤 바 (검색창 & 표시 개수) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl shadow-xs">
        {/* 검색 입력창 */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="사용자명, 아이디, 부서 검색..."
              className="w-full h-[38px] pl-9 pr-8 rounded-xl bg-input hover:bg-card-hover focus:bg-input text-foreground placeholder-muted text-[13px] outline-none focus:ring-1 focus:ring-primary/40 border border-input-border transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchInput && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
                title="검색어 지우기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="h-[38px] px-4 rounded-xl bg-card hover:bg-card-hover text-foreground text-[13px] font-medium transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
          >
            <span>검색</span>
          </button>
        </div>

        {/* 표시 개수 선택 드롭다운 */}
        <div className="flex items-center gap-2 text-[13px] text-muted self-end sm:self-auto">
          <span>보기:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-input border border-input-border text-foreground text-[13px] rounded-xl px-3 py-1.5 outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value={10}>10개씩 보기</option>
            <option value={15}>15개씩 보기</option>
            <option value={20}>20개씩 보기</option>
            <option value={50}>50개씩 보기</option>
          </select>
        </div>
      </div>

      {/* 3. 로그 데이터 테이블 */}
      <div className="flex flex-col space-y-4">
        <div className="rounded-2xl bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-foreground table-fixed border-collapse">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead>
                <tr className="bg-[#EAEFF6] dark:bg-[#182133] border-b border-[#D8E2EF] dark:border-white/10 h-[48px]">
                  <th className="px-4 py-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                    아이디
                  </th>
                  <th className="px-4 py-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                    이름
                  </th>
                  <th className="px-4 py-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                    부서
                  </th>
                  <th className="px-4 py-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                    직위
                  </th>
                  <th className="px-4 py-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                    전화번호
                  </th>
                  <th className="px-4 py-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                    최종 접속 기록
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-muted text-[14px]">
                      접속 로그를 불러오는 중...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-red-500 text-[14px]">
                      {error}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-muted text-[14px]">
                      접속 기록 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0 hover:bg-card-hover/60 transition-colors duration-150 h-[52px]"
                    >
                      <td className="px-4 py-3 text-foreground/80 font-mono text-[13px] text-center truncate">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground text-[13px] text-center truncate">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-muted text-[13px] text-center truncate">
                        {user.department || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted text-[13px] text-center truncate">
                        {user.position || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted text-[13px] text-center truncate">
                        {user.phone_number || "-"}
                      </td>
                      <td className="px-4 py-3 text-center truncate">
                        {user.log ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-muted font-mono text-[12px]">
                            <Clock className="w-3 h-3 text-muted" />
                            {formatDateTime(user.log)}
                          </span>
                        ) : (
                          <span className="text-muted/60 text-[12px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. 페이지네이션 바 */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-1 gap-3 text-foreground">
          <span className="text-[12px] text-muted">
            페이지 <strong className="text-foreground font-semibold">{currentPage}</strong> / {totalPages || 1}
            <span className="ml-2 text-muted/70">
              (총 <span className="text-foreground font-medium">{totalCount}</span>건)
            </span>
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl text-[13px] font-medium transition-all ${
                currentPage === 1
                  ? "text-muted/30 cursor-not-allowed"
                  : "text-muted hover:text-foreground hover:bg-card-hover active:scale-95"
              }`}
              title="이전 페이지"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                const diff = Math.abs(page - currentPage);
                return diff <= 2 || page === 1 || page === totalPages;
              })
              .map((page, index, array) => {
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="px-1 text-muted text-[12px]">...</span>
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[32px] h-[32px] px-2 rounded-xl text-[12px] font-medium transition-all ${
                          currentPage === page
                            ? "bg-primary text-white font-semibold shadow-xs"
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
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[32px] h-[32px] px-2 rounded-xl text-[12px] font-medium transition-all ${
                      currentPage === page
                        ? "bg-primary text-white font-semibold shadow-xs"
                        : "text-muted hover:text-foreground hover:bg-card-hover"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl text-[13px] font-medium transition-all ${
                currentPage === totalPages
                  ? "text-muted/30 cursor-not-allowed"
                  : "text-muted hover:text-foreground hover:bg-card-hover active:scale-95"
              }`}
              title="다음 페이지"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogPage;

