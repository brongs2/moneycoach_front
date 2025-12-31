# PostgreSQL 외부 연결 설정 가이드

다른 컴퓨터의 PostgreSQL 데이터베이스에 접근하려면 다음 설정이 필요합니다.

## 1. PostgreSQL 서버 설정 (DB가 있는 컴퓨터에서)

### 1-1. `postgresql.conf` 파일 수정

PostgreSQL 설정 파일을 찾아서 수정합니다:

**Linux/macOS:**
```bash
# 설정 파일 위치 찾기
psql -U postgres -c "SHOW config_file;"

# 또는 일반적인 위치:
# /etc/postgresql/[version]/main/postgresql.conf
# /usr/local/var/postgres/postgresql.conf
# ~/Library/Application Support/PostgreSQL/[version]/postgresql.conf
```

**설정 변경:**
```conf
# 외부 연결 허용
listen_addresses = '*'  # 또는 특정 IP 주소
port = 5433
```

### 1-2. `pg_hba.conf` 파일 수정

인증 설정 파일을 찾아서 수정합니다:

**Linux/macOS:**
```bash
# 인증 파일 위치 찾기
psql -U postgres -c "SHOW hba_file;"
```

**설정 추가:**
```conf
# IPv4 외부 연결 허용
host    all             all             0.0.0.0/0               md5
# 또는 특정 IP 대역만 허용 (더 안전)
host    all             all             192.168.0.0/16          md5
```

### 1-3. PostgreSQL 재시작

설정 변경 후 PostgreSQL을 재시작해야 합니다:

**macOS (Homebrew):**
```bash
brew services restart postgresql@[version]
# 또는
pg_ctl -D /usr/local/var/postgres restart
```

**Linux:**
```bash
sudo systemctl restart postgresql
# 또는
sudo service postgresql restart
```

## 2. 방화벽 설정 (DB가 있는 컴퓨터)

포트 5433이 열려있는지 확인합니다:

**macOS:**
```bash
# 방화벽 상태 확인
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# 포트 열기 (필요시)
# 시스템 설정 > 네트워크 > 방화벽 > 옵션에서 PostgreSQL 허용
```

**Linux:**
```bash
# UFW 사용 시
sudo ufw allow 5433/tcp

# firewalld 사용 시
sudo firewall-cmd --add-port=5433/tcp --permanent
sudo firewall-cmd --reload
```

## 3. .env 파일 설정 (클라이언트 컴퓨터)

프로젝트 루트의 `.env` 파일을 수정합니다:

```env
DB_HOST=192.168.x.x  # DB 서버의 실제 IP 주소
DB_PORT=5433
DB_USER=postgres
DB_PASS=eig49894
DB_NAME=moneycoach_db
```

## 4. 연결 테스트

클라이언트 컴퓨터에서 연결을 테스트합니다:

```bash
# PostgreSQL 클라이언트가 설치되어 있는 경우
psql -h 192.168.x.x -p 5433 -U postgres -d moneycoach_db

# 또는 Python으로 테스트
python3 -c "
import asyncio
import asyncpg

async def test():
    conn = await asyncpg.connect(
        host='192.168.x.x',
        port=5433,
        user='postgres',
        password='eig49894',
        database='moneycoach_db'
    )
    print('연결 성공!')
    await conn.close()

asyncio.run(test())
"
```

## 5. 문제 해결

### 연결이 안 되는 경우:

1. **IP 주소 확인**
   ```bash
   # DB 서버에서 IP 주소 확인
   ifconfig  # macOS/Linux
   ipconfig  # Windows
   ```

2. **포트 확인**
   ```bash
   # DB 서버에서 PostgreSQL이 해당 포트에서 리스닝 중인지 확인
   netstat -an | grep 5433  # macOS/Linux
   netstat -an | findstr 5433  # Windows
   ```

3. **에러 로그 확인**
   - PostgreSQL 로그 파일 확인
   - 백엔드 서버 콘솔에서 에러 메시지 확인

4. **네트워크 연결 확인**
   ```bash
   # 클라이언트에서 서버로 ping
   ping 192.168.x.x
   
   # 포트 접근 확인
   telnet 192.168.x.x 5433
   # 또는
   nc -zv 192.168.x.x 5433
   ```

## 보안 참고사항

- 프로덕션 환경에서는 `0.0.0.0/0` 대신 특정 IP 대역만 허용하세요
- 비밀번호는 강력하게 설정하세요
- 가능하면 SSH 터널링을 사용하는 것이 더 안전합니다

