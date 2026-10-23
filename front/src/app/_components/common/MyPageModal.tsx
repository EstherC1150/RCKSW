"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import useUserStore from "@/app/stores/UserStore";
import { authenticatedFetch } from "@/app/utils/api";
import { IoPerson, IoMail, IoBriefcase, IoPhonePortrait, IoShieldCheckmark, IoClose } from "react-icons/io5";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  department: string;
  position: string;
  phone_number: string;
  role: string;
  is_approved: number;
}

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyPageModal({ isOpen, onClose }: MyPageModalProps) {
  const { updateUser, getAccessToken, clearAll } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 폼 입력 상태
  const [username, setUsername] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // 비밀번호 변경 상태
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfile = async () => {
      setLoading(true);
      setMessage(null);
      const token = getAccessToken();
      if (!token) {
        clearAll();
        onClose();
        return;
      }

      try {
        const res = await authenticatedFetch(`${API_URL}/api/users/profile`);
        if (!res.ok) {
          if (res.status === 401) {
            clearAll();
            onClose();
            return;
          }
          throw new Error("프로필 정보를 가져오는데 실패했습니다.");
        }
        const data = await res.json();
        if (data.success && data.data) {
          const userProfile = data.data;
          setProfile(userProfile);
          setUsername(userProfile.username || "");
          setDepartment(userProfile.department || "");
          setPosition(userProfile.position || "");
          setPhoneNumber(userProfile.phone_number || "");
        }
      } catch (err) {
        console.error("프로필 조회 에러:", err);
        setMessage({ text: "프로필 정보를 불러오는 중 오류가 발생했습니다.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, API_URL, getAccessToken, clearAll, onClose]);

  if (!isOpen || !isMounted || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (changePassword) {
      if (!currentPassword) {
        setMessage({ text: "현재 비밀번호를 입력해 주세요.", type: "error" });
        return;
      }
      if (!newPassword) {
        setMessage({ text: "새 비밀번호를 입력해 주세요.", type: "error" });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ text: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.", type: "error" });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        username,
        department,
        position,
        phone_number: phoneNumber,
      };

      if (changePassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await authenticatedFetch(`${API_URL}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setMessage({ text: "프로필 정보가 성공적으로 수정되었습니다.", type: "success" });
        // 전역 사용자 정보 스토어 업데이트
        updateUser({
          username,
          department,
          position,
          phone_number: phoneNumber,
        });

        // 비밀번호 입력 폼 초기화
        setChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage({ text: result.message || "프로필 수정에 실패했습니다.", type: "error" });
      }
    } catch (err) {
      console.error("프로필 수정 에러:", err);
      setMessage({ text: "프로필 수정 처리 중 오류가 발생했습니다.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-card border border-black/[0.08] dark:border-white/[0.1] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
              <IoPerson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">마이페이지 (내 정보 수정)</h2>
              <p className="text-xs text-muted mt-0.5">개인 프로필 및 비밀번호 관리</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 (스크롤) */}
        <div className="px-6 py-5 overflow-y-auto text-foreground">
          {message && (
            <div
              className={`p-3.5 mb-5 rounded-xl text-sm border flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}
            >
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 기본 계정 정보 (읽기전용) */}
              <div className="bg-card-hover/40 p-4 rounded-xl border border-border grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase mb-1">
                    아이디
                  </label>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <IoPerson className="text-muted text-xs" />
                    <span>{profile?.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase mb-1">
                    계정 권한
                  </label>
                  <div className="flex items-center gap-2 text-sm">
                    <IoShieldCheckmark className="text-blue-500" />
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {profile?.role === "admin" ? "관리자 (Admin)" : profile?.role === "developer" ? "개발자 (Developer)" : "일반 사용자 (User)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 인적 사항 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                  인적 사항
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">
                      사용자명 (이름) *
                    </label>
                    <div className="relative">
                      <IoPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-input border border-input-border rounded-xl text-foreground outline-none focus:border-primary text-sm transition-all"
                        placeholder="이름"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">
                      부서
                    </label>
                    <div className="relative">
                      <IoBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-input border border-input-border rounded-xl text-foreground outline-none focus:border-primary text-sm transition-all"
                        placeholder="부서명"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">
                      직책
                    </label>
                    <div className="relative">
                      <IoBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" />
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-input border border-input-border rounded-xl text-foreground outline-none focus:border-primary text-sm transition-all"
                        placeholder="직책"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">
                      전화번호
                    </label>
                    <div className="relative">
                      <IoPhonePortrait className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-input border border-input-border rounded-xl text-foreground outline-none focus:border-primary text-sm transition-all"
                        placeholder="010-0000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 비밀번호 변경 영역 (아코디언 카드 스타일) */}
              <div className="rounded-xl border border-border bg-card-hover/30 overflow-hidden transition-all">
                <div
                  onClick={() => setChangePassword(!changePassword)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer group select-none hover:bg-card-hover/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* 토글 스위치 */}
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out p-0.5 ${
                        changePassword ? "bg-primary" : "bg-card border border-border group-hover:bg-card-hover"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          changePassword ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors ${
                        changePassword ? "text-foreground font-semibold" : "text-muted group-hover:text-foreground"
                      }`}
                    >
                      비밀번호 변경하기
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {changePassword ? "접기" : "비밀번호 변경 시 클릭"}
                  </span>
                </div>

                {changePassword && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-3 bg-card-hover/20 animate-fade-in">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      비밀번호는 현재 비밀번호 확인 후 즉시 변경됩니다. (이메일 인증 불필요)
                    </p>
                    <div>
                      <label className="block text-xs text-muted mb-1">현재 비밀번호 *</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-input border border-input-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
                        placeholder="현재 비밀번호 입력"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted mb-1">새 비밀번호 *</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-input border border-input-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
                          placeholder="새 비밀번호 입력"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">새 비밀번호 확인 *</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-input border border-input-border rounded-lg text-foreground text-sm outline-none focus:border-primary"
                          placeholder="새 비밀번호 확인"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 버튼 */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-card hover:bg-card-hover text-muted hover:text-foreground border border-border text-sm font-medium transition-colors shadow-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "저장 중..." : "변경 사항 저장"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
