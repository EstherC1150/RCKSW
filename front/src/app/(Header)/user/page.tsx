"use client";

import useUserStore from "@/app/stores/UserStore";
import React, { useState, useEffect, useCallback } from "react";
import SelectBox from "@/app/_components/common/SelectBox";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/app/utils/api";
import { useAlertStore } from "@/app/stores/alertStore";
import {
  Search,
  Trash2,
  User as UserIcon,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  username: string;
  department: string;
  position: string;
  phone_number: string;
  role: string;
  is_approved: boolean;
  isLoggedIn: boolean;
}

const UserManagementPage = () => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const getAccessToken = useUserStore((state) => state.getAccessToken);
  const clearAll = useUserStore((state) => state.clearAll);
  const showConfirm = useAlertStore((state) => state.showConfirm);
  const showToast = useAlertStore((state) => state.showToast);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const limit = 12;
  const [searchType, setSearchType] = useState("all");

  const handleTokenInvalid = useCallback(() => {
    clearAll();
    router.push("/login");
  }, [clearAll, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        handleTokenInvalid();
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy: "id",
      });

      if (searchQuery) {
        params.set("search", searchQuery);
        params.set("type", searchType);
      }

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleTokenInvalid();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.total || 0);

        setSelectedUser((prevSelected) => {
          if (!prevSelected) return null;
          const matched = (data.users || []).find((u: User) => u.id === prevSelected.id);
          return matched || prevSelected;
        });
      } else {
        showToast("사용자 목록을 불러오는데 실패했습니다.", "error");
      }
    } catch (err) {
      console.error("사용자 목록 조회 중 오류 발생:", err);
      showToast("사용자 목록을 불러오는 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, searchType, limit, getAccessToken, handleTokenInvalid, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
    setSelectedUsers([]);
  };

  const handleResetSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
    setSelectedUsers([]);
  };

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value);
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
    setSelectedUser(null);
    setSelectedUsers([]);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setIsEditing(false);
    setEditForm({});
  };

  const handleCheckboxChange = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const isAllSelected = users.length > 0 && users.every((user) => selectedUsers.includes(user.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      showToast("삭제할 사용자를 선택해주세요.", "error");
      return;
    }

    const confirmed = await showConfirm(
      `선택한 ${selectedUsers.length}명의 사용자를 영구 삭제하시겠습니까?`,
      {
        title: "사용자 삭제 확인",
        type: "warning",
        confirmText: "삭제",
        cancelText: "취소",
      }
    );

    if (confirmed) {
      try {
        const token = getAccessToken();
        if (!token) {
          handleTokenInvalid();
          return;
        }

        const response = await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userIds: selectedUsers }),
          }
        );

        if (response.status === 401) {
          handleTokenInvalid();
          return;
        }

        if (response.ok) {
          if (selectedUser && selectedUsers.includes(selectedUser.id)) {
            setSelectedUser(null);
          }
          setSelectedUsers([]);
          showToast("선택한 사용자가 삭제되었습니다.", "success");
          fetchUsers();
        } else {
          showToast("사용자 삭제에 실패했습니다.", "error");
        }
      } catch (err) {
        console.error("사용자 삭제 중 오류 발생:", err);
        showToast("사용자 삭제 중 오류가 발생했습니다.", "error");
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      department: user.department,
      position: user.position,
      phone_number: user.phone_number,
      role: user.role,
      is_approved: user.is_approved,
      isLoggedIn: user.isLoggedIn,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const token = getAccessToken();
      if (!token) {
        handleTokenInvalid();
        return;
      }

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (response.status === 401) {
        handleTokenInvalid();
        return;
      }

      if (!response.ok) {
        throw new Error("사용자 정보 수정에 실패했습니다.");
      }

      const updatedUser = await response.json();

      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, ...updatedUser } : user
        )
      );

      setSelectedUser(updatedUser.data);
      setIsEditing(false);
      showToast("사용자 정보가 성공적으로 수정되었습니다.", "success");
      fetchUsers();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
        "error"
      );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-300">
            관리자
          </span>
        );
      case "developer":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-300">
            개발자
          </span>
        );
      case "user":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-500/10 dark:bg-white/10 text-slate-600 dark:text-gray-300">
            일반 유저
          </span>
        );
    }
  };

  return (
    <div className="min-h-full flex flex-col p-6 lg:p-8 max-w-[1700px] mx-auto w-full space-y-6">
      {/* 1. 상단 타이틀 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[12px] font-semibold text-muted tracking-wider uppercase">
            RCK Admin
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">사용자 관리</h1>
            <span className="text-[12px] font-medium text-muted px-2.5 py-0.5 rounded-full bg-card shadow-xs">
              총 {totalUsers}명
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchUsers()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-card-hover text-muted hover:text-foreground text-[13px] font-medium transition-all active:scale-95 self-start md:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>새로고침</span>
        </button>
      </div>

      {/* 2. 컨트롤 바 (검색 필터 및 다중 선택 삭제) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 rounded-2xl shadow-xs">
        {/* 검색 조건 & 검색창 */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          <div className="w-[120px]">
            <SelectBox
              options={[
                { label: "전체", value: "all" },
                { label: "이름", value: "username" },
                { label: "아이디", value: "email" },
                { label: "부서", value: "department" },
              ]}
              defaultValue="all"
              onChange={handleSearchTypeChange}
            />
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색어를 입력하세요..."
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
                title="검색 초기화"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="h-[38px] px-4 rounded-xl bg-card hover:bg-card-hover text-foreground text-[13px] font-medium transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-muted" />
            <span>검색</span>
          </button>
        </div>

        {/* 선택 삭제 버튼 */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {selectedUsers.length > 0 && (
            <span className="text-[12px] text-muted">
              <strong className="text-foreground font-semibold">{selectedUsers.length}</strong>명 선택됨
            </span>
          )}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedUsers.length === 0}
            className={`h-[38px] px-4 rounded-xl text-[13px] font-medium transition-all flex items-center gap-1.5 ${
              selectedUsers.length === 0
                ? "bg-card/40 text-muted/50 border border-border/50 cursor-not-allowed"
                : "bg-red-500/15 hover:bg-red-500/25 text-red-500 dark:text-red-400 border border-red-500/30 active:scale-95 shadow-sm"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>선택 삭제</span>
          </button>
        </div>
      </div>

      {/* 3. 2단 레이아웃: 좌측 사용자 테이블 + 우측 상세 정보 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 좌측 사용자 테이블 영역 */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
          <div className="rounded-2xl bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-foreground table-fixed border-collapse">
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#EAEFF6] dark:bg-[#182133] border-b border-[#D8E2EF] dark:border-white/10 h-[48px]">
                    <th className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-[18px] h-[18px] rounded border-border text-primary focus:ring-primary/40 cursor-pointer align-middle"
                        title="전체 선택"
                      />
                    </th>
                    <th className="p-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                      이름
                    </th>
                    <th className="p-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                      아이디
                    </th>
                    <th className="p-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                      부서
                    </th>
                    <th className="p-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                      직위
                    </th>
                    <th className="p-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                      전화번호
                    </th>
                    <th className="p-3 font-bold text-[13px] text-slate-800 dark:text-slate-100 tracking-tight text-center">
                      권한
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-muted text-[14px]">
                        사용자 목록을 불러오는 중...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-muted text-[14px]">
                        조건에 일치하는 사용자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isSelected = selectedUser?.id === user.id;
                      const isChecked = selectedUsers.includes(user.id);
                      return (
                        <tr
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className={`border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0 cursor-pointer transition-colors duration-150 h-[52px] ${
                            isSelected
                              ? "bg-primary/10 dark:bg-white/[0.08] relative"
                              : isChecked
                              ? "bg-primary/5 dark:bg-white/[0.04]"
                              : "hover:bg-card-hover/60"
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxChange(user.id)}
                              className="w-[18px] h-[18px] rounded border-border text-primary focus:ring-primary/40 cursor-pointer align-middle"
                            />
                          </td>
                          <td className="p-3 font-medium text-foreground text-[13px] text-center truncate">
                            {user.username}
                          </td>
                          <td className="p-3 text-foreground/80 text-[13px] font-mono text-center truncate">
                            {user.email}
                          </td>
                          <td className="p-3 text-muted text-[13px] text-center truncate">
                            {user.department || "-"}
                          </td>
                          <td className="p-3 text-muted text-[13px] text-center truncate">
                            {user.position || "-"}
                          </td>
                          <td className="p-3 text-muted text-[13px] text-center truncate">
                            {user.phone_number || "-"}
                          </td>
                          <td className="p-3 text-center">
                            {getRoleBadge(user.role)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 바 */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-1 gap-3 text-foreground">
            <span className="text-[12px] text-muted">
              페이지 <strong className="text-foreground font-semibold">{currentPage}</strong> / {totalPages || 1}
              <span className="ml-2 text-muted/70">
                (총 <span className="text-foreground font-medium">{totalUsers}</span>명)
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

        {/* 우측 사용자 상세 정보 패널 */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          {selectedUser ? (
            <div className="rounded-2xl bg-card p-6 shadow-xs flex flex-col space-y-6">
              {/* 패널 상단 유저 정보 */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[16px]">
                    {selectedUser.username ? selectedUser.username.charAt(0) : "U"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                      {selectedUser.username}
                      {getRoleBadge(selectedUser.role)}
                    </h3>
                    <p className="text-[12px] text-muted font-mono mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => handleEditClick(selectedUser)}
                    className="px-3 py-1.5 rounded-xl bg-card hover:bg-card-hover text-foreground text-[12px] font-medium border border-border transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>수정</span>
                  </button>
                )}
              </div>

              {/* 입력 / 표시 폼 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  {/* 아이디 */}
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      아이디
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl bg-card-hover/40 border border-border text-foreground font-mono text-[13px]">
                      {selectedUser.email}
                    </div>
                  </div>

                  {/* 이름 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      이름
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={editForm.username || ""}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-[13px] outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                      />
                    ) : (
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-card-hover/40 border border-border text-foreground text-[13px] font-medium">
                        {selectedUser.username}
                      </div>
                    )}
                  </div>

                  {/* 부서 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      부서
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="department"
                        value={editForm.department || ""}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-[13px] outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                      />
                    ) : (
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-card-hover/40 border border-border text-foreground text-[13px]">
                        {selectedUser.department || "-"}
                      </div>
                    )}
                  </div>

                  {/* 직위 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      직위
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="position"
                        value={editForm.position || ""}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-[13px] outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                      />
                    ) : (
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-card-hover/40 border border-border text-foreground text-[13px]">
                        {selectedUser.position || "-"}
                      </div>
                    )}
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      전화번호
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="phone_number"
                        value={editForm.phone_number || ""}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-[13px] outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                      />
                    ) : (
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-card-hover/40 border border-border text-foreground text-[13px]">
                        {selectedUser.phone_number || "-"}
                      </div>
                    )}
                  </div>

                  {/* 권한 */}
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      시스템 권한
                    </label>
                    {isEditing ? (
                      <select
                        name="role"
                        value={editForm.role || selectedUser.role}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 rounded-xl bg-input border border-input-border text-foreground text-[13px] outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                      >
                        <option value="admin">관리자 (admin)</option>
                        <option value="developer">개발자 (developer)</option>
                        <option value="user">일반 유저 (user)</option>
                      </select>
                    ) : (
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-card-hover/40 border border-border text-foreground text-[13px] flex items-center justify-between">
                        <span>
                          {selectedUser.role === "admin"
                            ? "관리자 (모든 권한 부여)"
                            : selectedUser.role === "developer"
                            ? "개발자 (컴포넌트 등록 및 관리 권한)"
                            : "일반 유저 (조회 및 다운로드 권한)"}
                        </span>
                        {getRoleBadge(selectedUser.role)}
                      </div>
                    )}
                  </div>
                </div>

                {/* 수정 모드 버튼 */}
                {isEditing && (
                  <div className="flex justify-end items-center gap-2 pt-3 border-t border-border">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-muted hover:text-foreground text-[13px] font-medium border border-border transition-all"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-[13px] font-medium shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>저장</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border p-10 shadow-sm flex flex-col items-center justify-center text-center space-y-3 min-h-[380px]">
              <div className="w-14 h-14 rounded-2xl bg-card-hover border border-border flex items-center justify-center text-muted mb-1">
                <UserIcon className="w-7 h-7" />
              </div>
              <p className="text-foreground font-semibold text-[15px]">선택된 사용자가 없습니다</p>
              <p className="text-muted text-[13px] max-w-[240px] leading-relaxed">
                좌측 목록에서 사용자를 클릭하면 상세 정보 조회 및 권한 수정이 가능합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
