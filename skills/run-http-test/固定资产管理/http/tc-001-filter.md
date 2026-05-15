# Test Report

**🔍 Filter:** TC-001

*This report only shows test cases matching the filter.*

**Date:** 2026-05-15T03:49:18Z
**Total Tests:** 17
**Passed:** 0
**Failed:** 17
**Skipped:** 0

**Pass Rate:** 0.0%

---

# Test Details

## Summary

| Metric | Count |
|--------|-------|
| Total | 17 |
| Passed | 0 |
| Failed | 17 |
| Skipped | 0 |

## Test Cases

### ❌ TC-001: 创建楼栋

**Method:** POST
**URL:** http://192.168.3.105:3001/api/v1/building/buildings
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "origation": "计算机学院",
  "origation_code": "CS",
  "area": "北区",
  "code": "CS-B01-1778816958794",
  "name": "计算机学院1号楼",
  "gender_limit": 0,
  "total_floors": 6,
  "address": "北京市海淀区XX路XX号",
  "area_size": 2500.5,
  "build_year": "2020",
  "status": "OPEN",
  "note": "男生宿舍楼"
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/buildings - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found; Extraction failed for `testBuildingId` from path `data.row_id`.

---

### ❌ TC-002: 楼栋详情

**Method:** GET
**URL:** http://192.168.3.105:3001/api/v1/building/buildings/dynamic
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "Record not found: row_id 'dynamic' does not exist in entity 'building_info' - please verify the record ID is correct or the data has not been deleted"
  }
}
```

**Error:** Data not found

---

### ❌ TC-005: 更新楼栋

**Method:** PUT
**URL:** http://192.168.3.105:3001/api/v1/building/buildings/dynamic
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "origation": "计算机学院",
  "origation_code": "CS",
  "area": "北区",
  "code": "CS-B01",
  "name": "计算机学院1号楼（更新）",
  "gender_limit": 0,
  "total_floors": 7,
  "address": "北京市海淀区XX路XX号",
  "area_size": 2800,
  "build_year": "2020",
  "status": "OPEN",
  "note": "男生宿舍楼 - 2024年翻新"
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/buildings - 请使用 eav-cli cfg route create 配置路由映射，参数：'dynamic'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-006: 更新楼栋状态

**Method:** PATCH
**URL:** http://192.168.3.105:3001/api/v1/building/buildings/dynamic
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "status": "CLOSE"
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/buildings - 请使用 eav-cli cfg route create 配置路由映射，参数：'dynamic'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-007: 创建楼层

**Method:** POST
**URL:** http://192.168.3.105:3001/api/v1/building/floors
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "building_id": "dynamic",
  "floor": 1,
  "floor_type": "GROUND",
  "is_standard": 1,
  "rooms": 10,
  "area_size": 500,
  "status": "OPEN"
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/floors - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found; Extraction failed for `testFloorId` from path `data.row_id`.

---

### ❌ TC-010: 楼层列表 - 按楼栋筛选

**Method:** GET
**URL:** http://192.168.3.105:3001/api/v1/building/floors?building_id=dynamic&page=1&page_size=20
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/floors - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-011: 更新楼层

**Method:** PUT
**URL:** http://192.168.3.105:3001/api/v1/building/floors/dynamic
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "building_id": "dynamic",
  "floor": 1,
  "floor_type": "GROUND",
  "is_standard": 1,
  "rooms": 12,
  "area_size": 520,
  "status": "OPEN"
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/floors - 请使用 eav-cli cfg route create 配置路由映射，参数：'dynamic'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-013: 创建房间

**Method:** POST
**URL:** http://192.168.3.105:3001/api/v1/building/rooms
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "building_id": "dynamic",
  "floor_id": "dynamic",
  "floor": 3,
  "room_no": "301-1778816958854",
  "room_type": "4人间",
  "capacity": 4,
  "area": 35.5,
  "status": "OPEN",
  "note": "朝南房间"
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/rooms - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found; Extraction failed for `testRoomId` from path `data.row_id`, `testRoomNo` from path `data.room_no`.

---

### ❌ TC-016: 房间列表 - 按楼栋和楼层筛选

**Method:** GET
**URL:** http://192.168.3.105:3001/api/v1/building/rooms?building_id=dynamic&floor=3&page=1&page_size=20
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/rooms - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-017: 更新房间

**Method:** PUT
**URL:** http://192.168.3.105:3001/api/v1/building/rooms/dynamic
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "building_id": "dynamic",
  "floor_id": "dynamic",
  "floor": 3,
  "room_no": "dynamic",
  "room_type": "6人间",
  "capacity": 6,
  "area": 35.5,
  "status": "OPEN",
  "note": "扩容后更新"
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/rooms - 请使用 eav-cli cfg route create 配置路由映射，参数：'dynamic'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-024: 按楼层区间批量生成楼层

**Method:** POST
**URL:** http://192.168.3.105:3001/api/v1/building/floors/op/batch-generate
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "building_id": "dynamic",
  "from_floor": 2,
  "to_floor": 5,
  "floor_type": "STANDARD",
  "rooms": 12,
  "area_size": 520,
  "is_standard": 1,
  "auto_create_rooms": false
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/floors/op/batch-generate - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-025: 校验楼层列表（按楼栋，大分页）

**Method:** GET
**URL:** http://192.168.3.105:3001/api/v1/building/floors?building_id=dynamic&page=1&page_size=50
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/floors - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-026: 按楼栋生成/刷新房间

**Method:** POST
**URL:** http://192.168.3.105:3001/api/v1/building/buildings/dynamic/rooms/op/generate
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Request body:**
```json
{
  "room_no_rule": "floor*100 + index",
  "upsert": true
}
```

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/buildings/dynamic/rooms/op/generate - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-027: 校验房间列表（仅按楼栋）

**Method:** GET
**URL:** http://192.168.3.105:3001/api/v1/building/rooms?building_id=dynamic&page=1&page_size=50
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/rooms - 请使用 eav-cli cfg route create 配置路由映射，参数：'default'"
  }
}
```

**Error:** Data not found

---

### ❌ TC-028: 可视化 — 立面网格

**Method:** GET
**URL:** http://192.168.3.105:3001/api/adm/building/visualization/facade?building_id=dynamic
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Response:**
```json
FALLBACK: No matching route
```

**Error:** FALLBACK: No matching route

---

### ❌ TC-029: 可视化 — 楼层平面图网格（floor=1）

**Method:** GET
**URL:** http://192.168.3.105:3001/api/adm/building/visualization/floor-plan?building_id=dynamic&floor=1
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Response:**
```json
FALLBACK: No matching route
```

**Error:** FALLBACK: No matching route

---

### ❌ TC-904: 删除楼栋

**Method:** DELETE
**URL:** http://192.168.3.105:3001/api/v1/building/buildings/dynamic
**Status:** 404 Not Found
**Time:** 2026-05-15T03:49:18Z

**Response:**
```json
{
  "code": 4017,
  "message": "Data not found",
  "details": {
    "resource": "路由未配置：/api/v1/building/buildings - 请使用 eav-cli cfg route create 配置路由映射，参数：'dynamic'"
  }
}
```

**Error:** Data not found

---
