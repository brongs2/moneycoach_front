# MCP 통합 가이드

Python 백엔드에서 Figma Desktop MCP 서버와 통신하는 방법입니다.

## 방법 1: Cursor의 MCP 서버 직접 사용 (권장)

Cursor에서 직접 MCP를 호출할 수 있으므로, Python 백엔드가 Cursor의 MCP 서버와 통신하는 방법을 구현할 수 있습니다.

### 옵션 A: HTTP 프록시 서버 사용

Cursor의 MCP 서버가 HTTP 엔드포인트를 제공하는 경우, Python에서 직접 HTTP 요청을 보낼 수 있습니다.

```python
import httpx

async def call_mcp_figma_metadata(node_id: Optional[str] = None):
    # Cursor의 MCP 서버 엔드포인트 (실제 엔드포인트로 변경 필요)
    url = "http://localhost:3000/mcp/figma/get_metadata"
    params = {}
    if node_id:
        params["nodeId"] = node_id
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        return response.json()
```

### 옵션 B: MCP SDK 사용

Python용 MCP SDK를 사용하여 MCP 서버와 직접 통신할 수 있습니다.

```bash
pip install mcp
```

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def call_mcp_figma_metadata(node_id: Optional[str] = None):
    # MCP 서버 설정 (실제 설정으로 변경 필요)
    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@modelcontextprotocol/server-figma"]
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            result = await session.call_tool(
                "mcp_Figma_Desktop_get_metadata",
                arguments={"nodeId": node_id} if node_id else {}
            )
            return result
```

## 방법 2: Cursor에서 직접 MCP 호출 후 결과 전달

가장 간단한 방법은 Cursor에서 직접 MCP를 호출하고, 그 결과를 Python 백엔드로 전달하는 것입니다.

1. Cursor에서 MCP 도구를 사용하여 Figma 데이터 가져오기
2. 결과를 파일이나 데이터베이스에 저장
3. Python 백엔드가 해당 데이터를 읽어서 API로 제공

## 방법 3: WebSocket을 통한 실시간 통신

Python 백엔드와 Cursor 간에 WebSocket 연결을 설정하여 실시간으로 MCP 호출 결과를 전달할 수 있습니다.

## 구현 예시

`backend/mcp_client.py` 파일을 업데이트하여 실제 MCP 호출을 구현하세요:

```python
from mcp_client import mcp_client

# main.py에서 사용
@app.get("/api/figma/metadata")
async def get_figma_metadata(nodeId: Optional[str] = None):
    try:
        result = await mcp_client.get_metadata(nodeId)
        return {"node": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 참고 자료

- [Model Context Protocol 문서](https://modelcontextprotocol.io/)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Figma Desktop MCP 서버](https://github.com/modelcontextprotocol/servers/tree/main/src/figma)



