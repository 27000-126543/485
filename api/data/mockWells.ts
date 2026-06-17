import type { User, Block, Team, WellData } from '../../shared/types.js';

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const blockNames = [
  { code: 'block-1', name: '东胜油田区块', location: '内蒙古鄂尔多斯盆地', area: 125.6 },
  { code: 'block-2', name: '西北采油区块', location: '新疆准噶尔盆地', area: 198.3 },
  { code: 'block-3', name: '华北油区', location: '河北省渤海湾', area: 156.8 },
  { code: 'block-4', name: '南部勘探区', location: '四川盆地', area: 142.5 },
];

const wellStatuses: WellData['status'][] = ['producing', 'producing', 'producing', 'producing', 'producing', 'producing', 'producing', 'producing', 'maintenance', 'idle'];

export const generateMockBlocksAndWells = (users: User[]): { blocks: Block[]; teams: Team[]; wells: WellData[] } => {
  const blocks: Block[] = [];
  const teams: Team[] = [];
  const wells: WellData[] = [];

  const blockManagers = users.filter((u) => u.role === 'block_manager');
  const teamLeaders = users.filter((u) => u.role === 'team_leader');
  const oilWorkers = users.filter((u) => u.role === 'oil_worker');

  blockNames.forEach((blockInfo, blockIndex) => {
    const manager = blockManagers[blockIndex % blockManagers.length];
    const blockId = blockInfo.code;

    const blockDailyProduction = 800 + Math.random() * 600;

    const block: Block = {
      id: blockId,
      code: blockInfo.code.toUpperCase(),
      name: blockInfo.name,
      location: blockInfo.location,
      area: blockInfo.area,
      managerId: manager.id,
      wellCount: 12,
      dailyProduction: Math.round(blockDailyProduction * 100) / 100,
      status: 'operational',
      createdAt: `2024-0${blockIndex + 1}-15T08:00:00.000Z`,
    };

    if (manager.blockId === undefined || manager.blockId !== blockId) {
      manager.blockId = blockId;
    }

    blocks.push(block);

    const shifts: Team['shift'][] = ['morning', 'afternoon', 'night'];
    for (let teamIndex = 0; teamIndex < 2; teamIndex++) {
      const leader = teamLeaders[(blockIndex * 2 + teamIndex) % teamLeaders.length];
      const teamId = generateId();
      const shift = shifts[teamIndex % shifts.length];

      const memberIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const workerIdx = (blockIndex * 6 + teamIndex * 3 + i) % (oilWorkers.length || 1);
        if (oilWorkers[workerIdx]) {
          memberIds.push(oilWorkers[workerIdx].id);
          if (oilWorkers[workerIdx].blockId === undefined) {
            oilWorkers[workerIdx].blockId = blockId;
          }
          if (oilWorkers[workerIdx].teamId === undefined) {
            oilWorkers[workerIdx].teamId = teamId;
          }
        }
      }

      const team: Team = {
        id: teamId,
        code: `${blockInfo.code.toUpperCase()}-TEAM-${teamIndex + 1}`,
        name: `${blockInfo.name}${shift === 'morning' ? '早班' : shift === 'afternoon' ? '中班' : '夜班'}${teamIndex + 1}组`,
        blockId,
        leaderId: leader.id,
        memberIds,
        shift,
        wellIds: [],
        createdAt: `2024-0${blockIndex + 1}-20T08:00:00.000Z`,
      };

      if (leader.blockId === undefined) leader.blockId = blockId;
      if (leader.teamId === undefined) leader.teamId = teamId;

      teams.push(team);
    }

    for (let wellIndex = 0; wellIndex < 12; wellIndex++) {
      const team = teams[teams.length - (wellIndex % 2 === 0 ? 2 : 1)];
      const wellId = generateId();
      team.wellIds.push(wellId);

      const workerIndex = wellIndex % (team.memberIds.length || 1);
      const workerId = team.memberIds[workerIndex] || '';

      const status = wellStatuses[Math.floor(Math.random() * wellStatuses.length)];
      const dailyProduction = status === 'producing' ? 50 + Math.random() * 80 : Math.random() * 10;
      const depth = 2000 + Math.random() * 3500;
      const pressure = 8 + Math.random() * 22;
      const temperature = 45 + Math.random() * 65;
      const integrityRate = 88 + Math.random() * 12;
      const cumulativeBase = 3650 + Math.random() * 1825;

      const well: WellData = {
        id: wellId,
        code: `${blockInfo.code.toUpperCase()}-W-${String(wellIndex + 1).padStart(3, '0')}`,
        name: `${blockInfo.name}${wellIndex + 1}号井`,
        blockId,
        teamId: team.id,
        workerId,
        depth: Math.round(depth * 100) / 100,
        pressure: Math.round(pressure * 100) / 100,
        temperature: Math.round(temperature * 100) / 100,
        integrityRate: Math.round(integrityRate * 100) / 100,
        dailyProduction: Math.round(dailyProduction * 100) / 100,
        cumulativeProduction: Math.round(dailyProduction * cumulativeBase * 100) / 100,
        status,
        lastMaintenanceDate: `2025-0${(wellIndex % 5) + 1}-${String((wellIndex % 28) + 1).padStart(2, '0')}T08:00:00.000Z`,
        createdAt: `2024-0${blockIndex + 1}-${String((wellIndex % 28) + 1).padStart(2, '0')}T08:00:00.000Z`,
        updatedAt: new Date().toISOString(),
      };

      wells.push(well);
    }
  });

  return { blocks, teams, wells };
};
