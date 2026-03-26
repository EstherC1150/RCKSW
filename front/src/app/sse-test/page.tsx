"use client";

import React from "react";
import SSEExample from "../_components/common/SSEExample";

export default function SSETestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            SSE 실시간 이벤트 테스트
          </h1>
          <p className="text-lg text-gray-600">
            Server-Sent Events를 사용한 실시간 데이터 전송 테스트 페이지
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <SSEExample />
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            테스트 방법
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">1. 연결 확인</h3>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• 페이지 로드 시 "연결됨" 상태 확인</li>
                <li>• 30초마다 heartbeat 이벤트 수신</li>
                <li>• Console에서 SSE 로그 확인</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">
                2. 이벤트 테스트
              </h3>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• 컴포넌트 생성 시 'component_create' 이벤트</li>
                <li>• 컴포넌트 수정 시 'component_update' 이벤트</li>
                <li>• 컴포넌트 삭제 시 'component_delete' 이벤트</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← 로그인 페이지로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
