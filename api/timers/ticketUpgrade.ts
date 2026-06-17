import { store } from '../data/store.js';
import type { WorkOrder, RepairOrder, TransportOrder } from '../../shared/types.js';

const WORKORDER_ESCALATION_MS = 15 * 60 * 1000;
const REPAIRORDER_ESCALATION_MS = 2 * 60 * 60 * 1000;
const TRANSPORTORDER_REASSIGN_MS = 2 * 60 * 60 * 1000;

export function startTicketUpgradeTimer(): NodeJS.Timeout {
  console.log('[TicketUpgradeTimer] Starting ticket upgrade timer (every 10s)');

  return setInterval(() => {
    const data = store.getData();
    const now = Date.now();
    let workOrderEscalated = 0;
    let repairOrderEscalated = 0;
    let transportReassigned = 0;

    data.workOrders.forEach((order, index) => {
      if (order.status === 'pending' && !order.escalated) {
        const createdAt = new Date(order.createdAt).getTime();
        if (now - createdAt > WORKORDER_ESCALATION_MS) {
          data.workOrders[index] = {
            ...order,
            status: 'escalated' as WorkOrder['status'],
            escalated: true,
            escalatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: order.notes
              ? order.notes + '\n[系统] 工单超过15分钟未处理，已自动升级'
              : '[系统] 工单超过15分钟未处理，已自动升级',
          };
          workOrderEscalated++;
          console.log(
            `[TicketUpgradeTimer] Work order ${order.code} escalated: ` +
              `pending for >15min`
          );
        }
      }
    });

    data.repairOrders.forEach((order, index) => {
      if (order.status === 'pending' && !order.escalated) {
        const createdAt = new Date(order.createdAt).getTime();
        if (now - createdAt > REPAIRORDER_ESCALATION_MS) {
          data.repairOrders[index] = {
            ...order,
            status: 'escalated' as RepairOrder['status'],
            escalated: true,
            escalatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: order.notes
              ? order.notes + '\n[系统] 报修单超过2小时未处理，已自动升级'
              : '[系统] 报修单超过2小时未处理，已自动升级',
          };
          repairOrderEscalated++;
          console.log(
            `[TicketUpgradeTimer] Repair order ${order.code} escalated: ` +
              `pending for >2h`
          );
        }
      }
    });

    data.transportOrders.forEach((order, index) => {
      if (
        (order.status === 'pending' ||
          order.status === 'loading' ||
          order.status === 'in_transit') &&
        !order.reassigned
      ) {
        const createdAt = new Date(order.createdAt).getTime();
        if (now - createdAt > TRANSPORTORDER_REASSIGN_MS) {
          const idleTrucks = data.trucks.filter(
            (t) => t.status === 'idle' && t.blockId === order.sourceBlockId
          );
          if (idleTrucks.length > 0) {
            const newTruck = idleTrucks[Math.floor(Math.random() * idleTrucks.length)];
            const availableDrivers = data.users.filter(
              (u) =>
                u.role === 'oil_worker' ||
                u.role === 'team_leader'
            );
            const newDriver =
              availableDrivers[Math.floor(Math.random() * availableDrivers.length)];

            data.transportOrders[index] = {
              ...order,
              status: 'reassigned' as TransportOrder['status'],
              reassigned: true,
              reassignedAt: new Date().toISOString(),
              truckId: newTruck.id,
              driverId: newDriver?.id || order.driverId,
              updatedAt: new Date().toISOString(),
              notes: order.notes
                ? order.notes +
                  `\n[系统] 运输单超过2小时未完成，已转派车辆 ${newTruck.code}`
                : `[系统] 运输单超过2小时未完成，已转派车辆 ${newTruck.code}`,
            };
            transportReassigned++;
            console.log(
              `[TicketUpgradeTimer] Transport order ${order.code} reassigned: ` +
                `reassigned to truck ${newTruck.code}`
            );
          }
        }
      }
    });

    if (workOrderEscalated > 0 || repairOrderEscalated > 0 || transportReassigned > 0) {
      console.log(
        `[TicketUpgradeTimer] Cycle summary: ` +
          `${workOrderEscalated} work orders escalated, ` +
          `${repairOrderEscalated} repair orders escalated, ` +
          `${transportReassigned} transport orders reassigned`
      );
    }
  }, 10000);
}
