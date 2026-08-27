"use client"; // 이 파일은 웹 브라우저에서 실행되는 코드입니다.

// 필요한 기능들을 불러옵니다
import { useRouter } from "next/navigation"; // 페이지 이동 기능
import React, { useState, useEffect } from "react"; // 웹 화면 구성과 상태 관리 기능, useEffect 추가
import { IoPerson, IoLockClosed } from "react-icons/io5"; // 사용자 아이콘과 자물쇠 아이콘
import useUserStore, { isJwtExpired } from "@/app/stores/UserStore"; // 사용자 정보 저장소
import Image from "next/image";
import LoadingSpinner from "@/app/_components/common/LoadingSpinner"; // 로딩 스피너 컴포넌트

import { useAlertStore } from "@/app/stores/alertStore";

// 로그인 페이지를 만드는 함수
const LoginPage = () => {
  // 페이지 이동을 위한 기능
  const router = useRouter();
  // 이메일과 비밀번호를 저장할 공간 만들기
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  // 사용자 정보를 저장할 기능
  const { setUser, setTokens } = useUserStore();
  const { showAlert } = useAlertStore();

  // 로그인 상태라면 자동 이동 (24시간 만료 검증 포함)
  useEffect(() => {
    const store = useUserStore.getState();
    const token = store.tokens?.accessToken;
    if (store.user && token && !isJwtExpired(token)) {
      router.replace("/manage"); // 유효한 토큰일 때만 이동
    } else if (token && isJwtExpired(token)) {
      // 24시간 지나 만료된 토큰인 경우 세션 정리
      store.clearAll();
    }
  }, [router]);

  // 로그인 버튼을 눌렀을 때 실행되는 함수
  const handleLogin = () => {
    setIsLoading(true); // 로그인 시작 시 로딩 상태 켜기
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
    // 서버에 로그인 요청 보내기
    fetch(`${apiUrl}/api/users/login`, {
      method: "POST", // 서버에 데이터를 보내는 방식
      headers: {
        "Content-Type": "application/json", // 보내는 데이터 형식
      },
      body: JSON.stringify({ email, pwd: password }), // 이메일과 비밀번호를 서버로 전송
    })
      .then((res) => res.json()) // 서버의 응답을 받아서 처리
      .then((data) => {
        // 로그인 성공했을 때
        if (data.success) {
          // 사용자 정보 저장
          setUser(data.data.user);
          // 로그인 토큰 저장 (나중에 사용자 인증에 사용)
          setTokens({
            accessToken: data.data.token,
            refreshToken: data.data.refreshToken,
          });
          // 관리 페이지로 이동 (로딩 화면 계속 유지되도록 setIsLoading(false) 생략 가능, 이동 후 언마운트됨)
          router.push("/manage");
        }
        // 로그인 실패했을 때
        else {
          showAlert(data.message || "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.", {
            title: "로그인 실패",
            type: "error",
          });
          setIsLoading(false); // 실패 시 로딩 꺼줌
        }
      })
      .catch((error) => {
        // 오류가 발생했을 때
        console.error("로그인 오류:", error);
        showAlert("서버 연결에 실패했습니다. 백엔드 서버 상태를 확인해주세요.", {
          title: "오류 발생",
          type: "error",
        });
        setIsLoading(false); // 에러 시 로딩 꺼줌
      });
  };

  // 엔터키를 눌렀을 때 로그인 시도하는 함수
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  // 화면에 보여질 내용
  return (
    // 전체 화면을 감싸는 컨테이너
    <div className="flex justify-center items-center h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e3a8a] via-[#0b1121] to-[#050810] text-foreground relative overflow-hidden">
      
      {/* 백그라운드 빛번짐 데코레이션 효과 */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md">
          <LoadingSpinner />
        </div>
      )}
      
      {/* 글래스모피즘 로그인 카드 */}
      <div className="glass relative z-10 flex flex-col items-center w-full max-w-[460px] p-[50px] m-4">
        
        {/* 로고 이미지 */}
        <div className="flex justify-center w-full max-w-[220px] mb-0">
          <Image 
            src="/images/RCK Logo-en-Horizontal-Reverse.png" 
            alt="RCK Logo" 
            width={100} 
            height={24} 
            className="object-contain"
            priority
          />
        </div>
        
        {/* 부제목 */}
        <h1 className="text-[32px] font-bold tracking-tight mb-2 text-white">RCK SW 관리기</h1>
        
        {/* 안내 문구 */}
        <p className="text-[14px] font-medium mb-8 whitespace-pre-line text-center text-muted leading-relaxed">
          {"서비스 이용을 위해 로그인을 진행해주세요."}
        </p>
        
        {/* 로그인 입력 폼 영역 */}
        <div className="w-full flex flex-col gap-5">
          {/* 이메일 입력창 */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors">
              <IoPerson size={18} />
            </div>
            <input
              className="w-full h-[54px] text-white pl-[45px] pr-[20px] outline-none text-[15px]
              bg-white/5 border border-white/10 placeholder-transparent rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner peer"
              type="text"
              id="email"
              placeholder="아이디"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <label htmlFor="email" className="absolute left-[45px] -top-[9px] bg-[#0E1528] px-1 text-[12px] text-primary transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-muted peer-placeholder-shown:top-[16px] peer-placeholder-shown:bg-transparent peer-focus:-top-[9px] peer-focus:text-[12px] peer-focus:text-primary peer-focus:bg-[#0E1528] rounded-md pointer-events-none">
              아이디
            </label>
          </div>
          
          {/* 비밀번호 입력창 */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors">
              <IoLockClosed size={18} />
            </div>
            <input
              className="w-full h-[54px] text-white pl-[45px] pr-[20px] outline-none text-[15px]
              bg-white/5 border border-white/10 placeholder-transparent rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner peer"
              type="password"
              id="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <label htmlFor="password" className="absolute left-[45px] -top-[9px] bg-[#0E1528] px-1 text-[12px] text-primary transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-muted peer-placeholder-shown:top-[16px] peer-placeholder-shown:bg-transparent peer-focus:-top-[9px] peer-focus:text-[12px] peer-focus:text-primary peer-focus:bg-[#0E1528] rounded-md pointer-events-none">
              비밀번호
            </label>
          </div>
          
          {/* 로그인 버튼 */}
          <button
            className="w-full bg-gradient-to-r from-blue-600 to-primary text-white font-bold py-3 px-6 
            h-[54px] rounded-xl hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#0b1121] transition-all duration-300 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] mt-2"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "로딩 중..." : "로그인"}
          </button>
          
          {/* 회원가입 링크 */}
          <div className="mt-4 text-center">
            <p className="text-[14px] text-muted">예비 회원이신가요? <span 
              className="text-white font-semibold cursor-pointer hover:text-primary hover:underline transition-colors ml-1"
              onClick={() => router.push("/signup")}
            >회원가입 하기</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 이 페이지를 다른 곳에서 사용할 수 있도록 내보내기
export default LoginPage;
