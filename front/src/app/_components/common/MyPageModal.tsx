"use client";

import React, { useState, useEffect } from "react";
import useUserStore from "@/app/stores/UserStore";
import { authenticatedFetch } from "@/app/utils/api";
import { IoPerson, IoMail, IoBriefcase, IoPhonePortrait, IoKey, IoShieldCheckmark, IoSave, IoClose } from "react-icons/io5";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0b1121] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 border border-primary/30 rounded-xl text-primary">
              <IoPerson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">마이페이지 (내 정보 수정)</h2>
              <p className="text-xs text-gray-400">개인 프로필 및 비밀번호 관리</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* 모달 본문 (스크롤) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-white">
          {message && (
            <div
              className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 기본 계정 정보 (읽기전용) */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase mb-1">
                    아이디 (계정)
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-200">
                    <IoMail className="text-gray-400" />
                    <span>{profile?.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase mb-1">
                    계정 권한
                  </label>
                  <div className="flex items-center gap-2 text-sm">
                    <IoShieldCheckmark className="text-blue-400" />
                    <span className="font-semibold text-blue-300">
                      {profile?.role === "admin" ? "관리자 (Admin)" : profile?.role === "developer" ? "개발자 (Developer)" : "일반 사용자 (User)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 인적 사항 */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                  인적 사항
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      사용자명 (이름) *
                    </label>
                    <div className="relative">
                      <IoPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-input border border-input-border rounded-xl text-white outline-none focus:border-primary text-sm"
                        placeholder="이름"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      부서
                    </label>
                    <div className="relative">
                      <IoBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-input border border-input-border rounded-xl text-white outline-none focus:border-primary text-sm"
                        placeholder="부서명"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      직책
                    </label>
                    <div className="relative">
                      <IoBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-input border border-input-border rounded-xl text-white outline-none focus:border-primary text-sm"
                        placeholder="직책"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      전화번호
                    </label>
                    <div className="relative">
                      <IoPhonePortrait className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-input border border-input-border rounded-xl text-white outline-none focus:border-primary text-sm"
                        placeholder="010-0000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 비밀번호 변경 영역 */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-amber-300">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <IoKey className="text-amber-400" />
                    <span>비밀번호 변경하기</span>
                  </label>
                </div>

                {changePassword && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3 animate-fade-in">
                    <p className="text-xs text-amber-200/80">
                      비밀번호는 현재 비밀번호 확인 후 즉시 변경됩니다. (이메일 인증 불필요)
                    </p>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">현재 비밀번호 *</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-input border border-input-border rounded-lg text-white text-sm outline-none focus:border-primary"
                        placeholder="현재 비밀번호 입력"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">새 비밀번호 *</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-input border border-input-border rounded-lg text-white text-sm outline-none focus:border-primary"
                          placeholder="새 비밀번호 입력"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">새 비밀번호 확인 *</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-input border border-input-border rounded-lg text-white text-sm outline-none focus:border-primary"
                          placeholder="새 비밀번호 확인"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  <IoSave className="w-4 h-4" />
                  <span>{saving ? "저장 중..." : "변경 사항 저장"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
