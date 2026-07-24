// SSE 기능 비활성화됨 (사용되지 않음)
const setupSSE = (req, res) => {
  res.status(410).json({ message: "SSE endpoint is disabled." });
};

const sendEventToAll = () => {};
const sendComponentUpdate = () => {};
const sendComponentDelete = () => {};
const sendComponentCreate = () => {};
const sendCategoryUpdate = () => {};
const sendUserUpdate = () => {};
const getConnectedClientsCount = () => 0;
const getConnectedClients = () => [];

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
