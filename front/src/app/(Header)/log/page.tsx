"use client";

import React, { useEffect, useState } from "react";
import useUserStore from "@/app/stores/UserStore";

interface User {
  id: number;
  username: string;
  email: string;
  department: string;
  position: string;
  phone_number: string;
  isLoggedIn: boolean;
  role: "user" | "admin";
  log: string;
}

const formatDateTime = (isoString: string) => {
  if (!isoString) return "-";

  // UTC 시간을 그대로 파싱
  const [datePart, timePart] = isoString.split("T");
  if (!datePart || !timePart) return isoString;

  const [year, month, day] = datePart.split("-");
  const [time] = timePart.split(".");
  const [hours, minutes, seconds] = time.split(":");

  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
};

const LogPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { getAccessToken } = useUserStore();
  const limit = 13;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        if (!token) {
          setError("인증 토큰이 없습니다. 다시 로그인 해주세요.");
          setLoading(false);
          return;
        }
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users?page=${currentPage}&limit=${limit}&sortBy=log`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("유저 정보를 불러오지 못했습니다.");
        const data = await response.json();
        setUsers(data.users);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [getAccessToken, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-8 min-h-[calc(100vh-50px)] bg-background flex flex-col">
      <h2 className="text-[24px] font-bold text-white mb-6">유저 접속 로그</h2>
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="text-white flex-1 flex items-center justify-center">
            로딩 중...
          </div>
        ) : error ? (
          <div className="text-red-400 flex-1 flex items-center justify-center">
            {error}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full bg-card text-white table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-700 text-center">
                    <th className="p-3 text-center">이메일</th>
                    <th className="p-3 text-center">이름</th>
                    <th className="p-3 text-center">부서</th>
                    <th className="p-3 text-center">직책</th>
                    <th className="p-3 text-center">전화번호</th>
                    <th className="p-3 text-center">최종 접속 기록</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-6 text-gray-400">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-600 hover:bg-gray-800 text-center"
                      >
                        <td className="p-3 text-center truncate">
                          {user.email}
                        </td>
                        <td className="p-3 text-center truncate">
                          {user.username}
                        </td>
                        <td className="p-3 text-center truncate">
                          {user.department}
                        </td>
                        <td className="p-3 text-center truncate">
                          {user.position}
                        </td>
                        <td className="p-3 text-center truncate">
                          {user.phone_number}
                        </td>
                        <td className="p-3 text-center truncate">
                          {formatDateTime(user.log)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* 페이지네이션 */}
            <div className="flex-none flex justify-center items-center mt-6 mb-2">
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
        )}
      </div>
    </div>
  );
};

export default LogPage;
