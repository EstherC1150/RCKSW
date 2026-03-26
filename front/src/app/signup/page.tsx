"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import {
  IoPerson,
  IoLockClosed,
  IoMail,
  IoPhonePortrait,
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isEmailVerified, setIsEmailVerified] = React.useState(false);

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
      alert("이메일 중복확인을 해주세요.");
      return;
    }
    const phone = `${data.phone1}-${data.phone2}-${data.phone3}`;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/signup`, {
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
      .then((data) => {
        console.log(data);
        if (data.success) {
          alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
          router.push("/login");
        } else {
          alert(
            "회원가입에 실패했습니다: " + (data.message || "알 수 없는 오류")
          );
        }
      })
      .catch((error) => {
        console.error("회원가입 오류:", error);
        alert("회원가입 중 오류가 발생했습니다.");
      });
  };

  const handleEmailVerification = async () => {
    const email = watch("email");
    if (!email) {
      setError("email", { message: "이메일을 입력해주세요." });
      return;
    }
    clearErrors("email");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/checkEmail`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (data.success && data.available) {
        setIsEmailVerified(true);
      } else {
        setIsEmailVerified(false);
        setError("email", { message: "이미 존재하는 이메일입니다." });
      }
    } catch {
      setIsEmailVerified(false);
      setError("email", { message: "이메일 확인 중 오류가 발생했습니다." });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-background text-foreground py-12 px-4">
      <div className="flex flex-col items-center w-full max-w-[480px] bg-card p-6 sm:p-10 rounded-2xl border border-border shadow-lg">
        <h1 className="text-[32px] font-bold tracking-tight mb-2 text-white">회원가입</h1>
        <p className="text-[14px] font-medium mb-8 text-center text-muted">
          회원가입을 위해 아래 정보를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
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
            <IoMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
            <input
              className="w-full h-[52px] text-white pl-[45px] pr-[100px] outline-none text-[15px]
              bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              type="email"
              placeholder="이메일"
              {...register("email", { required: "이메일을 입력해주세요", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "유효한 이메일 주소를 입력해주세요" } })}
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

          <div className="flex gap-2">
            <div className="relative flex-1">
              <IoPhonePortrait className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
              <input
                className="w-full h-[52px] text-white pl-[36px] pr-[10px] outline-none text-[15px] bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-center"
                type="text" placeholder="010" maxLength={3}
                {...register("phone1", { required: "필수", pattern: { value: /^\d{3}$/, message: "숫자만" } })}
              />
            </div>
            <span className="self-center text-muted">-</span>
            <input
              className="flex-[1.2] h-[52px] text-white outline-none text-[15px] bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-center"
              type="text" placeholder="0000" maxLength={4}
              {...register("phone2", { required: "필수", pattern: { value: /^\d{3,4}$/, message: "숫자만" } })}
            />
            <span className="self-center text-muted">-</span>
            <input
              className="flex-[1.2] h-[52px] text-white outline-none text-[15px] bg-input border border-input-border placeholder-muted rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-center"
              type="text" placeholder="0000" maxLength={4}
              {...register("phone3", { required: "필수", pattern: { value: /^\d{4}$/, message: "숫자만" } })}
            />
          </div>
          {(errors.phone1 || errors.phone2 || errors.phone3) && <p className="text-red-400 text-xs pl-2">정확한 전화번호를 입력해주세요</p>}

          <div className="relative">
            <IoMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" size={18} />
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
