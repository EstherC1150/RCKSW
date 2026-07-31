# 📘 VC-Model 외부 연동 API 명세서 (Insert / Update / Select)

본 문서는 외부 시스템 및 플러그인에서 **Visual Components Model (VC-Model)** 데이터를 **신규 등록(Insert)**, **버전 업데이트(Update)**, **최신 목록 조회(Select)**하기 위해 사용하는 통합 API 명세서입니다.

---

## 1. 공통 사항 (Common Specifications)

- **Base URL**: `http://<서버_도메인_또는_IP>:8180`
- **인증 헤더 (Authentication Header)**:
  - `X-API-Key: <발급받은_API_KEY>` (모든 API 요청 시 필수)
- **표기 기준 (Requirement Status)**:
  - 🟢 **[필수]**: 누락 시 요청 실패 (`400 Bad Request`)
  - 🟡 **[조건부 필수]**: 특정 상황(기존 파일 재사용 여부 등)에 따라 필수
  - ⚪ **[선택]**: 입력하지 않아도 등록 가능

---

## 2. API 엔드포인트 목록 요약 (Endpoints Overview)

| 기능 | HTTP Method | Endpoint | 설명 |
| :--- | :---: | :--- | :--- |
| **VC-Model 최초 등록** | `POST` | `/api/components` | 최초 버전(V1.0 등)의 VC Model을 DB에 등록 |
| **VC-Model 버전 업데이트** | `PATCH` | `/api/components/:id` | 기존 모델에 신규 버전 레코드를 추가 생성(Insert) |
| **최신 VC-Model 목록 조회** | `GET` | `/api/components/all_update` | 등록된 모델들의 최신 버전 정보 목록 조회 |

---

## 3. VC-Model 최초 등록 API (Insert)

최초로 VC Model을 시스템에 등록할 때 호출하는 API입니다.

### 3.1 기본 정보
- **Endpoint**: `POST /api/components`
- **Content-Type**: `multipart/form-data`
- **Header**: `X-API-Key: <API_KEY>` (🟢 필수)

### 3.2 Form Data 파라미터 (Fields)

| Parameter Name | 구분 | Type | 허용 값 / 예시 | 설명 |
| :--- | :---: | :---: | :--- | :--- |
| **`type`** | 🟢 **[필수]** | String | `"vc_model"` | 등록 구분 키. **반드시 `"vc_model"` 고정값** |
| **`modelType`** | 🟢 **[필수]** | String | `"component"` 또는 `"layout"` | **VC Model 세부 분류** (컴포넌트 또는 레이아웃) |
| **`componentName`** | 🟢 **[필수]** | String | `Robot_Arm_A1` | 컴포넌트/모델 명칭 |
| **`version`** | 🟢 **[필수]** | String | `1.0.0` | 등록할 버전 정보 |
| **`description`** | ⚪ **[선택]** | String | `Visual Components 3D 모델` | 모델에 대한 상세 설명 |
| **`features`**<br>*(또는 `main_features`)* | ⚪ **[선택]** | String / Array | `["3D 모션", "컨베이어"]` | 주요 기능 목록 (`features`, `main_features`, `mainFeatures` 키 모두 인식) |
| **`environment`** | ⚪ **[선택]** | String | `Visual Components 4.7+` | 권장 실행 환경 |

### 3.3 Form Data 파일 (Files)

| File Field Name | 구분 | Type | 허용 확장자 | 설명 |
| :--- | :---: | :---: | :--- | :--- |
| **`sourceFile`** | 🟡 **[조건부]** | File | `.vcmx`, `.vcl`, `.fbx`, `.dll` | 메인 소스 모델 파일 (보통 필수 권장) |
| **`fbxFile`** | ⚪ **[선택]** | File | `.fbx` | 3D 모델 미리보기용 FBX 파일 |
| **`thumbnail`** | ⚪ **[선택]** | File | `.png`, `.jpg`, `.jpeg` | 썸네일 이미지 (미첨부 시 FBX에서 자동 생성) |
| **`iconFile`** | ⚪ **[선택]** | File | `.png`, `.jpg`, `.ico` | 컴포넌트 아이콘 파일 |

> [!TIP]
> **썸네일 자동 생성**: `thumbnail`을 업로드하지 않더라도, `fbxFile` 또는 `.fbx` 확장자의 `sourceFile`을 업로드하면 서버에서 3D 썸네일을 자동 추출하여 등록합니다.

