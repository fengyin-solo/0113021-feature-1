# 单井全生命周期管理系统 技术架构文档

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | 单井全生命周期管理系统 技术架构 |
| 版本号 | v1.0 |
| 创建日期 | 2026-05-15 |

## 2. 总体架构设计

### 2.1 架构分层

```
┌─────────────────────────────────────────────────────────┐
│                    表现层 (Presentation)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  PC端    │  │  移动端  │  │ 大屏展示│  │  第三方  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    网关层 (Gateway)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  路由分发  │  负载均衡  │  限流熔断  │  日志审计  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    应用层 (Application)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │井位管理  │  │钻井监控  │  │生产管理  │  │设备管理  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │安全环保  │  │报表分析  │  │权限管理  │  │系统管理  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    业务层 (Business)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 业务服务 │  │ 规则引擎 │  │ 工作流   │  │ 消息队列 │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    数据层 (Data)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  MySQL   │  │  Redis   │  │  MinIO   │  │ 时序DB   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    基础设施层 (Infrastructure)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Docker   │  │ K8s      │  │ 监控告警 │  │ 日志平台 │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 3. 数据库设计

### 3.1 核心数据表

#### 3.1.1 井位基础信息表 (well_info)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| well_id | BIGINT | 井ID，主键 |
| well_name | VARCHAR(100) | 井名 |
| well_code | VARCHAR(50) | 井号 |
| well_type | VARCHAR(20) | 井类型（探井/开发井/评价井） |
| well_status | VARCHAR(20) | 井状态 |
| longitude | DECIMAL(12,8) | 经度 |
| latitude | DECIMAL(12,8) | 纬度 |
| elevation | DECIMAL(10,2) | 海拔 |
| block_name | VARCHAR(100) | 区块名称 |
| oilfield_name | VARCHAR(100) | 油田名称 |
| design_well_depth | DECIMAL(10,2) | 设计井深 |
| actual_well_depth | DECIMAL(10,2) | 实际井深 |
| spud_date | DATE | 开钻日期 |
| completion_date | DATE | 完钻日期 |
| production_date | DATE | 投产日期 |
| abandon_date | DATE | 废弃日期 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

#### 3.1.2 钻井实时数据表 (drilling_real_time)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键 |
| well_id | BIGINT | 井ID |
| record_time | DATETIME | 记录时间 |
| well_depth | DECIMAL(10,2) | 井深 |
| bit_depth | DECIMAL(10,2) | 钻头深度 |
| wob | DECIMAL(10,2) | 钻压 |
| rpm | DECIMAL(10,2) | 转速 |
| torque | DECIMAL(10,2) | 扭矩 |
| rop | DECIMAL(10,2) | 机械钻速 |
| hook_load | DECIMAL(10,2) | 大钩负荷 |
| standpipe_pressure | DECIMAL(10,2) | 立管压力 |
| mud_flow_in | DECIMAL(10,2) | 入井流量 |
| mud_flow_out | DECIMAL(10,2) | 返出流量 |
| mud_density_in | DECIMAL(10,3) | 入井密度 |
| mud_density_out | DECIMAL(10,3) | 返出密度 |
| mud_temperature | DECIMAL(10,2) | 泥浆温度 |

#### 3.1.3 生产数据表 (production_data)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键 |
| well_id | BIGINT | 井ID |
| report_date | DATE | 上报日期 |
| production_hours | DECIMAL(5,2) | 生产小时 |
| oil_production | DECIMAL(12,2) | 产油量 |
| water_production | DECIMAL(12,2) | 产水量 |
| gas_production | DECIMAL(12,2) | 产气量 |
| cumulative_oil | DECIMAL(15,2) | 累计产油 |
| cumulative_water | DECIMAL(15,2) | 累计产水 |
| cumulative_gas | DECIMAL(15,2) | 累计产气 |
| tubing_pressure | DECIMAL(10,2) | 油压 |
| casing_pressure | DECIMAL(10,2) | 套压 |
| flow_pressure | DECIMAL(10,2) | 流压 |
| water_cut | DECIMAL(5,2) | 含水率 |
| gas_oil_ratio | DECIMAL(10,2) | 气油比 |

#### 3.1.4 设备信息表 (equipment_info)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键 |
| equipment_code | VARCHAR(50) | 设备编码 |
| equipment_name | VARCHAR(100) | 设备名称 |
| equipment_type | VARCHAR(50) | 设备类型 |
| model | VARCHAR(100) | 型号规格 |
| manufacturer | VARCHAR(100) | 生产厂家 |
| purchase_date | DATE | 购置日期 |
| warranty_period | INT | 质保期(月) |
| install_location | VARCHAR(200) | 安装位置 |
| well_id | BIGINT | 关联井ID |
| equipment_status | VARCHAR(20) | 设备状态 |
| last_maintenance_date | DATE | 上次维护日期 |
| next_maintenance_date | DATE | 下次维护日期 |
| running_hours | DECIMAL(12,2) | 运行时长 |

#### 3.1.5 安全环保监测表 (hse_monitor)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGINT | 主键 |
| well_id | BIGINT | 井ID |
| monitor_time | DATETIME | 监测时间 |
| monitor_type | VARCHAR(50) | 监测类型 |
| item_code | VARCHAR(50) | 监测项编码 |
| item_name | VARCHAR(100) | 监测项名称 |
| monitor_value | DECIMAL(12,3) | 监测值 |
| unit | VARCHAR(20) | 单位 |
| threshold_value | DECIMAL(12,3) | 阈值 |
| is_normal | TINYINT | 是否正常 |
| alarm_level | VARCHAR(20) | 告警级别 |

#### 3.1.6 用户表 (sys_user)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| user_id | BIGINT | 用户ID |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(100) | 密码 |
| real_name | VARCHAR(50) | 真实姓名 |
| email | VARCHAR(100) | 邮箱 |
| phone | VARCHAR(20) | 手机号 |
| department_id | BIGINT | 部门ID |
| status | TINYINT | 状态 |
| create_time | DATETIME | 创建时间 |

#### 3.1.7 角色表 (sys_role)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| role_id | BIGINT | 角色ID |
| role_name | VARCHAR(50) | 角色名称 |
| role_key | VARCHAR(50) | 角色编码 |
| role_sort | INT | 排序 |
| status | TINYINT | 状态 |

#### 3.1.8 权限表 (sys_menu)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| menu_id | BIGINT | 菜单ID |
| menu_name | VARCHAR(50) | 菜单名称 |
| parent_id | BIGINT | 父菜单ID |
| menu_type | CHAR(1) | 菜单类型 |
| path | VARCHAR(200) | 路由地址 |
| component | VARCHAR(255) | 组件路径 |
| perms | VARCHAR(100) | 权限标识 |
| icon | VARCHAR(100) | 菜单图标 |
| sort | INT | 排序 |

## 4. API接口设计

### 4.1 RESTful API规范

```
GET    /api/v1/wells              # 获取井列表
POST   /api/v1/wells              # 新增井
GET    /api/v1/wells/{id}         # 获取井详情
PUT    /api/v1/wells/{id}         # 更新井
DELETE /api/v1/wells/{id}         # 删除井

GET    /api/v1/drilling/{wellId}/realtime  # 获取钻井实时数据
GET    /api/v1/production/{wellId}/daily   # 获取日生产数据
GET    /api/v1/equipment/{wellId}/list     # 获取设备列表
```

### 4.2 WebSocket实时推送

```
/ws/drilling/{wellId}    # 钻井实时数据推送
/ws/production/{wellId}  # 生产数据推送
/ws/alarm                # 告警信息推送
```

## 5. 安全设计

### 5.1 认证机制
- JWT Token认证
- Token刷新机制
- 会话管理

### 5.2 授权机制
- 基于RBAC的权限控制
- 数据权限隔离
- 接口权限校验

### 5.3 数据安全
- 敏感数据加密存储
- 数据传输加密
- 数据脱敏展示

## 6. 部署架构

```
                    ┌─────────┐
                    │  用户   │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  负载均衡 │
                    └────┬────┘
          ┌──────────────┼──────────────┐
          │              │              │
     ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
     │ 应用实例1│    │ 应用实例2│    │ 应用实例N│
     └────┬────┘    └────┬────┘    └────┬────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
     │  MySQL  │    │  Redis  │    │  MinIO  │
     └─────────┘    └─────────┘    └─────────┘
```
