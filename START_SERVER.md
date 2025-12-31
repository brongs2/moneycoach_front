# 서버 실행 가이드

## 문제: ECONNREFUSED 에러

터미널에 `ECONNREFUSED` 에러가 나타나는 것은 **백엔드 서버가 실행되지 않았기 때문**입니다.

프론트엔드는 실행 중이지만, 백엔드 서버(`localhost:8000`)에 연결할 수 없습니다.

## 해결 방법

### 1. 백엔드 서버 실행

**새 터미널 창을 열고** 다음 명령어를 실행하세요:

```bash
# 프로젝트 루트로 이동
cd /Users/sunjaelee/Desktop/MoneyCoach

# 백엔드 디렉토리로 이동
cd backend

# 가상환경 활성화 (사용 중인 경우)
# source venv/bin/activate  # macOS/Linux
# 또는
# venv\Scripts\activate  # Windows

# 필요한 패키지 설치 (처음 한 번만)
pip install -r requirements.txt

# uvicorn 설치 (없는 경우)
pip install uvicorn

# FastAPI 서버 실행
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

또는 Python 모듈로 직접 실행:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 서버 실행 확인

백엔드 서버가 성공적으로 실행되면 다음과 같은 메시지가 나타납니다:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 3. 두 터미널 동시 실행

**터미널 1 (백엔드):**
```bash
cd /Users/sunjaelee/Desktop/MoneyCoach/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**터미널 2 (프론트엔드):**
```bash
cd /Users/sunjaelee/Desktop/MoneyCoach/frontend
npm run dev
```

### 4. 접속 확인

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 주의사항

1. **백엔드를 먼저 실행**: 프론트엔드보다 백엔드를 먼저 실행하는 것이 좋습니다.

2. **포트 충돌**: 
   - 포트 8000이 이미 사용 중이면 다른 포트 사용: `--port 8001`
   - `vite.config.ts`의 proxy target도 함께 변경 필요

3. **데이터베이스 연결**: 
   - 백엔드 서버가 시작될 때 `.env` 파일의 DB 설정을 확인합니다.
   - DB 연결 실패 시 서버는 시작되지만 API 요청이 실패할 수 있습니다.

4. **재시작**: 
   - 코드 변경 후 백엔드를 재시작해야 할 수도 있습니다.
   - `--reload` 플래그를 사용하면 자동 재시작됩니다.

## 트러블슈팅

### "uvicorn: command not found"
```bash
pip install uvicorn
```

### "Module not found" 에러
```bash
# 가상환경 활성화 확인
# requirements.txt의 모든 패키지 설치 확인
pip install -r requirements.txt
```

### 포트 8000이 이미 사용 중
```bash
# 다른 포트 사용
uvicorn main:app --reload --port 8001
```

### DB 연결 에러
- `.env` 파일이 `backend/` 디렉토리에 있는지 확인
- DB 서버가 실행 중인지 확인
- DB 연결 정보가 올바른지 확인

