import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import { store, type SensorDataPoint } from '../data/store.js';

export type BroadcastType = 'sensor_update' | 'alerts' | 'stats';

export interface BroadcastMessage {
  type: BroadcastType;
  data: unknown;
  timestamp: number;
}

const clients: Set<WebSocket> = new Set();

export function initWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('[WebSocket] New client connected, total clients:', clients.size);

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[WebSocket] Client disconnected, total clients:', clients.size);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Client error:', error);
      clients.delete(ws);
    });

    try {
      ws.send(JSON.stringify({
        type: 'sensor_update',
        data: getLatestSensorData(),
        timestamp: Date.now(),
      }));
      ws.send(JSON.stringify({
        type: 'alerts',
        data: getLatestAlerts(),
        timestamp: Date.now(),
      }));
      ws.send(JSON.stringify({
        type: 'stats',
        data: getDashboardStatsSummary(),
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.error('[WebSocket] Error sending initial data:', err);
    }
  });

  setInterval(() => {
    if (clients.size === 0) return;

    const sensorMsg: BroadcastMessage = {
      type: 'sensor_update',
      data: getLatestSensorData(),
      timestamp: Date.now(),
    };
    broadcast(sensorMsg);

    const alertsMsg: BroadcastMessage = {
      type: 'alerts',
      data: getLatestAlerts(),
      timestamp: Date.now(),
    };
    broadcast(alertsMsg);

    const statsMsg: BroadcastMessage = {
      type: 'stats',
      data: getDashboardStatsSummary(),
      timestamp: Date.now(),
    };
    broadcast(statsMsg);
  }, 5000);

  console.log('[WebSocket] WebSocket server initialized on path: /ws');
  return wss;
}

function broadcast(message: BroadcastMessage): void {
  const payload = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('[WebSocket] Error broadcasting to client:', err);
      }
    }
  });
}

function getLatestSensorData(): unknown {
  const data = store.getData();
  const wells = data.wells;

  return wells.map((well) => {
    const wellSensorData = data.sensorData
      .filter((s) => s.wellId === well.id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    const latest: SensorDataPoint | undefined = wellSensorData[0];

    return {
      wellId: well.id,
      wellCode: well.code,
      wellName: well.name,
      blockId: well.blockId,
      status: well.status,
      latest: latest
        ? {
            timestamp: latest.timestamp,
            pressure: latest.pressure,
            temperature: latest.temperature,
            flowRate: latest.flowRate,
            waterCut: latest.waterCut,
          }
        : {
            timestamp: new Date().toISOString(),
            pressure: well.pressure,
            temperature: well.temperature,
            flowRate: 0,
            waterCut: 0,
          },
      history: wellSensorData.slice(0, 20).map((s) => ({
        timestamp: s.timestamp,
        pressure: s.pressure,
        temperature: s.temperature,
        flowRate: s.flowRate,
        waterCut: s.waterCut,
      })),
    };
  });
}

function getLatestAlerts(): unknown {
  const data = store.getData();

  const activeAlerts = data.safetyAlerts
    .filter((a) => !a.resolved)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 30);

  const escalatedWorkOrders = data.workOrders
    .filter((wo) => wo.escalated || wo.status === 'escalated')
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 20);

  const escalatedRepairOrders = data.repairOrders
    .filter((ro) => ro.escalated || ro.status === 'escalated')
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 20);

  const pendingEscalations = data.drillingProposals
    .filter((dp) => dp.escalated)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 10);

  return {
    safetyAlerts: activeAlerts,
    escalatedWorkOrders: escalatedWorkOrders.map((wo) => ({
      id: wo.id,
      code: wo.code,
      title: wo.title,
      status: wo.status,
      priority: wo.priority,
      escalated: wo.escalated,
      escalatedAt: wo.escalatedAt,
      wellId: wo.wellId,
      blockId: wo.blockId,
      createdAt: wo.createdAt,
    })),
    escalatedRepairOrders: escalatedRepairOrders.map((ro) => ({
      id: ro.id,
      code: ro.code,
      title: ro.title,
      status: ro.status,
      priority: ro.priority,
      escalated: ro.escalated,
      escalatedAt: ro.escalatedAt,
      equipmentId: ro.equipmentId,
      wellId: ro.wellId,
      blockId: ro.blockId,
      createdAt: ro.createdAt,
    })),
    pendingEscalations: pendingEscalations.map((dp) => ({
      id: dp.id,
      code: dp.code,
      title: dp.title,
      status: dp.status,
      escalated: dp.escalated,
      blockId: dp.blockId,
      deadline: dp.deadline,
      createdAt: dp.createdAt,
    })),
  };
}

function getDashboardStatsSummary(): unknown {
  const stats = store.getDashboardStats();
  const data = store.getData();

  return {
    ...stats,
    pendingWorkOrders: data.workOrders.filter((o) => o.status === 'pending').length,
    escalatedWorkOrders: data.workOrders.filter((o) => o.escalated || o.status === 'escalated').length,
    pendingRepairOrders: data.repairOrders.filter((o) => o.status === 'pending').length,
    escalatedRepairOrders: data.repairOrders.filter((o) => o.escalated || o.status === 'escalated').length,
    escalatedProposals: data.drillingProposals.filter((p) => p.escalated).length,
    pendingTransport: data.transportOrders.filter((o) => o.status === 'pending' || o.status === 'loading' || o.status === 'in_transit').length,
    reassignedTransport: data.transportOrders.filter((o) => o.reassigned).length,
  };
}
