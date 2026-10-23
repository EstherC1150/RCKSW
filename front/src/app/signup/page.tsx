"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { IoCheckmarkCircle } from "react-icons/io5";
import { useAlertStore } from "@/app/stores/alertStore";

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone1: string;
  phone2: string;
  phone3: string;
  department: string;
  position: string;
};

const SignupPage = () => {
  const router = useRouter();
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert } = useAlertStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone1: "",
      phone2: "",
      phone3: "",
      department: "",
      position: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!isEmailVerified) {
      showAlert("아이디 중복확인을 먼저 진행해주세요.", {
        title: "확인 필요",
        type: "warning",
      });
      return;
    }
    const phone = `${data.phone1}-${data.phone2}-${data.phone3}`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
    setIsSubmitting(true);
    fetch(`${apiUrl}/api/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: data.name,
        email: data.email,
        pwd: data.password,
        department: data.department,
        position: data.position,
        phone_number: phone,
      }),
    })
      .then((res) => res.json())
      .then(async (result) => {
        if (result.success) {
          await showAlert("회원가입이 완료되었습니다. 관리자 승인 후 로그인하실 수 있습니다.", {
            title: "가입 완료",
            type: "success",
          });
          router.push("/login");
        } else {
          showAlert("회원가입에 실패했습니다: " + (result.message || "알 수 없는 오류"), {
            title: "가입 실패",
            type: "error",
          });
          setIsSubmitting(false);
        }
      })
      .catch((error) => {
        console.error("회원가입 오류:", error);
        showAlert("회원가입 처리 중 서버 오류가 발생했습니다.", {
          title: "오류 발생",
          type: "error",
        });
        setIsSubmitting(false);
      });
  };

  const handleEmailVerification = async () => {
    const email = watch("email");
    if (!email || !email.trim()) {
      setError("email", { message: "아이디를 입력해주세요." });
      return;
    }
    clearErrors("email");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      const res = await fetch(`${apiUrl}/api/users/checkEmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.exists || !data.available) {
        setError("email", { message: "이미 사용 중인 아이디입니다." });
        setIsEmailVerified(false);
      } else {
        showAlert("사용 가능한 아이디입니다.", { title: "확인 완료", type: "success" });
        setIsEmailVerified(true);
      }
    } catch (error) {
      console.error("아이디 중복 확인 오류:", error);
      showAlert("아이디 중복 확인 중 오류가 발생했습니다.", { title: "오류 발생", type: "error" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F3F7FC] text-slate-800 flex flex-col justify-center items-center p-4 py-8 sm:py-12 relative overflow-hidden select-none">
      {/* 은은하고 편안한 미세 앰비언트 배경 (눈이 피로하지 않은 소프트 블루) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: "radial-gradient(rgba(41, 95, 158, 0.1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, #000 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, #000 60%, transparent 100%)",
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[340px] bg-gradient-to-b from-blue-200/35 via-indigo-100/25 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[380px] h-[380px] bg-sky-100/40 rounded-full blur-[100px] pointer-events-none" />

      {/* 심플하고 단정한 클린 화이트 카드 */}
      <div className="relative z-10 w-full max-w-[480px] bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] transition-all">
        
        {/* 상단 헤더 (뱃지·로고 없이 깔끔하고 담백하게) */}
        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-[23px] font-bold tracking-tight text-slate-900">
            회원가입
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            스마트 컴포넌트 & 라이브러리 계정 신청
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* 사용자명 (이름) */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1 tracking-wide">
              사용자명 (이름) <span className="text-rose-500">*</span>
            </label>
            <input
              className="w-full h-11 px-4 outline-none text-[14px] text-slate-900 placeholder-slate-400 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all shadow-xs"
              type="text"
              placeholder="이름을 입력하세요"
              {...register("name", { required: "이름을 입력해주세요" })}
            />
            {errors.name && <p className="text-rose-500 text-xs pl-1 mt-1">{errors.name.message}</p>}
          </div>

          {/* 아이디 + 중복확인 버튼 */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1 tracking-wide">
              아이디 <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                className="w-full h-11 pl-4 pr-24 outline-none text-[14px] text-slate-900 placeholder-slate-400 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all shadow-xs"
                type="text"
                placeholder="아이디를 입력하세요"
                {...register("email", { required: "아이디를 입력해주세요" })}
                onChange={(e) => {
                  setValue("email", e.target.value);
                  setIsEmailVerified(false);
                  clearErrors("email");
                }}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                {!isEmailVerified ? (
                  <button
                    type="button"
                    className="bg-[#1E5FD8] hover:bg-[#174FB7] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                    onClick={handleEmailVerification}
                  >
                    중복확인
                  </button>
                ) : (
                  <span className="text-emerald-600 text-[12px] font-semibold pr-2 flex items-center gap-1">
                    <IoCheckmarkCircle className="w-4 h-4 text-emerald-500" />
                    <span>사용 가능</span>
                  </span>
                )}
              </div>
            </div>
            {errors.email && <p className="text-rose-500 text-xs pl-1 mt-1">{errors.email.message}</p>}
          </div>

          {/* 비밀번호 & 비밀번호 확인 (2분할 컴팩트) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1 tracking-wide">
                비밀번호 <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full h-11 px-4 outline-none text-[14px] text-slate-900 placeholder-slate-400 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all shadow-xs"
                type="password"
                placeholder="6자 이상"
                {...register("password", {
                  required: "비밀번호 필수",
                  minLength: { value: 6, message: "최소 6자 이상" },
                })}
              />
              {errors.password && <p className="text-rose-500 text-xs pl-1 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1 tracking-wide">
                비밀번호 확인 <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full h-11 px-4 outline-none text-[14px] text-slate-900 placeholder-slate-400 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all shadow-xs"
                type="password"
                placeholder="비밀번호 재입력"
                {...register("confirmPassword", {
                  required: "확인 필수",
                  validate: (value) => value === watch("password") || "비밀번호 불일치",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-rose-500 text-xs pl-1 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* 전화번호 분할 입력 */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1 tracking-wide">
              전화번호 <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 w-full">
              <input
                className="w-[85px] flex-shrink-0 h-11 px-2 outline-none text-[14px] text-slate-900 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all text-center font-medium shadow-xs"
                type="text"
                placeholder="010"
                maxLength={3}
                {...register("phone1", {
                  required: "필수",
                  pattern: { value: /^\d{3}$/, message: "숫자만" },
                })}
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                className="flex-1 min-w-0 h-11 px-2 outline-none text-[14px] text-slate-900 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all text-center font-medium shadow-xs"
                type="text"
                placeholder="0000"
                maxLength={4}
                {...register("phone2", {
                  required: "필수",
                  pattern: { value: /^\d{3,4}$/, message: "숫자만" },
                })}
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                className="flex-1 min-w-0 h-11 px-2 outline-none text-[14px] text-slate-900 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all text-center font-medium shadow-xs"
                type="text"
                placeholder="0000"
                maxLength={4}
                {...register("phone3", {
                  required: "필수",
                  pattern: { value: /^\d{4}$/, message: "숫자만" },
                })}
              />
            </div>
            {(errors.phone1 || errors.phone2 || errors.phone3) && (
              <p className="text-rose-500 text-xs pl-1 mt-1">올바른 전화번호를 입력해주세요</p>
            )}
          </div>

          {/* 부서명 & 직책 2분할 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1 tracking-wide">
                부서명 <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full h-11 px-4 outline-none text-[14px] text-slate-900 placeholder-slate-400 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all shadow-xs"
                type="text"
                placeholder="부서명 입력"
                {...register("department", { required: "부서명을 입력해주세요" })}
              />
              {errors.department && <p className="text-rose-500 text-xs pl-1 mt-1">{errors.department.message}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1 tracking-wide">
                직책 <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full h-11 px-4 outline-none text-[14px] text-slate-900 placeholder-slate-400 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl focus:border-[#1E5FD8] focus:ring-3 focus:ring-[#1E5FD8]/15 transition-all shadow-xs"
                type="text"
                placeholder="직책 입력"
                {...register("position", { required: "직책을 입력해주세요" })}
              />
              {errors.position && <p className="text-rose-500 text-xs pl-1 mt-1">{errors.position.message}</p>}
            </div>
          </div>

          {/* 가입 신청 버튼 (비비드 로열 블루 그라데이션) */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 mt-3 rounded-xl bg-gradient-to-r from-[#1E5FD8] to-[#2874ED] hover:from-[#174FB7] hover:to-[#2062CC] text-white font-bold text-[15px] tracking-wide shadow-md shadow-[#1E5FD8]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>처리 중...</span>
              </>
            ) : (
              <span>회원가입 신청</span>
            )}
          </button>
          
          {/* 로그인 이동 링크 */}
          <div className="pt-2 text-center">
            <p className="text-[13px] text-slate-500">
              이미 계정이 있으신가요?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-[#1E5FD8] hover:text-[#174FB7] font-semibold transition-colors hover:underline cursor-pointer ml-1"
              >
                로그인하기
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* 하단 카피라이트 */}
      <div className="mt-8 text-center w-full text-slate-400 text-[11px] tracking-wider uppercase font-mono pointer-events-none">
        © 2026 RCK Corporation. All rights reserved.
      </div>
    </div>
  );
};

export default SignupPage;
