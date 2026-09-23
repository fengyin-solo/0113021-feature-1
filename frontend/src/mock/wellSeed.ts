import type { Well } from '@/types/well'

/**
 * 井位台账种子数据（本地模拟服务的内存数据源）。
 * 前 5 条保持与原台账完全一致，保证既有井位数据不受影响。
 */
export const seedWells: Well[] = [
  { id: 1, wellCode: 'A-001', wellName: 'A-01井', wellType: '开发井', blockName: '胜利油田', longitude: 118.5236, latitude: 38.2356, designDepth: 3500, status: '生产中', createTime: '2024-01-01 10:00:00' },
  { id: 2, wellCode: 'B-003', wellName: 'B-03井', wellType: '探井', blockName: '胜利油田', longitude: 118.8562, latitude: 38.5123, designDepth: 4200, status: '钻井中', createTime: '2024-01-02 14:30:00' },
  { id: 3, wellCode: 'C-002', wellName: 'C-02井', wellType: '开发井', blockName: '胜利油田', longitude: 119.1254, latitude: 38.3456, designDepth: 3800, status: '生产中', createTime: '2024-01-03 09:15:00' },
  { id: 4, wellCode: 'D-005', wellName: 'D-05井', wellType: '评价井', blockName: '胜利油田', longitude: 118.6587, latitude: 38.7895, designDepth: 4000, status: '待修井', createTime: '2024-01-04 16:45:00' },
  { id: 5, wellCode: 'E-001', wellName: 'E-01井', wellType: '开发井', blockName: '胜利油田', longitude: 118.9563, latitude: 38.4562, designDepth: 3600, status: '关停井', createTime: '2024-01-05 11:20:00' },

  { id: 6, wellCode: 'SL-006', wellName: '胜6井', wellType: '评价井', blockName: '胜利油田', longitude: 118.7123, latitude: 38.6012, designDepth: 4500, status: '生产中', createTime: '2024-01-06 08:30:00' },
  { id: 7, wellCode: 'SL-007', wellName: '胜7井', wellType: '开发井', blockName: '胜利油田', longitude: 118.9021, latitude: 38.2890, designDepth: 3200, status: '生产中', createTime: '2024-01-07 10:10:00' },
  { id: 8, wellCode: 'SL-008', wellName: '胜8井', wellType: '探井', blockName: '胜利油田', longitude: 118.4532, latitude: 38.8120, designDepth: 5100, status: '钻井中', createTime: '2024-01-08 13:50:00' },
  { id: 9, wellCode: 'SL-009', wellName: '胜9井', wellType: '开发井', blockName: '胜利油田', longitude: 119.0213, latitude: 38.4781, designDepth: 3700, status: '待修井', createTime: '2024-01-09 15:25:00' },
  { id: 10, wellCode: 'SL-010', wellName: '胜10井', wellType: '评价井', blockName: '胜利油田', longitude: 118.6341, latitude: 38.5234, designDepth: 4300, status: '关停井', createTime: '2024-01-10 09:40:00' },
  { id: 11, wellCode: 'SL-011', wellName: '胜11井', wellType: '开发井', blockName: '胜利油田', longitude: 118.8912, latitude: 38.3567, designDepth: 3400, status: '生产中', createTime: '2024-01-11 11:05:00' },
  { id: 12, wellCode: 'SL-012', wellName: '胜12井', wellType: '探井', blockName: '胜利油田', longitude: 118.5423, latitude: 38.6901, designDepth: 4800, status: '生产中', createTime: '2024-01-12 14:15:00' },

  { id: 13, wellCode: 'DQ-001', wellName: '大庆1井', wellType: '探井', blockName: '大庆油田', longitude: 125.0301, latitude: 46.5902, designDepth: 2200, status: '生产中', createTime: '2024-01-13 08:00:00' },
  { id: 14, wellCode: 'DQ-002', wellName: '大庆2井', wellType: '开发井', blockName: '大庆油田', longitude: 124.8912, latitude: 46.5021, designDepth: 1800, status: '关停井', createTime: '2024-01-14 09:30:00' },
  { id: 15, wellCode: 'DQ-003', wellName: '大庆3井', wellType: '开发井', blockName: '大庆油田', longitude: 125.1023, latitude: 46.6345, designDepth: 2050, status: '钻井中', createTime: '2024-01-15 10:50:00' },
  { id: 16, wellCode: 'DQ-004', wellName: '大庆4井', wellType: '评价井', blockName: '大庆油田', longitude: 124.7654, latitude: 46.4210, designDepth: 2600, status: '待修井', createTime: '2024-01-16 13:20:00' },
  { id: 17, wellCode: 'DQ-005', wellName: '大庆5井', wellType: '开发井', blockName: '大庆油田', longitude: 125.2341, latitude: 46.7012, designDepth: 1950, status: '生产中', createTime: '2024-01-17 15:40:00' },

  { id: 18, wellCode: 'CQ-001', wellName: '长庆1井', wellType: '开发井', blockName: '长庆油田', longitude: 108.9481, latitude: 34.2631, designDepth: 2800, status: '生产中', createTime: '2024-01-18 08:50:00' },
  { id: 19, wellCode: 'CQ-002', wellName: '长庆2井', wellType: '探井', blockName: '长庆油田', longitude: 108.7123, latitude: 34.1024, designDepth: 3900, status: '钻井中', createTime: '2024-01-19 10:30:00' },
  { id: 20, wellCode: 'CQ-003', wellName: '长庆3井', wellType: '评价井', blockName: '长庆油田', longitude: 109.1234, latitude: 34.3891, designDepth: 3500, status: '生产中', createTime: '2024-01-20 12:10:00' },
  { id: 21, wellCode: 'CQ-004', wellName: '长庆4井', wellType: '开发井', blockName: '长庆油田', longitude: 108.5612, latitude: 34.0567, designDepth: 3000, status: '关停井', createTime: '2024-01-21 14:45:00' },

  { id: 22, wellCode: 'TLM-001', wellName: '塔中1井', wellType: '探井', blockName: '塔里木油田', longitude: 83.0123, latitude: 39.4021, designDepth: 6800, status: '钻井中', createTime: '2024-01-22 09:05:00' },
  { id: 23, wellCode: 'TLM-002', wellName: '塔中2井', wellType: '开发井', blockName: '塔里木油田', longitude: 83.2341, latitude: 39.5612, designDepth: 5900, status: '生产中', createTime: '2024-01-23 11:35:00' },
  { id: 24, wellCode: 'TLM-003', wellName: '塔中3井', wellType: '评价井', blockName: '塔里木油田', longitude: 82.8567, latitude: 39.2890, designDepth: 6200, status: '待修井', createTime: '2024-01-24 13:55:00' },

  { id: 25, wellCode: 'BH-001', wellName: '渤海1井', wellType: '开发井', blockName: '渤海油田', longitude: 119.2013, latitude: 38.6012, designDepth: 2400, status: '生产中', createTime: '2024-01-25 08:20:00' },
  { id: 26, wellCode: 'BH-002', wellName: '渤海2井', wellType: '探井', blockName: '渤海油田', longitude: 119.4123, latitude: 38.8123, designDepth: 3300, status: '关停井', createTime: '2024-01-26 10:00:00' },
  { id: 27, wellCode: 'BH-003', wellName: '渤海3井', wellType: '评价井', blockName: '渤海油田', longitude: 118.9834, latitude: 38.4891, designDepth: 2900, status: '生产中', createTime: '2024-01-27 12:30:00' },

  { id: 28, wellCode: 'LH-001', wellName: '辽河1井', wellType: '开发井', blockName: '辽河油田', longitude: 122.0567, latitude: 41.1023, designDepth: 2700, status: '待修井', createTime: '2024-01-28 14:10:00' },
  { id: 29, wellCode: 'LH-002', wellName: '辽河2井', wellType: '探井', blockName: '辽河油田', longitude: 121.8912, latitude: 40.9567, designDepth: 3600, status: '生产中', createTime: '2024-01-29 15:50:00' },
  { id: 30, wellCode: 'LH-003', wellName: '辽河3井', wellType: '开发井', blockName: '辽河油田', longitude: 122.2034, latitude: 41.2341, designDepth: 2500, status: '生产中', createTime: '2024-01-30 09:15:00' }
]
