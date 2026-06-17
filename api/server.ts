import http from 'http';
import app from './app.js';
import { store } from './data/store.js';
import { startSensorTimer } from './timers/sensorUpdate.js';
import { startApprovalEscalationTimer } from './timers/approvalEscalation.js';
import { startTicketUpgradeTimer } from './timers/ticketUpgrade.js';
import { initWebSocketServer } from './ws/realtime.js';

const PORT = process.env.PORT || 3001;

if (!store.getData().initialized) {
  store.initMockData();
  console.log('[Server] Mock data initialized');
}

const server = http.createServer(app);

initWebSocketServer(server);

const sensorTimer = startSensorTimer();
const approvalTimer = startApprovalEscalationTimer();
const ticketTimer = startTicketUpgradeTimer();

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`HTTP API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

function gracefulShutdown(signal: string): void {
  console.log(`${signal} signal received`);

  clearInterval(sensorTimer);
  clearInterval(approvalTimer);
  clearInterval(ticketTimer);
  console.log('[Server] All timers stopped');

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
