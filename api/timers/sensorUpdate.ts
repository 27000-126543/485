import { store, type SensorDataPoint } from '../data/store.js';
import type { WorkOrder } from '../../shared/types.js';

const BASE_PRESSURE = 12;
const MIN_PRESSURE = 0.5;
const MAX_PRESSURE = 25;
const PRESSURE_LOW_THRESHOLD = 0.8;
const PRESSURE_HIGH_THRESHOLD = 22;

const BASE_TEMPERATURE = 50;
const MIN_TEMPERATURE = 20;
const MAX_TEMPERATURE = 95;
const TEMPERATURE_HIGH_THRESHOLD = 85;

const MAX_SENSOR_DATA_PER_WELL = 100;
const ANOMALY_PROBABILITY = 0.02;

function normalRandom(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + stdDev * num;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function startSensorTimer(): NodeJS.Timeout {
  console.log('[SensorTimer] Starting sensor update timer (every 5s)');

  return setInterval(() => {
    const data = store.getData();
    const wells = data.wells;
    const now = new Date();

    wells.forEach((well) => {
      let pressure = normalRandom(BASE_PRESSURE, 2);
      let temperature = normalRandom(BASE_TEMPERATURE, 8);

      if (Math.random() < ANOMALY_PROBABILITY) {
        const anomalyType = Math.random();
        if (anomalyType < 0.35) {
          pressure = normalRandom(0.3, 0.3);
        } else if (anomalyType < 0.7) {
          pressure = normalRandom(24, 1.5);
        } else {
          temperature = normalRandom(92, 3);
        }
      }

      pressure = clamp(Math.round(pressure * 100) / 100, MIN_PRESSURE, MAX_PRESSURE);
      temperature = clamp(Math.round(temperature * 100) / 100, MIN_TEMPERATURE, MAX_TEMPERATURE);

      const flowRate = Math.round((well.dailyProduction / 24) * (0.9 + Math.random() * 0.2) * 100) / 100;
      const waterCut = Math.round((10 + Math.random() * 15) * 100) / 100;

      const sensorPoint: SensorDataPoint = {
        id: generateId(),
        wellId: well.id,
        timestamp: now.toISOString(),
        pressure,
        temperature,
        flowRate,
        waterCut,
      };

      data.sensorData.push(sensorPoint);

      const wellSensorData = data.sensorData.filter((s) => s.wellId === well.id);
      if (wellSensorData.length > MAX_SENSOR_DATA_PER_WELL) {
        const toRemove = wellSensorData.length - MAX_SENSOR_DATA_PER_WELL;
        const sorted = wellSensorData.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        for (let i = 0; i < toRemove; i++) {
          const idx = data.sensorData.findIndex((s) => s.id === sorted[i].id);
          if (idx >= 0) data.sensorData.splice(idx, 1);
        }
      }

      const pressureAnomaly = pressure < PRESSURE_LOW_THRESHOLD || pressure > PRESSURE_HIGH_THRESHOLD;
      const temperatureAnomaly = temperature > TEMPERATURE_HIGH_THRESHOLD;

      if (pressureAnomaly || temperatureAnomaly) {
        let alertType = '';
        let alertDesc = '';
        let priority: WorkOrder['priority'] = 'high';

        if (pressure < PRESSURE_LOW_THRESHOLD) {
          alertType = '油压过低告警';
          alertDesc = `井口 ${well.code} 油压 ${pressure}MPa 低于安全阈值 ${PRESSURE_LOW_THRESHOLD}MPa，请立即检查`;
          priority = 'urgent';
        } else if (pressure > PRESSURE_HIGH_THRESHOLD) {
          alertType = '油压过高告警';
          alertDesc = `井口 ${well.code} 油压 ${pressure}MPa 超过安全阈值 ${PRESSURE_HIGH_THRESHOLD}MPa，请立即检查`;
          priority = 'urgent';
        } else if (temperature > TEMPERATURE_HIGH_THRESHOLD) {
          alertType = '温度过高告警';
          alertDesc = `井口 ${well.code} 温度 ${temperature}℃ 超过安全阈值 ${TEMPERATURE_HIGH_THRESHOLD}℃，请检查冷却系统`;
          priority = 'high';
        }

        const teams = data.teams.filter((t) => t.blockId === well.blockId);
        const team = teams.length > 0 ? teams[0] : data.teams[0];
        const users = data.users.filter(
          (u) => u.role === 'team_leader' || u.role === 'oil_worker'
        );
        const assignee = users.length > 0 ? users[Math.floor(Math.random() * users.length)] : data.users[0];
        const assigner = data.users.find((u) => u.role === 'hq_admin') || data.users[0];

        const nextWoNum = data.workOrders.length + 1;
        const dueDate = new Date(now.getTime() + 4 * 60 * 60 * 1000);

        const workOrder: WorkOrder = {
          id: generateId(),
          code: `WO-${String(nextWoNum).padStart(4, '0')}`,
          title: `${well.name} - ${alertType}`,
          description: alertDesc,
          type: 'maintenance',
          status: 'pending',
          priority,
          wellId: well.id,
          blockId: well.blockId,
          teamId: team?.id || '',
          assigneeId: assignee.id,
          assignerId: assigner.id,
          startDate: now.toISOString(),
          dueDate: dueDate.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        data.workOrders.push(workOrder);
        console.log(
          `[SensorTimer] Anomaly detected for well ${well.code}: ` +
            `${alertType}, created work order ${workOrder.code}`
        );
      }
    });
  }, 5000);
}
