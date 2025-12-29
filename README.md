# Figma MCP Viewer

Figma Desktop MCP를 통해 선택한 프레임의 정보를 확인할 수 있는 React + Python 백엔드 애플리케이션입니다.

## 프로젝트 구조

```
MoneyCoach/
├── backend/          # Python FastAPI 백엔드
│   ├── main.py      # FastAPI 서버 및 API 엔드포인트
│   ├── mcp_client.py # MCP 클라이언트 (구현 필요)
│   └── requirements.txt
├── frontend/         # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   └── FigmaSelectionPanel.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 설치 및 실행

### 백엔드 (Python)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

백엔드는 `http://localhost:8000`에서 실행됩니다.

### 프론트엔드 (React)

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.

## API 엔드포인트

### `GET /api/figma/metadata?nodeId={nodeId}`
선택한 Figma 프레임의 메타데이터를 가져옵니다.
- `nodeId` (선택사항): 노드 ID. 제공하지 않으면 현재 선택된 노드를 사용합니다.

### `GET /api/figma/screenshot?nodeId={nodeId}`
선택한 Figma 프레임의 스크린샷을 가져옵니다.

### `GET /api/figma/design-context?nodeId={nodeId}`
선택한 Figma 프레임의 디자인 컨텍스트를 가져옵니다.

## MCP 통합

현재 `backend/mcp_client.py`는 구조만 제공되어 있습니다. 실제 MCP 서버와 통신하려면:

1. MCP SDK를 사용하여 클라이언트 구현
2. 또는 Cursor의 MCP 서버와 직접 통신하는 방법 구현

MCP 호출 예시:
- `mcp_Figma_Desktop_get_metadata`
- `mcp_Figma_Desktop_get_screenshot`
- `mcp_Figma_Desktop_get_design_context`

## 사용 방법

1. Figma Desktop 앱을 열고 프레임을 선택합니다
2. React 앱에서 "선택한 프레임 불러오기" 버튼을 클릭합니다
3. 프레임 정보가 표시됩니다
4. "스크린샷 보기" 버튼을 클릭하여 스크린샷을 확인할 수 있습니다

## 참고사항

- MCP 통합이 완료되기 전까지는 샘플 데이터가 표시됩니다
- 실제 MCP 호출을 위해서는 `backend/mcp_client.py`의 구현이 필요합니다



