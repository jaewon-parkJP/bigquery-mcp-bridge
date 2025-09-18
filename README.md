# 🌉 BigQuery MCP Bridge

**ChatGPT Desktop과 BigQuery MCP 서버를 연결하는 브리지**

이 브리지를 사용하면 ChatGPT Desktop 앱에서 자연어로 BigQuery 데이터를 조회하고 분석할 수 있습니다.

## 🚀 빠른 시작

### 1단계: ChatGPT Desktop 설치
- https://openai.com/chatgpt/desktop/ 에서 다운로드
- ChatGPT Plus 구독 필요

### 2단계: 브리지 파일 다운로드

**Windows (PowerShell):**
```powershell
cd $env:USERPROFILE\Documents
mkdir bigquery-chatgpt
cd bigquery-chatgpt
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-username/bigquery-mcp-bridge/main/http-to-stdio-bridge.js" -OutFile "http-to-stdio-bridge.js"
```

**Mac (Terminal):**
```bash
cd ~/Documents
mkdir bigquery-chatgpt
cd bigquery-chatgpt
curl -o http-to-stdio-bridge.js https://raw.githubusercontent.com/your-username/bigquery-mcp-bridge/main/http-to-stdio-bridge.js
chmod +x http-to-stdio-bridge.js
```

### 3단계: ChatGPT MCP 설정

**Windows:**
```powershell
mkdir "$env:APPDATA\OpenAI\ChatGPT" -Force
@"
{
  "mcpServers": {
    "bigquery": {
      "command": "node",
      "args": [
        "$($env:USERPROFILE)\\Documents\\bigquery-chatgpt\\http-to-stdio-bridge.js"
      ],
      "cwd": "$($env:USERPROFILE)\\Documents\\bigquery-chatgpt",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
"@ | Out-File -FilePath "$env:APPDATA\OpenAI\ChatGPT\mcp_servers.json" -Encoding utf8
```

**Mac:**
```bash
mkdir -p ~/Library/Application\ Support/OpenAI/ChatGPT
cat > ~/Library/Application\ Support/OpenAI/ChatGPT/mcp_servers.json << 'EOF'
{
  "mcpServers": {
    "bigquery": {
      "command": "node",
      "args": [
        "~/Documents/bigquery-chatgpt/http-to-stdio-bridge.js"
      ],
      "cwd": "~/Documents/bigquery-chatgpt",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
```

### 4단계: ChatGPT Desktop 재시작 및 테스트

ChatGPT Desktop을 재시작한 후:

```
BigQuery 서버 상태를 확인해줘
```

## 🎯 사용 예시

```
"BigQuery에 어떤 데이터가 있는지 알려줘"
"리뷰 관련 테이블을 찾아줘"
"최근 거부된 리뷰들의 통계를 보여줘"
"평균 연봉이 높은 상위 10개 회사를 찾아줘"
```

## 🛠️ 기술 세부사항

### 아키텍처
```
ChatGPT Desktop ↔ http-to-stdio-bridge.js ↔ BigQuery MCP Server ↔ BigQuery
     (STDIO)              (Node.js)              (HTTP/JSON-RPC)      (SQL)
```

### 지원 기능
- 📊 **데이터 탐색**: 61개 데이터셋, 1000+ 테이블
- 🔍 **자연어 쿼리**: "최근 리뷰 통계" → SQL 자동 생성
- ⚡ **실시간 실행**: 쿼리 실행 및 결과 분석
- 🔒 **보안**: 읽기 전용, 비용 제어

### 요구사항
- Node.js 16.0.0+
- ChatGPT Plus 구독
- 인터넷 연결

## 🚨 문제 해결

### "MCP 서버를 찾을 수 없습니다"
1. Node.js 설치 확인: `node --version`
2. 파일 경로 확인
3. ChatGPT Desktop 재시작

### "연결 시간 초과"
1. 인터넷 연결 확인
2. 브리지 파일 재다운로드
3. 방화벽/프록시 설정 확인

## 📄 라이선스

MIT License

## 🤝 기여하기

이슈나 개선사항이 있으시면 GitHub Issues를 통해 알려주세요!

---

**Happy Querying with ChatGPT!** 🚀
