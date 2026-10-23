"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import useUserStore, { isJwtExpired } from "@/app/stores/UserStore";
import Image from "next/image";
import LoadingSpinner from "@/app/_components/common/LoadingSpinner";
import { useAlertStore } from "@/app/stores/alertStore";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setTokens } = useUserStore();
  const { showAlert } = useAlertStore();

  // 로그인 상태라면 자동 이동 (유효한 세션 검증 포함)
  useEffect(() => {
    const store = useUserStore.getState();
    const accessValid = store.tokens?.accessToken && !isJwtExpired(store.tokens.accessToken);
    const refreshValid = store.tokens?.refreshToken && !isJwtExpired(store.tokens.refreshToken);
    if (store.user && (accessValid || refreshValid)) {
      router.replace("/dashboard");
    } else {
      store.clearAll();
    }
  }, [router]);

  const handleLogin = () => {
    if (!email.trim()) {
      showAlert("아이디를 입력해주세요.", { title: "확인 필요", type: "warning" });
      return;
    }
    if (!password) {
      showAlert("비밀번호를 입력해주세요.", { title: "확인 필요", type: "warning" });
      return;
    }

    setIsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
    fetch(`${apiUrl}/api/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), pwd: password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data.user);
          setTokens({
            accessToken: data.data.token,
            refreshToken: data.data.refreshToken,
          });
          router.push("/dashboard");
        } else {
          showAlert(data.message || "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.", {
            title: "로그인 실패",
            type: "error",
          });
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("로그인 오류:", error);
        showAlert("서버 연결에 실패했습니다. 백엔드 서버 상태를 확인해주세요.", {
          title: "오류 발생",
          type: "error",
        });
        setIsLoading(false);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-center items-center p-4 overflow-hidden select-none bg-slate-950">
      {/* 1. 디지털 트윈 스마트 팩토리 배경 (밝고 선명하게) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url('/images/login-bg.jpg')` }}
      />

      {/* 2. 극도로 얇은 비네트 (공장 배경의 채광과 선명도를 100% 살림) */}
      <div className="absolute inset-0 bg-black/10" />

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <LoadingSpinner />
        </div>
      )}

      {/* 3. 진짜 투명한 퓨어 크리스탈 글래스 카드 (고급진 미드나잇 슬레이트 블루 틴트) */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#0b1626]/30 hover:bg-[#0b1626]/35 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.1)] transition-all">
        
        {/* 상단 로고 & 플랫폼 헤더 */}
        <div className="flex flex-col items-center text-center mb-8">
          <Image
            src="/images/RCK Logo-en-Horizontal-Reverse.png"
            alt="RCK Logo"
            width={130}
            height={32}
            className="object-contain drop-shadow mb-3"
            priority
          />
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            Software Management
          </h1>
          <p className="text-[13px] font-medium text-slate-300 mt-1.5 tracking-wide drop-shadow-xs">
            스마트 컴포넌트 & 라이브러리 플랫폼
          </p>
        </div>

        {/* 폼 입력 영역 (군더더기 없는 미니멀 클린 인풋) */}
        <div className="space-y-4">
          {/* 아이디 */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-200 mb-1.5 tracking-wide">
              아이디
            </label>
            <input
              type="text"
              id="email"
              placeholder="아이디를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-11 px-4 bg-black/25 hover:bg-black/30 focus:bg-black/40 border border-white/20 focus:border-[#3876BF] focus:ring-2 focus:ring-[#3876BF]/30 rounded-xl text-white font-medium text-[14px] placeholder-white/45 outline-none backdrop-blur-sm transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-200 mb-1.5 tracking-wide">
              비밀번호
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-11 pl-4 pr-11 bg-black/25 hover:bg-black/30 focus:bg-black/40 border border-white/20 focus:border-[#3876BF] focus:ring-2 focus:ring-[#3876BF]/30 rounded-xl text-white font-medium text-[14px] placeholder-white/45 outline-none backdrop-blur-sm transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? <IoEyeOff className="w-[17px] h-[17px]" /> : <IoEye className="w-[17px] h-[17px]" />}
              </button>
            </div>
          </div>

          {/* 로그인 버튼 (채도를 살짝 더 높여 생동감을 더한 비비드 로열 블루) */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-[#1E5FD8] to-[#2874ED] hover:from-[#174FB7] hover:to-[#2062CC] text-white font-bold text-[15px] tracking-wide shadow-lg shadow-[#1E5FD8]/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer border border-white/10"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>로그인 중...</span>
              </>
            ) : (
              <span>로그인</span>
            )}
          </button>

          {/* 회원가입 이동 링크 */}
          <div className="pt-2 text-center">
            <p className="text-[13px] text-white/80">
              계정이 없으신가요?{" "}
              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="text-[#6EA8E8] hover:text-white font-semibold transition-colors hover:underline cursor-pointer ml-1"
              >
                회원가입 하기
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* 하단 카피라이트 */}
      <div className="absolute bottom-5 text-center w-full text-white/50 text-[11px] tracking-wider uppercase font-mono pointer-events-none drop-shadow-sm">
        © 2026 RCK Corporation. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;