### 3.4 응답 예시 (`200 OK`)

```json
{
  "success": true,
  "message": "컴포넌트 등록 완료",
  "data": {
    "id": 105,
    "component_id": 105,
    "file_name": "Robot_Arm_A1",
    "version": "1.0.0",
    "description": "Visual Components 3D 모델 설명",
    "type": "vc_model",
    "model_type": "component",
    "thumbnail_image": "/uploads/thumbnails/auto-thumbnail-1721634567.png",
    "source_file_link": "/uploads/source/vc_model/vcmx/Robot_Arm_A1.vcmx",
    "fbx_file_link": "/uploads/source/vc_model/fbx/Robot_Arm_A1.fbx",
    "uploader": "api-key:ExternalSystem",
    "created_at": "2026-07-22T16:53:00.000Z"
  }
}
```

---

## 4. VC-Model 버전 업데이트 API (Update / Version Insert)

기존 등록된 모델에 **새로운 버전 레코드**를 신규 추가 생성(Insert)하여 업데이트하는 API입니다.

### 4.1 기본 정보
- **Endpoint**: `PATCH /api/components/:id`
  - `:id` URL 파라미터: 업데이트 대상 컴포넌트의 **기존 `id`** 또는 **`component_id`** (🟢 필수)
- **Content-Type**: `multipart/form-data`
- **Header**: `X-API-Key: <API_KEY>` (🟢 필수)

### 4.2 Form Data 파라미터 (Fields)

| Parameter Name | 구분 | Type | 허용 값 / 예시 | 설명 |
| :--- | :---: | :---: | :--- | :--- |
| **`version`** | 🟢 **[필수]** | String | `1.1.0` | **업데이트할 새 버전 번호** |
| **`componentName`** | ⚪ **[선택]** | String | `Robot_Arm_A1` | 변경할 컴포넌트명 (변경 시 그룹 내 모든 버전 명칭 동기화) |
| **`modelType`** | ⚪ **[선택]** | String | `"component"` 또는 `"layout"` | 모델 타입 변경 시 지정 (미입력 시 기존 값 유지) |
| **`description`** | ⚪ **[선택]** | String | `V1.1.0 기능 개선 업데이트` | 새 버전에 대한 설명 |
| **`features`**<br>*(또는 `main_features`)* | ⚪ **[선택]** | String / Array | `["신규 동작 추가"]` | 새 버전의 주요 기능 |
| **`environment`** | ⚪ **[선택]** | String | `Visual Components 4.8+` | 권장 실행 환경 |
| **`useExistingSource`** | 🟡 **[조건부]** | String | `"true"` 또는 `"false"` | `"true"` 지정 시 소스 파일 재업로드 없이 기존 소스 유지 |

### 4.3 Form Data 파일 (Files)

| File Field Name | 구분 | Type | 허용 확장자 | 설명 |
| :--- | :---: | :---: | :--- | :--- |
| **`sourceFile`** | 🟡 **[조건부]** | File | `.vcmx`, `.vcl`, `.fbx`, `.dll` | **새 버전에 사용할 파일.** (`useExistingSource` 미지정 시 🟢 **필수**) |
| **`fbxFile`** | ⚪ **[선택]** | File | `.fbx` | 새 버전용 FBX 파일 |
| **`thumbnail`** | ⚪ **[선택]** | File | `.png`, `.jpg`, `.jpeg` | 새 버전용 썸네일 |
| **`iconFile`** | ⚪ **[선택]** | File | `.png`, `.jpg`, `.ico` | 새 버전용 아이콘 |

---

## 5. VC-Model 최신 목록 조회 API (Select)

현재 등록되어 있는 최신 버전의 VC-Model 목록을 조회합니다.

### 5.1 기본 정보
- **Endpoint**: `GET /api/components/all_update?type=vc_model`
- **Header**: `X-API-Key: <API_KEY>` (🟢 필수)

---

## 6. 개발언어별 예제 (Code Examples)

### 6.1 cURL 예제 (최초 등록)
```bash
curl -X POST "http://your-server-domain:8180/api/components" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -F "type=vc_model" \
  -F "modelType=component" \
  -F "componentName=Robot_Arm_A1" \
  -F "version=1.0.0" \
  -F "description=Visual Components 3D 로봇 팔 모델" \
  -F "features=[\"3D 모션\", \"고속 제어\"]" \
  -F "sourceFile=@/path/to/Robot_Arm_A1.vcmx"
```
