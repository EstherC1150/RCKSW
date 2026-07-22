"use client";

import React, { useState } from "react";
import useUserStore from "@/app/stores/UserStore"; // 인증 토큰 가져오기 위한 import
import { useAlertStore } from "@/app/stores/alertStore";

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
}

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const CategoryEditModal = ({
  isOpen,
  onClose,
  categories,
  setCategories,
}: CategoryEditModalProps) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [activeTab, setActiveTab] = useState<
    "categories" | "subcategories" | "fileMove"
  >("categories");
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<
    number | null
  >(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<
    number | null
  >(null);
  const [editingSubCategoryName, setEditingSubCategoryName] = useState("");

  // 파일 이동 관련 상태
  const [files, setFiles] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [selectedMoveCategory, setSelectedMoveCategory] = useState<
    number | null
  >(null);
  const [selectedMoveSubCategory, setSelectedMoveSubCategory] = useState<
    number | null
  >(null);
  const [moveSubCategories, setMoveSubCategories] = useState<SubCategory[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // 파일 이동 서브탭 및 필터링 상태
  const [fileMoveSubTab, setFileMoveSubTab] = useState<"library" | "object">(
    "library"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "date" | "category">("name");
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const itemsPerPage = 20;

  const getAccessToken = useUserStore((state) => state.getAccessToken); // 인증 토큰 가져오기

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const accessToken = getAccessToken();

      if (!accessToken) {
        useAlertStore.getState().showAlert("로그인이 필요한 서비스입니다.", { title: "접근 제한", type: "warning" });
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name: newCategoryName }),
          }
        );

        const { data } = await response.json();

        if (response.ok) {
          setCategories((prev) => [...prev, { id: data.id, name: data.name }]);
          setNewCategoryName("");
          showToast("카테고리가 추가되었습니다.", "success");
        } else {
          showToast(data.message || "카테고리 추가에 실패했습니다.", "error");
        }
      } catch (err) {
        console.error("카테고리 추가 중 오류 발생:", err);
        showToast("카테고리 추가 중 오류가 발생했습니다.", "error");
      }
    }
  };

  const handleEditCategory = (id: number, name: string) => {
    setEditingCategoryId(id);
    setEditingCategoryName(name);
  };

  const handleSaveEdit = async () => {
    if (editingCategoryId !== null && editingCategoryName.trim()) {
      const accessToken = getAccessToken();

      if (!accessToken) {
        useAlertStore.getState().showAlert("로그인이 필요한 서비스입니다.", { title: "접근 제한", type: "warning" });
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${editingCategoryId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name: editingCategoryName }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          setCategories((prev) =>
            prev.map((category) =>
              category.id === editingCategoryId
                ? { ...category, name: editingCategoryName }
                : category
            )
          );
          setEditingCategoryId(null);
          setEditingCategoryName("");

          // 마이그레이션 결과 표시
          if (result.data?.migration) {
            const migration = result.data.migration;
            if (migration.movedFiles > 0) {
              showToast(
                `카테고리가 수정되었습니다. ${migration.movedFiles}개 파일이 자동으로 이동되었습니다.`,
                "success"
              );
            } else {
              showToast("카테고리가 수정되었습니다.", "success");
            }
          } else {
            showToast("카테고리가 수정되었습니다.", "success");
          }
        } else {
          const data = await response.json();
          showToast(data.message || "카테고리 수정에 실패했습니다.", "error");
        }
      } catch (err) {
        console.error("카테고리 수정 중 오류 발생:", err);
        showToast("카테고리 수정 중 오류가 발생했습니다.", "error");
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      useAlertStore.getState().showAlert("로그인이 필요한 서비스입니다.", { title: "접근 제한", type: "warning" });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setCategories((prev) => prev.filter((category) => category.id !== id));
        showToast("카테고리가 삭제되었습니다.", "delete");
      } else {
        const data = await response.json();
        showToast(data.message || "카테고리 삭제에 실패했습니다.", "error");
      }
    } catch (err) {
      console.error("카테고리 삭제 중 오류 발생:", err);
      showToast("카테고리 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // 서브카테고리 관련 함수들
  const handleCategorySelectForSub = async (categoryId: number) => {
    setSelectedCategoryForSub(categoryId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories/subCategories/${categoryId}`
      );
      const result = await response.json();
      if (result.success) {
        setSubCategories(result.data);
      }
    } catch (err) {
      console.error("서브카테고리 조회 중 오류 발생:", err);
      showToast("서브카테고리 조회 중 오류가 발생했습니다.", "error");
    }
  };

  const handleAddSubCategory = async () => {
    if (newSubCategoryName.trim() && selectedCategoryForSub) {
      const accessToken = getAccessToken();

      if (!accessToken) {
        useAlertStore.getState().showAlert("로그인이 필요한 서비스입니다.", { title: "접근 제한", type: "warning" });
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${selectedCategoryForSub}/subCategories`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name: newSubCategoryName }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          setSubCategories((prev) => [...prev, result.data]);
          setNewSubCategoryName("");
          showToast("서브카테고리가 추가되었습니다.", "success");
        } else {
          showToast(
            result.message || "서브카테고리 추가에 실패했습니다.",
            "error"
          );
        }
      } catch (err) {
        console.error("서브카테고리 추가 중 오류 발생:", err);
        showToast("서브카테고리 추가 중 오류가 발생했습니다.", "error");
      }
    }
  };

  const handleEditSubCategory = (id: number, name: string) => {
    setEditingSubCategoryId(id);
    setEditingSubCategoryName(name);
  };

  const handleSaveSubCategoryEdit = async () => {
    if (editingSubCategoryId !== null && editingSubCategoryName.trim()) {
      const accessToken = getAccessToken();

      if (!accessToken) {
        useAlertStore.getState().showAlert("로그인이 필요한 서비스입니다.", { title: "접근 제한", type: "warning" });
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/categories/subCategories/${editingSubCategoryId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name: editingSubCategoryName }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          setSubCategories((prev) =>
            prev.map((subCategory) =>
              subCategory.id === editingSubCategoryId
                ? { ...subCategory, name: editingSubCategoryName }
                : subCategory
            )
          );
          setEditingSubCategoryId(null);
          setEditingSubCategoryName("");

          // 마이그레이션 결과 표시
          if (result.data?.migration) {
            const migration = result.data.migration;
            if (migration.movedFiles > 0) {
              showToast(
                `서브카테고리가 수정되었습니다. ${migration.movedFiles}개 파일이 자동으로 이동되었습니다.`,
                "success"
              );
            } else {
              showToast("서브카테고리가 수정되었습니다.", "success");
            }
          } else {
            showToast("서브카테고리가 수정되었습니다.", "success");
          }
        } else {
          const data = await response.json();
          showToast(
            data.message || "서브카테고리 수정에 실패했습니다.",
            "error"
          );
        }
      } catch (err) {
        console.error("서브카테고리 수정 중 오류 발생:", err);
        showToast("서브카테고리 수정 중 오류가 발생했습니다.", "error");
      }
    }
  };

  const handleDeleteSubCategory = async (id: number) => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      useAlertStore.getState().showAlert("로그인이 필요한 서비스입니다.", { title: "접근 제한", type: "warning" });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories/subCategories/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setSubCategories((prev) =>
          prev.filter((subCategory) => subCategory.id !== id)
        );
        showToast("서브카테고리가 삭제되었습니다.", "delete");
      } else {
        const data = await response.json();
        showToast(data.message || "서브카테고리 삭제에 실패했습니다.", "error");
      }
    } catch (err) {
      console.error("서브카테고리 삭제 중 오류 발생:", err);
      showToast("서브카테고리 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // 파일 이동 관련 함수들
  const loadFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/components?limit=1000`
      );
      const result = await response.json();
      if (result.files) {
        console.log("파일 데이터:", result.files);
        console.log(
          "라이브러리 파일:",
          result.files.filter((f: any) => f.type === "library")
        );
        console.log(
          "오브젝트 파일:",
          result.files.filter((f: any) => f.type === "object")
        );
        setFiles(result.files);
        applyFilters(result.files);
      }
    } catch (err) {
      console.error("파일 목록 조회 중 오류 발생:", err);
      showToast("파일 목록 조회 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 필터링 및 정렬 적용
  const applyFilters = (
    fileList: any[],
    currentSubTab?: "library" | "object"
  ) => {
    let filtered = fileList;
    const activeSubTab = currentSubTab || fileMoveSubTab;

    console.log("필터링 적용 - 현재 서브탭:", activeSubTab);
    console.log("전체 파일 수:", fileList.length);

    // 타입 필터 (라이브러리/오브젝트)
    if (activeSubTab === "library") {
      filtered = filtered.filter(
        (file) => file.type === "library" || file.type === "라이브러리"
      );
      console.log("라이브러리 필터링 후:", filtered.length);
    } else {
      filtered = filtered.filter(
        (file) => file.type === "object" || file.type === "오브젝트"
      );
      console.log("오브젝트 필터링 후:", filtered.length);
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter((file) =>
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 카테고리 필터
    if (filterCategory) {
      filtered = filtered.filter((file) => file.category_id === filterCategory);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.file_name.localeCompare(b.file_name);
        case "date":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "category":
          return (
            a.category_name.localeCompare(b.category_name) ||
            a.sub_category_name.localeCompare(b.sub_category_name)
          );
        default:
          return 0;
      }
    });

    setFilteredFiles(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFiles = filteredFiles.slice(startIndex, endIndex);

  // 필터 변경 핸들러들
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilters(files);
  };

  const handleSortChange = (newSortBy: "name" | "date" | "category") => {
    setSortBy(newSortBy);
    applyFilters(files);
  };

  const handleCategoryFilterChange = (categoryId: number | null) => {
    setFilterCategory(categoryId);
    applyFilters(files);
  };

  const handleSubTabChange = (subTab: "library" | "object") => {
    console.log("서브탭 변경:", subTab);
    setFileMoveSubTab(subTab);
    setSelectedFiles([]); // 탭 변경 시 선택 해제
    setCurrentPage(1); // 첫 페이지로 리셋
    // 필터링을 즉시 적용 (새로운 서브탭으로)
    applyFilters(files, subTab);
  };

  const handleMoveCategoryChange = async (categoryId: number) => {
    setSelectedMoveCategory(categoryId);
    setSelectedMoveSubCategory(null);
    setMoveSubCategories([]);

    if (categoryId) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/categories/subCategories/${categoryId}`
        );
        const result = await response.json();
        if (result.success) {
          setMoveSubCategories(result.data);
        }
      } catch (err) {
        console.error("서브카테고리 조회 중 오류 발생:", err);
        showToast("서브카테고리 조회 중 오류가 발생했습니다.", "error");
      }
    }
  };

  const handleFileSelect = (fileId: number) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === currentFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(currentFiles.map((file) => file.id));
    }
  };

  const handleBulkMove = async () => {
    if (selectedFiles.length === 0) {
      showToast("이동할 파일을 선택해주세요.", "error");
      return;
    }

    if (!selectedMoveCategory || !selectedMoveSubCategory) {
      showToast("목적지 카테고리와 서브카테고리를 선택해주세요.", "error");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      useAlertStore.getState().showAlert("로그인이 필요한 서비스입니다.", { title: "접근 제한", type: "warning" });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/components/bulk-move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fileIds: selectedFiles,
            categoryId: selectedMoveCategory,
            subCategoryId: selectedMoveSubCategory,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast(
          `${selectedFiles.length}개 파일이 성공적으로 이동되었습니다.`,
          "success"
        );
        setSelectedFiles([]);
        setSelectedMoveCategory(null);
        setSelectedMoveSubCategory(null);
        setMoveSubCategories([]);
        loadFiles(); // 파일 목록 새로고침
      } else {
        showToast(result.message || "파일 이동에 실패했습니다.", "error");
      }
    } catch (err) {
      console.error("파일 이동 중 오류 발생:", err);
      showToast("파일 이동 중 오류가 발생했습니다.", "error");
    }
  };

  const showToast = (message: string, type: "success" | "error" | "delete") => {
    const { showToast: toast } = useAlertStore.getState();
    const toastType = type === "error" || type === "delete" ? "error" : "success";
    toast(message, toastType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[900px] h-[700px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">카테고리 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        {/* 탭 메뉴 */}
        <div className="flex space-x-4 mb-6 flex-shrink-0">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "categories"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            메인 카테고리
          </button>
          <button
            onClick={() => setActiveTab("subcategories")}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "subcategories"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            서브 카테고리
          </button>
          <button
            onClick={() => {
              setActiveTab("fileMove");
              loadFiles();
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "fileMove"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            파일 이동 관리
          </button>
        </div>
        {/* 탭 내용 - 스크롤 가능 */}
        <div
          className="flex-1 overflow-y-scroll pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#374151 #111827",
          }}
        >
          {/* 메인 카테고리 탭 */}
          {activeTab === "categories" && (
            <div className="space-y-4">
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex justify-between items-center text-white"
                  >
                    {editingCategoryId === category.id ? (
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                      />
                    ) : (
                      <span>{category.name}</span>
                    )}
                    <div className="flex space-x-2">
                      {editingCategoryId === category.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-400 hover:text-green-500 transition-colors whitespace-nowrap"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryName("");
                            }}
                            className="text-gray-400 hover:text-gray-500 transition-colors whitespace-nowrap"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              handleEditCategory(category.id, category.name)
                            }
                            className="text-blue-400 hover:text-blue-500 transition-colors whitespace-nowrap"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-400 hover:text-red-500 transition-colors whitespace-nowrap"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                  placeholder="새 카테고리 이름"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-all duration-300 ease-in-out whitespace-nowrap"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {/* 서브 카테고리 탭 */}
          {activeTab === "subcategories" && (
            <div className="space-y-4">
              {/* 메인 카테고리 선택 */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">
                  메인 카테고리 선택:
                </label>
                <select
                  value={selectedCategoryForSub || ""}
                  onChange={(e) =>
                    handleCategorySelectForSub(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                >
                  <option value="">카테고리를 선택하세요</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 서브카테고리 목록 */}
              {selectedCategoryForSub && (
                <>
                  <ul className="space-y-2">
                    {subCategories.map((subCategory) => (
                      <li
                        key={subCategory.id}
                        className="flex justify-between items-center text-white"
                      >
                        {editingSubCategoryId === subCategory.id ? (
                          <input
                            type="text"
                            value={editingSubCategoryName}
                            onChange={(e) =>
                              setEditingSubCategoryName(e.target.value)
                            }
                            className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                          />
                        ) : (
                          <span>{subCategory.name}</span>
                        )}
                        <div className="flex space-x-2">
                          {editingSubCategoryId === subCategory.id ? (
                            <>
                              <button
                                onClick={handleSaveSubCategoryEdit}
                                className="text-green-400 hover:text-green-500 transition-colors whitespace-nowrap"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSubCategoryId(null);
                                  setEditingSubCategoryName("");
                                }}
                                className="text-gray-400 hover:text-gray-500 transition-colors whitespace-nowrap"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleEditSubCategory(
                                    subCategory.id,
                                    subCategory.name
                                  )
                                }
                                className="text-blue-400 hover:text-blue-500 transition-colors whitespace-nowrap"
                              >
                                편집
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteSubCategory(subCategory.id)
                                }
                                className="text-red-400 hover:text-red-500 transition-colors whitespace-nowrap"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newSubCategoryName}
                      onChange={(e) => setNewSubCategoryName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                      placeholder="새 서브카테고리 이름"
                    />
                    <button
                      onClick={handleAddSubCategory}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-all duration-300 ease-in-out whitespace-nowrap"
                    >
                      추가
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 파일 이동 관리 탭 */}
          {activeTab === "fileMove" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  파일 이동 관리
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500"
                  >
                    {selectedFiles.length === currentFiles.length
                      ? "전체 해제"
                      : "전체 선택"}
                  </button>
                  <button
                    onClick={handleBulkMove}
                    disabled={
                      selectedFiles.length === 0 ||
                      !selectedMoveCategory ||
                      !selectedMoveSubCategory
                    }
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    선택된 파일 이동 ({selectedFiles.length})
                  </button>
                </div>
              </div>

              {/* 서브탭 (라이브러리/오브젝트) */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => handleSubTabChange("library")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    fileMoveSubTab === "library"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  라이브러리 (
                  {
                    files.filter(
                      (f) => f.type === "library" || f.type === "라이브러리"
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => handleSubTabChange("object")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    fileMoveSubTab === "object"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  오브젝트 (
                  {
                    files.filter(
                      (f) => f.type === "object" || f.type === "오브젝트"
                    ).length
                  }
                  )
                </button>
              </div>

              {/* 검색 및 필터 */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700 rounded-lg">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    파일명 검색:
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 rounded-md text-white"
                    placeholder="파일명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    카테고리 필터:
                  </label>
                  <select
                    value={filterCategory || ""}
                    onChange={(e) =>
                      handleCategoryFilterChange(Number(e.target.value) || null)
                    }
                    className="w-full px-3 py-2 bg-gray-600 rounded-md text-white"
                  >
                    <option value="">전체 카테고리</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    정렬 기준:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      handleSortChange(
                        e.target.value as "name" | "date" | "category"
                      )
                    }
                    className="w-full px-3 py-2 bg-gray-600 rounded-md text-white"
                  >
                    <option value="name">이름순</option>
                    <option value="date">최신순</option>
                    <option value="category">카테고리순</option>
                  </select>
                </div>
              </div>

              {/* 목적지 선택 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700 rounded-lg">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    목적지 카테고리:
                  </label>
                  <select
                    value={selectedMoveCategory || ""}
                    onChange={(e) =>
                      handleMoveCategoryChange(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-gray-600 rounded-md text-white"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    목적지 서브카테고리:
                  </label>
                  <select
                    value={selectedMoveSubCategory || ""}
                    onChange={(e) =>
                      setSelectedMoveSubCategory(Number(e.target.value))
                    }
                    disabled={!selectedMoveCategory}
                    className="w-full px-3 py-2 bg-gray-600 rounded-md text-white disabled:bg-gray-500"
                  >
                    <option value="">서브카테고리를 선택하세요</option>
                    {moveSubCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 파일 목록 */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-white text-sm">
                    총 {filteredFiles.length}개 파일 (페이지 {currentPage}/
                    {totalPages})
                  </div>
                  <div className="text-white text-sm">
                    선택됨: {selectedFiles.length}개
                  </div>
                </div>

                {isLoadingFiles ? (
                  <div className="text-center text-white py-8">
                    파일 목록을 불러오는 중...
                  </div>
                ) : currentFiles.length === 0 ? (
                  <div className="text-center text-white py-8">
                    {searchQuery || filterCategory
                      ? "조건에 맞는 파일이 없습니다."
                      : "파일이 없습니다."}
                  </div>
                ) : (
                  <>
                    <div
                      className="space-y-1 max-h-60 overflow-y-scroll pr-2"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#4B5563 #1F2937",
                      }}
                    >
                      {currentFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center justify-between p-2 rounded border ${
                            selectedFiles.includes(file.id)
                              ? "bg-blue-600 border-blue-400"
                              : "bg-gray-600 border-gray-500 hover:bg-gray-500"
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => handleFileSelect(file.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium text-sm truncate">
                                {file.file_name}
                              </div>
                              <div className="text-gray-300 text-xs">
                                {file.category_name} / {file.sub_category_name}{" "}
                                • v{file.version} •{" "}
                                {new Date(file.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-4">
                        <button
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          이전
                        </button>
                        <span className="text-white text-sm">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>{" "}
        {/* 탭 내용 끝 */}
      </div>
    </div>
  );
};

export default CategoryEditModal;
