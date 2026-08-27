"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import {
  IoPerson,
  IoLockClosed,
  IoMail,
  IoPhonePortrait,
  IoBriefcase,
} from "react-icons/io5";

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

import { useAlertStore } from "@/app/stores/alertStore";

const SignupPage = () => {
  const router = useRouter();
  const [isEmailVerified, setIsEmailVerified] = React.useState(false);
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
      .then(async (data) => {
        console.log(data);
        if (data.success) {
          await showAlert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.", {
            title: "가입 완료",
            type: "success",
          });
          router.push("/login");
        } else {
          showAlert("회원가입에 실패했습니다: " + (data.message || "알 수 없는 오류"), {
            title: "가입 실패",
            type: "error",
          });
        }
      })
      .catch((error) => {
        console.error("회원가입 오류:", error);
        showAlert("회원가입 처리 중 서버 오류가 발생했습니다.", {
          title: "오류 발생",
          type: "error",
        });
      });
  };

  const handleEmailVerification = async () => {
    const email = watch("email");
    if (!email) {
      setError("email", { message: "아이디를 입력해주세요." });
      return;
    }
    clearErrors("email");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8180";
      const res = await fetch(
        `${apiUrl}/api/users/checkEmail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );
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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">회원가입</h1>
          <p className="text-muted text-[14px]">스마트 컴포넌트 라이브러리 계정 생성</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <IoPerson className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
            <input
              className="w-full h-[52px] text-white pl-[45px] pr-[20px] outline-none text-[15px]
              bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              type="text"
              placeholder="이름"
              {...register("name", { required: "이름을 입력해주세요" })}
            />
          </div>
          {errors.name && <p className="text-red-400 text-xs pl-2">{errors.name.message}</p>}

          <div className="relative">
            <IoPerson className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
            <input
              className="w-full h-[52px] text-white pl-[45px] pr-[100px] outline-none text-[15px]
              bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              type="text"
              placeholder="아이디"
              {...register("email", { required: "아이디를 입력해주세요" })}
              onChange={(e) => { setValue("email", e.target.value); setIsEmailVerified(false); clearErrors("email"); }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {!isEmailVerified ? (
                <button
                  type="button"
                  className="bg-primary text-white text-[13px] px-3 py-1.5 rounded-lg hover:bg-primary-hover transition-colors"
                  onClick={handleEmailVerification}
                >
                  중복확인
                </button>
              ) : (
                <span className="text-green-400 text-[13px] font-medium pr-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>확인됨
                </span>
              )}
            </div>
          </div>
          {errors.email && <p className="text-red-400 text-xs pl-2">{errors.email.message}</p>}

          <div className="relative">
            <IoLockClosed className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
            <input
              className="w-full h-[52px] text-white pl-[45px] pr-[20px] outline-none text-[15px]
              bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              type="password"
              placeholder="비밀번호"
              {...register("password", { required: "비밀번호를 입력해주세요", minLength: { value: 6, message: "최소 6자 이상이어야 합니다" } })}
            />
          </div>
          {errors.password && <p className="text-red-400 text-xs pl-2">{errors.password.message}</p>}

          <div className="relative">
            <IoLockClosed className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
            <input
              className="w-full h-[52px] text-white pl-[45px] pr-[20px] outline-none text-[15px]
              bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              type="password"
              placeholder="비밀번호 확인"
              {...register("confirmPassword", { required: "비밀번호 확인을 입력해주세요", validate: (value) => value === watch("password") || "비밀번호가 일치하지 않습니다" })}
            />
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-xs pl-2">{errors.confirmPassword.message}</p>}

          {/* 전화번호 3칸 분할 입력 (너비 비율 및 패딩 완벽 보정) */}
          <div>
            <div className="flex items-center gap-2 w-full">
              {/* 첫 번째 칸 (010): 아이콘 포함, 고정 105px */}
              <div className="relative w-[105px] flex-shrink-0">
                <IoPhonePortrait className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
                <input
                  className="w-full h-[52px] text-white pl-[38px] pr-[8px] outline-none text-[15px] bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-center font-medium"
                  type="text"
                  placeholder="010"
                  maxLength={3}
                  {...register("phone1", {
                    required: "필수",
                    pattern: { value: /^\d{3}$/, message: "숫자만" },
                  })}
                />
              </div>
              <span className="text-muted font-bold text-lg flex-shrink-0">-</span>
              {/* 두 번째 칸 (중간 4자리): flex-1 */}
              <input
                className="flex-1 min-w-0 h-[52px] text-white px-2 outline-none text-[15px] bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-center font-medium"
                type="text"
                placeholder="0000"
                maxLength={4}
                {...register("phone2", {
                  required: "필수",
                  pattern: { value: /^\d{3,4}$/, message: "숫자만" },
                })}
              />
              <span className="text-muted font-bold text-lg flex-shrink-0">-</span>
              {/* 세 번째 칸 (끝 4자리): flex-1 */}
              <input
                className="flex-1 min-w-0 h-[52px] text-white px-2 outline-none text-[15px] bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-center font-medium"
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
              <p className="text-red-400 text-xs pl-2 mt-1">정확한 전화번호 11자리를 입력해주세요</p>
            )}
          </div>

          <div className="relative">
            <IoBriefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
            <input
              className="w-full h-[52px] text-white pl-[45px] pr-[20px] outline-none text-[15px]
              bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              type="text"
              placeholder="부서명"
              {...register("department", { required: "부서명을 입력해주세요" })}
            />
          </div>
          {errors.department && <p className="text-red-400 text-xs pl-2">{errors.department.message}</p>}

          <div className="relative">
            <IoPerson className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
            <input
              className="w-full h-[52px] text-white pl-[45px] pr-[20px] outline-none text-[15px]
              bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              type="text"
              placeholder="직책"
              {...register("position", { required: "직책을 입력해주세요" })}
            />
          </div>
          {errors.position && <p className="text-red-400 text-xs pl-2">{errors.position.message}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3 px-6 
            h-[52px] rounded-xl hover:bg-primary-hover transition-colors duration-200 mt-2"
          >
            회원가입
          </button>
          
          <div className="mt-2 text-center">
            <p className="text-[14px] text-muted cursor-pointer hover:text-primary transition-colors" onClick={() => router.push("/login")}>
              이미 계정이 있으신가요? 로그인하기
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
