# 500 에러 해결 가이드

## 문제 확인

백엔드 서버가 실행 중인 **터미널 창**을 확인하세요. 거기에 정확한 에러 메시지가 나타납니다.

## 가능한 원인 및 해결책

### 1. 데이터베이스 연결 실패

**증상:**
- 백엔드 터미널에 "Database connection failed" 메시지
- 또는 asyncpg 관련 에러

**해결:**
```bash
# .env 파일 위치 확인
cd /Users/sunjaelee/Desktop/MoneyCoach/backend
ls -la .env  # 파일이 있는지 확인

# .env 파일 내용 확인
cat .env
```

`.env` 파일이 `backend/` 디렉토리에 있어야 합니다:
```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASS=eig49894
DB_NAME=moneycoach_db
```

### 2. PostgreSQL 서버가 실행되지 않음

**해결:**
```bash
# PostgreSQL이 실행 중인지 확인 (macOS)
brew services list | grep postgresql

# 또는
pg_isready -h localhost -p 5433

# PostgreSQL 시작 (필요한 경우)
brew services start postgresql@[version]
```

### 3. 데이터베이스가 존재하지 않음

**해결:**
```bash
# PostgreSQL에 접속
psql -h localhost -p 5433 -U postgres

# 데이터베이스 생성
CREATE DATABASE moneycoach_db;

# 종료
\q
```

### 4. 테이블이 존재하지 않음

데이터베이스는 있지만 테이블(savings, investments, assets, debts 등)이 없는 경우:

**해결:**
- 데이터베이스 마이그레이션 스크립트 실행
- 또는 테이블을 수동으로 생성

### 5. 포트 충돌

**해결:**
```bash
# 포트 5433이 사용 중인지 확인
lsof -i :5433

# 또는 PostgreSQL이 다른 포트에서 실행 중인지 확인
ps aux | grep postgres
```

## 빠른 진단 방법

### 1. 백엔드 서버 로그 확인

백엔드 서버를 실행한 터미널에서 에러 메시지를 확인하세요:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 간단한 연결 테스트

새 터미널에서:
```bash
cd /Users/sunjaelee/Desktop/MoneyCoach/backend
python3 << EOF
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    try:
        conn = await asyncpg.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            database=os.getenv("DB_NAME"),
        )
        print("✅ 데이터베이스 연결 성공!")
        await conn.close()
    except Exception as e:
        print(f"❌ 연결 실패: {e}")

asyncio.run(test())
EOF
```

### 3. API 직접 테스트

백엔드 서버가 실행 중일 때:
```bash
# 헬스 체크
curl http://localhost:8000/

# API 테스트 (인증 없이 작동하는 엔드포인트가 있다면)
curl http://localhost:8000/api/...
```

## 일반적인 해결 순서

1. **백엔드 서버 터미널에서 에러 메시지 확인**
2. **PostgreSQL이 실행 중인지 확인**
3. **.env 파일이 올바른 위치에 있고 내용이 맞는지 확인**
4. **데이터베이스가 존재하는지 확인**
5. **테이블이 존재하는지 확인**

## 추가 도움

백엔드 서버 터미널에 나타나는 **정확한 에러 메시지**를 알려주시면 더 구체적으로 도와드릴 수 있습니다!

