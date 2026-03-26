interface SSEEventData {
  type: string;
  data: any;
  timestamp: string;
}

interface SSEConnectionStatus {
  isConnected: boolean;
  reconnectAttempts: number;
}

type EventCallback = (data: any, timestamp: string) => void;
type GlobalEventCallback = (type: string, data: any, timestamp: string) => void;

class SSEClient {
  private eventSource: EventSource | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 1000; // 1초
  private listeners: Map<string, EventCallback[]> = new Map();

  // SSE 연결 시작
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = new EventSource(
        "http://localhost:8081/api/sse/connect"
      );

      this.eventSource.onopen = () => {
        console.log("SSE 연결됨");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event: MessageEvent) => {
        try {
          const data: SSEEventData = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (error) {
          console.error("SSE 메시지 파싱 실패:", error);
        }
      };

      this.eventSource.onerror = (error: Event) => {
        console.error("SSE 연결 오류:", error);
        this.isConnected = false;
        this.handleReconnect();
      };

      this.eventSource.addEventListener("error", (event: Event) => {
        console.error("SSE 이벤트 오류:", event);
      });
    } catch (error) {
      console.error("SSE 연결 실패:", error);
      this.handleReconnect();
    }
  }

  // 재연결 처리
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `SSE 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("SSE 최대 재연결 시도 횟수 초과");
    }
  }

  // 이벤트 핸들러 등록
  on(eventType: string, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  // 이벤트 핸들러 제거
  off(eventType: string, callback: EventCallback): void {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 이벤트 처리
  private handleEvent(data: SSEEventData): void {
    const { type, data: eventData, timestamp } = data;

    console.log("SSE 이벤트 수신:", { type, eventData, timestamp });

    // 등록된 리스너들에게 이벤트 전달
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.forEach((callback: EventCallback) => {
        try {
          callback(eventData, timestamp);
        } catch (error) {
          console.error(`SSE 이벤트 핸들러 오류 (${type}):`, error);
        }
      });
    }

    // 모든 이벤트를 받는 리스너
    if (this.listeners.has("*")) {
      this.listeners.get("*")!.forEach((callback: EventCallback) => {
        try {
          // GlobalEventCallback은 EventCallback과 호환되도록 data에 전체 정보를 포함
          callback({ type, data: eventData, timestamp }, timestamp);
        } catch (error) {
          console.error("SSE 전체 이벤트 핸들러 오류:", error);
        }
      });
    }
  }

  // 연결 해제
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      console.log("SSE 연결 해제됨");
    }
  }

  // 연결 상태 확인
  getConnectionStatus(): SSEConnectionStatus {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// 싱글톤 인스턴스 생성
const sseClient = new SSEClient();

export default sseClient;
