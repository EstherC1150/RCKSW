import { redirect } from "next/navigation";

export default function Home() {
  // 홈 페이지 접근 시 로그인 페이지로 리다이렉트
  redirect("/login");

  // 아래 코드는 리다이렉트 후에는 실행되지 않습니다
  return (
    <div className="">
      <h1>라이브러리 관리기</h1>
    </div>
  );
}
