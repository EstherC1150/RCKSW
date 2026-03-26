import { create } from "zustand";

interface SearchState {
  // 검색어
  search: string;
  // 정렬 기준
  sortBy: "latest" | "downloads" | "name";
  // 필터링 상태
  filters: {
    status: string;
    version: string;
  };

  // 액션
  setSearch: (term: string) => void;
  setSortBy: (sort: "latest" | "downloads" | "name") => void;
  setFilters: (filters: { status?: string; version?: string }) => void;
  resetSearch: () => void;
}

const initialState = {
  search: "",
  sortBy: "latest" as const,
  filters: {
    status: "",
    version: "",
  },
};

const useSearchStore = create<SearchState>((set) => ({
  ...initialState,

  // 검색어 설정
  setSearch: (term) =>
    set((state) => ({
      ...state,
      search: term,
    })),

  // 정렬 기준 설정
  setSortBy: (sort) =>
    set((state) => ({
      ...state,
      sortBy: sort,
    })),

  // 필터 설정
  setFilters: (filters) =>
    set((state) => ({
      ...state,
      filters: { ...state.filters, ...filters },
    })),

  // 검색 상태 초기화
  resetSearch: () => set(initialState),
}));

export default useSearchStore;
