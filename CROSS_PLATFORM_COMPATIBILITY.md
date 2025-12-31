# macOS/Windows 크로스 플랫폼 호환성 가이드

현재 코드는 macOS와 Windows 간 호환성이 좋지만, 몇 가지 확인해야 할 사항이 있습니다.

## ✅ 문제 없는 부분

1. **환경 변수 (.env 파일)**
   - `python-dotenv` 라이브러리가 OS 간 호환성 자동 처리
   - 줄바꿈 문자 (LF/CRLF) 자동 처리
   - 경로 구분자 자동 처리

2. **데이터베이스 연결**
   - `asyncpg`는 OS 간 호환성 좋음
   - IP 주소나 호스트명 사용 시 OS와 무관

3. **파일 경로**
   - `StaticFiles(directory="backend/static")` - 상대 경로 사용
   - `Jinja2Templates(directory="backend/templates")` - 상대 경로 사용
   - FastAPI/Jinja2가 OS별 경로 구분자 자동 처리

## ⚠️ 주의해야 할 부분

### 1. .env 파일의 줄바꿈 문자

**문제:**
- macOS/Linux: LF (`\n`)
- Windows: CRLF (`\r\n`)
- Git에서 파일을 복사할 때 줄바꿈이 변경될 수 있음

**해결책:**
- `python-dotenv`가 자동으로 처리하므로 일반적으로 문제 없음
- Git 설정: `.gitattributes` 파일에 설정 추가 권장

### 2. PostgreSQL 연결 설정

**Windows에서 DB_HOST 확인:**
- `localhost` vs `127.0.0.1`
- 일부 Windows 환경에서는 `localhost`가 느리거나 문제가 될 수 있음

**권장 설정:**
```env
# macOS/Windows 모두에서 작동
DB_HOST=127.0.0.1  # localhost 대신 IP 사용
# 또는
DB_HOST=192.168.x.x  # 다른 컴퓨터의 DB 사용 시
```

### 3. 포트 및 방화벽

**Windows 방화벽:**
- PostgreSQL 포트(5433)가 열려있는지 확인
- Windows Defender 방화벽 설정 확인

**확인 방법 (Windows):**
```powershell
# 포트 확인
netstat -an | findstr 5433

# 방화벽 규칙 확인
netsh advfirewall firewall show rule name=all | findstr 5433
```

### 4. Python 경로 및 가상환경

**가상환경 경로:**
- macOS: `venv/bin/activate`
- Windows: `venv\Scripts\activate`

**코드에는 영향 없음** (가상환경 활성화만 다름)

### 5. 파일 권한

**Unix 계열 (macOS/Linux) vs Windows:**
- 일반적으로 Python 코드 실행에는 문제 없음
- 파일 읽기/쓰기 권한 문제는 드묾

## 📋 체크리스트

### macOS에서 Windows로 코드 이동 시:

- [ ] `.env` 파일의 `DB_HOST` 확인 (localhost vs IP)
- [ ] PostgreSQL 포트 방화벽 설정 확인
- [ ] Python 가상환경 재생성 (선택사항, 권장)
- [ ] `pip install -r requirements.txt` 실행

### Windows에서 실행 시:

- [ ] `backend/` 디렉토리에서 `.env` 파일 존재 확인
- [ ] PostgreSQL 서비스 실행 중인지 확인
- [ ] 포트 5433 (또는 설정한 포트) 열려있는지 확인
- [ ] 네트워크 프로필 (Private/Public) 확인

## 🔧 문제 해결

### "Connection refused" 에러:

1. **DB_HOST 확인:**
   ```env
   # Windows에서도 작동하도록
   DB_HOST=127.0.0.1
   ```

2. **PostgreSQL 서비스 확인 (Windows):**
   ```powershell
   # 서비스 상태 확인
   Get-Service postgresql*

   # 서비스 시작
   Start-Service postgresql*
   ```

3. **포트 확인:**
   ```powershell
   # Windows
   netstat -an | findstr 5433
   
   # macOS
   lsof -i :5433
   ```

### .env 파일이 읽히지 않을 때:

1. **파일 위치 확인:**
   - `.env` 파일이 `backend/` 디렉토리에 있어야 함
   - 또는 프로젝트 루트에 있어야 함 (`load_dotenv()`가 상위 디렉토리도 검색)

2. **파일 인코딩 확인:**
   - UTF-8 인코딩 사용
   - BOM 없이 저장

3. **줄바꿈 문자 확인:**
   - Git에서 체크아웃 시 자동 변환될 수 있음
   - 일반적으로 `python-dotenv`가 자동 처리

## 💡 권장 사항

1. **.gitattributes 파일 추가 (선택사항):**
   ```
   *.env text eol=lf
   ```

2. **DB_HOST는 IP 주소 사용:**
   ```env
   DB_HOST=127.0.0.1  # localhost 대신
   ```

3. **환경별 .env.example 제공:**
   ```
   DB_HOST=your_db_host
   DB_PORT=5433
   DB_USER=postgres
   DB_PASS=your_password
   DB_NAME=moneycoach_db
   ```

## 결론

현재 코드는 macOS와 Windows 간 호환성이 좋습니다. 주요 차이점은:
- 가상환경 활성화 명령어 (`bin/activate` vs `Scripts\activate`)
- 방화벽 설정 방법
- PostgreSQL 서비스 관리 방법

코드 자체는 OS 간 문제 없이 작동합니다!

