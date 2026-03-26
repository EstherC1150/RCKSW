const mysql = require("../mysql");

// SSE 클라이언트 연결들을 저장할 Map
const clients = new Map();

// SSE 연결 설정
const setupSSE = (req, res) => {
  // SSE 헤더 설정
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // 클라이언트 ID 생성
  const clientId = Date.now() + Math.random();

  // 클라이언트 정보 저장
  clients.set(clientId, {
    res: res,
    timestamp: Date.now(),
  });

  console.log(`SSE 클라이언트 연결됨: ${clientId}`);

  // 연결 유지를 위한 heartbeat
  const heartbeat = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({
        type: "heartbeat",
        timestamp: Date.now(),
      })}\n\n`
    );
  }, 30000); // 30초마다

  // 클라이언트 연결 해제 시 정리
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
    console.log(`SSE 클라이언트 연결 해제됨: ${clientId}`);
  });

  // 초기 연결 메시지 전송
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      clientId,
      timestamp: Date.now(),
    })}\n\n`
  );
};

// 모든 연결된 클라이언트에게 이벤트 전송
const sendEventToAll = (eventType, data) => {
  const message = JSON.stringify({
    type: eventType,
    data: data,
    timestamp: Date.now(),
  });

  clients.forEach((client, clientId) => {
    try {
      client.res.write(`data: ${message}\n\n`);
    } catch (error) {
      console.error(`클라이언트 ${clientId}에게 메시지 전송 실패:`, error);
      clients.delete(clientId);
    }
  });

  console.log(`SSE 이벤트 전송: ${eventType} - ${clients.size}개 클라이언트`);
};

// 특정 이벤트 타입별 전송 함수들
const sendComponentUpdate = (componentData) => {
  sendEventToAll("component_update", componentData);
};

const sendComponentDelete = (componentId) => {
  sendEventToAll("component_delete", { id: componentId });
};

const sendComponentCreate = (componentData) => {
  sendEventToAll("component_create", componentData);
};

const sendCategoryUpdate = (categoryData) => {
  sendEventToAll("category_update", categoryData);
};

const sendUserUpdate = (userData) => {
  sendEventToAll("user_update", userData);
};

// 연결된 클라이언트 수 반환
const getConnectedClientsCount = () => {
  return clients.size;
};

// 연결된 클라이언트 목록 반환 (디버깅용)
const getConnectedClients = () => {
  return Array.from(clients.keys()).map((clientId) => ({
    clientId,
    timestamp: clients.get(clientId).timestamp,
  }));
};

module.exports = {
  setupSSE,
  sendEventToAll,
  sendComponentUpdate,
  sendComponentDelete,
  sendComponentCreate,
  sendCategoryUpdate,
  sendUserUpdate,
  getConnectedClientsCount,
  getConnectedClients,
};
