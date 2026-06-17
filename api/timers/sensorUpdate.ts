import { store, type SensorDataPoint } from '../data/store.js';
import type { WorkOrder, AlertLevel, SafetyAlert } from '../../shared/types.js';

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

    const safetySensors = data.safetySensors;
    const recentThresholdMs = 60000;

    safetySensors.forEach((sensor) => {
      if (sensor.status !== 'online') return;

      const isOver = sensor.currentValue > sensor.thresholdMax || sensor.currentValue < sensor.thresholdMin;
      if (!isOver) return;

      const recentAlert = data.safetyAlerts.find(
        (a) => a.sensorId === sensor.id && !a.resolved &&
          (Date.now() - new Date(a.createdAt).getTime()) < recentThresholdMs
      );
      if (recentAlert) return;

      const overPct = sensor.currentValue > sensor.thresholdMax
        ? Math.round(((sensor.currentValue - sensor.thresholdMax) / Math.max(sensor.thresholdMax, 1)) * 100)
        : sensor.thresholdMin > 0
        ? Math.round(((sensor.thresholdMin - sensor.currentValue) / sensor.thresholdMin) * 100)
        : 50;

      let level: AlertLevel = 'warning';
      let title = '';
      let description = '';

      switch (sensor.type) {
        case 'gas':
          if (overPct >= 50) {
            level = 'danger';
            title = '可燃气体浓度严重超标';
            description = `${sensor.name}检测到可燃气体浓度${sensor.currentValue}${sensor.unit}，超过阈值${sensor.thresholdMax}${sensor.unit}达${overPct}%，可能存在泄漏风险，请立即启动应急预案。`;
          } else {
            level = 'warning';
            title = '可燃气体浓度超标预警';
            description = `${sensor.name}检测到可燃气体浓度${sensor.currentValue}${sensor.unit}，超过阈值${sensor.thresholdMax}${sensor.unit}，请现场巡检确认。`;
          }
          break;
        case 'pressure':
          if (overPct >= 40) {
            level = 'danger';
            title = '压力严重超标紧急告警';
            description = `${sensor.name}压力${sensor.currentValue}${sensor.unit}，超过安全阈值，存在管线爆裂风险，请紧急关断相关阀门。`;
          } else {
            level = 'warning';
            title = '压力超标预警';
            description = `${sensor.name}压力${sensor.currentValue}${sensor.unit}，超出正常范围${sensor.thresholdMin}-${sensor.thresholdMax}${sensor.unit}，请检查。`;
          }
          break;
        case 'temperature':
          if (overPct >= 30) {
            level = 'danger';
            title = '温度严重超标告警';
            description = `${sensor.name}温度${sensor.currentValue}${sensor.unit}，超过安全阈值，设备可能过热，请停机检查。`;
          } else {
            level = 'warning';
            title = '温度超标预警';
            description = `${sensor.name}温度${sensor.currentValue}${sensor.unit}，略高于正常范围，请关注冷却系统。`;
          }
          break;
        case 'fire':
          level = 'critical';
          title = '火焰探测确认告警';
          description = `${sensor.name}检测到红外火焰信号，可能存在火灾，立即启动消防应急预案，启动喷淋系统。`;
          break;
        case 'smoke':
          level = overPct >= 50 ? 'danger' : 'warning';
          title = level === 'danger' ? '烟雾浓度严重超标' : '烟雾浓度超标预警';
          description = `${sensor.name}烟雾浓度${sensor.currentValue}${sensor.unit}，可能存在阴燃或电气过热，请现场核实。`;
          break;
        case 'vibration':
          level = overPct >= 50 ? 'danger' : 'warning';
          title = level === 'danger' ? '振动值严重超标' : '振动异常预警';
          description = `${sensor.name}振动值${sensor.currentValue}${sensor.unit}，设备可能存在不平衡或不对中，请安排检修。`;
          break;
        default:
          title = '传感器数据异常';
          description = `${sensor.name}当前值${sensor.currentValue}${sensor.unit}超出阈值范围。`;
      }

      const alert = store.createSafetyAlert({
        title,
        description,
        level,
        sensorId: sensor.id,
        wellId: sensor.wellId,
        blockId: sensor.blockId,
      });

      if (level === 'danger' || level === 'critical') {
        const valveEquipment = data.equipment.find(
          (e) => e.category === 'valve' &&
            ((sensor.wellId && e.wellId === sensor.wellId) ||
             (e.blockId === sensor.blockId))
        );
        if (valveEquipment) {
          valveEquipment.status = 'maintenance';
          store.updateSafetyAlert(alert.id, {
            resolution: `系统已自动关断相关阀门(${valveEquipment.name})，请现场确认并处置。`,
          });
          console.log(
            `[SensorTimer] Safety sensor ${sensor.code} exceeded threshold (level=${level}), ` +
              `auto-shutdown valve ${valveEquipment.code}, created alert ${alert.code}`
          );
        } else {
          console.log(
            `[SensorTimer] Safety sensor ${sensor.code} exceeded threshold (level=${level}), ` +
              `no valve found to auto-shutdown, created alert ${alert.code}`
          );
        }
      } else {
        console.log(
          `[SensorTimer] Safety sensor ${sensor.code} warning (level=${level}), created alert ${alert.code}`
        );
      }
    });
  }, 5000);
}
