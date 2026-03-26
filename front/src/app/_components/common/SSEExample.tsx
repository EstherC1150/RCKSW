"use client";

import React, { useEffect, useState } from "react";
import sseClient from "../../utils/sseClient";

interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

const SSEExample: React.FC = () => {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("연결 안됨");

  useEffect(() => {
    // SSE 이벤트 리스너 등록
    const handleComponentUpdate = (data: any, timestamp: string) => {
      console.log("컴포넌트 업데이트 이벤트:", data);
      setEvents((prev) => [
        ...prev,
        {
          type: "component_update",
          data,
          timestamp,
        },
      ]);

      // 실시간 알림 표시
      showNotification(
        "컴포넌트 업데이트",
        `${data.file_name} v${data.version}이 업데이트되었습니다.`
      );
    };

    const handleComponentCreate = (data: any, timestamp: string) => {
      console.log("새 컴포넌트 생성 이벤트:", data);
      setEvents((prev) => [
        ...prev,
        {
          type: "component_create",
          data,
          timestamp,
        },
      ]);

      showNotification(
        "새 컴포넌트 생성",
        `${data.file_name} v${data.version}이 생성되었습니다.`
      );
    };

    const handleComponentDelete = (data: any, timestamp: string) => {
      console.log("컴포넌트 삭제 이벤트:", data);
      setEvents((prev) => [
        ...prev,
        {
          type: "component_delete",
          data,
          timestamp,
        },
      ]);

      showNotification(
        "컴포넌트 삭제",
        `컴포넌트 ID ${data.id}가 삭제되었습니다.`
      );
    };

    const handleHeartbeat = (data: any, timestamp: string) => {
      console.log("SSE Heartbeat:", data);
      setConnectionStatus("연결됨");
    };

    const handleConnected = (data: any, timestamp: string) => {
      console.log("SSE 연결됨:", data);
      setConnectionStatus("연결됨");
    };

    // 이벤트 리스너 등록
    sseClient.on("component_update", handleComponentUpdate);
    sseClient.on("component_create", handleComponentCreate);
    sseClient.on("component_delete", handleComponentDelete);
    sseClient.on("heartbeat", handleHeartbeat);
    sseClient.on("connected", handleConnected);

    // 모든 이벤트를 받는 리스너 (디버깅용)
    sseClient.on("*", (data: any, timestamp: string) => {
      console.log(`모든 이벤트 수신: ${data.type}`, data.data);
    });

    // SSE 연결 시작
    sseClient.connect();

    // 컴포넌트 언마운트 시 정리
    return () => {
      sseClient.off("component_update", handleComponentUpdate);
      sseClient.off("component_create", handleComponentCreate);
      sseClient.off("component_delete", handleComponentDelete);
      sseClient.off("heartbeat", handleHeartbeat);
      sseClient.off("connected", handleConnected);
      // GlobalEventCallback 타입에 맞는 함수로 수정
      const globalCallback = (data: any, timestamp: string) => {
        console.log(`모든 이벤트 수신: ${data.type}`, data.data);
      };
      sseClient.off("*", globalCallback);
      sseClient.disconnect();
    };
  }, []);

  // 브라우저 알림 표시
  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (
      "Notification" in window &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  };

  // 알림 권한 요청
  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  // 연결 상태 확인
  const checkConnectionStatus = () => {
    const status = sseClient.getConnectionStatus();
    console.log("연결 상태:", status);
    setConnectionStatus(status.isConnected ? "연결됨" : "연결 안됨");
  };

  // 이벤트 목록 초기화
  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SSE 실시간 이벤트 모니터링</h1>

      {/* 연결 상태 및 컨트롤 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-semibold">연결 상태:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              connectionStatus === "연결됨"
                ? "bg-green-200 text-green-800"
                : "bg-red-200 text-red-800"
            }`}
          >
            {connectionStatus}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={checkConnectionStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            상태 확인
          </button>
          <button
            onClick={requestNotificationPermission}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            알림 권한 요청
          </button>
          <button
            onClick={clearEvents}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            이벤트 목록 초기화
          </button>
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">
            실시간 이벤트 목록 ({events.length})
          </h2>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              아직 수신된 이벤트가 없습니다.
              <br />
              컴포넌트를 생성, 수정, 삭제해보세요!
            </div>
          ) : (
            events
              .slice()
              .reverse()
              .map((event, index) => (
                <div key={index} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        event.type === "component_create"
                          ? "bg-green-100 text-green-800"
                          : event.type === "component_update"
                          ? "bg-blue-100 text-blue-800"
                          : event.type === "component_delete"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-sm">
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">사용법:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 컴포넌트를 생성하면 'component_create' 이벤트가 수신됩니다</li>
          <li>
            • 컴포넌트 버전을 수정하면 'component_update' 이벤트가 수신됩니다
          </li>
          <li>• 컴포넌트를 삭제하면 'component_delete' 이벤트가 수신됩니다</li>
          <li>• 30초마다 'heartbeat' 이벤트로 연결 상태를 확인합니다</li>
        </ul>
      </div>
    </div>
  );
};

export default SSEExample;
