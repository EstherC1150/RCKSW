"use client";

import useUserStore from "@/app/stores/UserStore";
import React, { useState, useEffect, useCallback } from "react";
import SelectBox from "@/app/_components/common/SelectBox";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/app/utils/api";
import { useAlertStore } from "@/app/stores/alertStore";

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
  const { getAccessToken, clearAll } = useUserStore();
  const { showConfirm, showAlert, showToast } = useAlertStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const limit = 13;
  const [searchType, setSearchType] = useState("all");

  const handleTokenInvalid = useCallback(() => {
    clearAll();
    router.push("/login");
  }, [clearAll, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        handleTokenInvalid();
        return;
      }

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users?page=${currentPage}&limit=${limit}&sortBy=id`,
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
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalUsers(data.total);
      } else {
        showToast("사용자 목록을 불러오는데 실패했습니다.", "error");
      }
    } catch (err) {
      console.error("사용자 목록 조회 중 오류 발생:", err);
      showToast("사용자 목록을 불러오는 중 오류가 발생했습니다.", "error");
    }
  }, [currentPage, getAccessToken, handleTokenInvalid]);

  const handleSearch = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        handleTokenInvalid();
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users?search=${searchInput}&type=${searchType}&page=${currentPage}&limit=${limit}`,
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

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalUsers(data.total);
    } catch (err) {
      console.error("사용자 검색 중 오류 발생:", err);
      showToast("사용자 검색에 실패했습니다.", "error");
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleCheckboxChange = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      showToast("삭제할 사용자를 선택해주세요.", "error");
      return;
    }

    const confirmed = await showConfirm(
      `선택한 ${selectedUsers.length}명의 사용자를 삭제하시겠습니까?`,
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
          setUsers((prev) =>
            prev.filter((user) => !selectedUsers.includes(user.id))
          );
          setSelectedUsers([]);
          setIsAllSelected(false);
          if (selectedUser && selectedUsers.includes(selectedUser.id)) {
            setSelectedUser(null);
          }
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
    setCurrentPage(page);
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

      setUsers(
        users.map((user) =>
          user.id === selectedUser.id ? { ...user, ...updatedUser } : user
        )
      );

      setSelectedUser(updatedUser.data);
      setIsEditing(false);
      showToast("사용자 정보가 수정되었습니다.", "success");

      fetchUsers();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "알 수 없는 오류가 발생했습니다.",
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

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value);
    // 검색조건 변경 시: 검색어/페이지/선택 상태/목록 초기화 후 기본 목록 다시 불러오기
    setSearchInput("");
    setCurrentPage(1);
    setSelectedUser(null);
    setSelectedUsers([]);
    setIsAllSelected(false);
    setUsers([]);
    setTotalPages(1);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, searchType]);

  return (
    <div className="flex h-full bg-background p-4">

      {/* 왼쪽 사용자 목록 및 검색 */}
      <div className="w-[65%] p-4 border-r border-gray-700 flex flex-col h-full">
        <div className="flex-none">
          <h2 className="text-[24px] font-bold text-white mb-4">사용자 관리</h2>
          <div className="flex items-center mb-4 h-10">
            <div className="flex items-center space-x-2">
              <p className="text-white text-[14px]">검색조건</p>
              <div className="w-[120px]">
                <SelectBox
                  options={[
                    { label: "전체", value: "all" },
                    { label: "이름", value: "username" },
                    { label: "이메일", value: "email" },
                    { label: "부서", value: "department" },
                  ]}
                  defaultValue="all"
                  onChange={handleSearchTypeChange}
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="border border-gray-600 rounded-md w-[200px] h-[32px] outline-none px-3 bg-gray-700 text-white text-[14px] placeholder-gray-400"
                  placeholder="검색어를 입력하세요"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-3 h-[32px] rounded text-[13px] hover:bg-blue-700"
              >
                검색
              </button>
            </div>
          </div>
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="mr-2 h-4 w-4"
              />
              <span className="text-white">전체 선택</span>
            </div>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedUsers.length === 0}
              className={`px-3 py-1 rounded-md ${
                selectedUsers.length === 0
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              } transition-all duration-300 ease-in-out`}
            >
              선택 삭제
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto min-h-0">
          <table className="w-full text-white table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "7.5%" }} />
              {/* <col style={{ width: "7.5%" }} /> */}
            </colgroup>
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2"></th>
                <th className="p-2">이름</th>
                <th className="p-2">이메일</th>
                <th className="p-2">부서</th>
                <th className="p-2">직위</th>
                <th className="p-2">전화번호</th>
                <th className="p-2">권한</th>
                {/* <th className="p-2">상태</th> */}
              </tr>
            </thead>
            <tbody className="text-center">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`cursor-pointer hover:bg-gray-700 ${
                    selectedUser?.id === user.id ? "bg-gray-600" : ""
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleCheckboxChange(user.id)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="p-2 truncate">{user.username}</td>
                  <td className="p-2 truncate">{user.email}</td>
                  <td className="p-2 truncate">{user.department}</td>
                  <td className="p-2 truncate">{user.position}</td>
                  <td className="p-2 truncate">{user.phone_number}</td>
                  <td className="p-2 truncate">
                    {user.role === "admin" ? "관리자" : "유저"}
                  </td>
                  {/* <td className="p-2 truncate">
                    {user.is_approved ? "승인" : "미승인"}
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex-none flex justify-center items-center mt-4 text-white">
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // 현재 페이지 주변의 페이지 번호만 표시
                const diff = Math.abs(page - currentPage);
                return diff <= 2 || page === 1 || page === totalPages;
              })
              .map((page, index, array) => {
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-white hover:bg-gray-600"
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
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽 사용자 상세 정보 */}
      <div className="flex-1 p-4">
        {selectedUser ? (
          <div className="bg-card p-6 rounded-lg">
            <h3 className="text-[24px] font-semibold text-white mb-4">
              사용자 상세 정보
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    이메일
                  </label>
                  <div className="text-white">{selectedUser.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    이름
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={editForm.username || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-white">{selectedUser.username}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    부서
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={editForm.department || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-white">{selectedUser.department}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    직위
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="position"
                      value={editForm.position || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-white">{selectedUser.position}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    전화번호
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone_number"
                      value={editForm.phone_number || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-white">
                      {selectedUser.phone_number}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    권한
                  </label>
                  {isEditing ? (
                    <select
                      name="role"
                      value={editForm.role || selectedUser.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="admin">관리자</option>
                      <option value="user">유저</option>
                    </select>
                  ) : (
                    <div className="text-white">
                      {selectedUser.role === "admin" ? "관리자" : "유저"}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                    >
                      저장
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEditClick(selectedUser)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                  >
                    수정
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white">
            사용자를 선택하면 상세 정보가 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
