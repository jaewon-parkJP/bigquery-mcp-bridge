#!/usr/bin/env node

/**
 * HTTP-to-STDIO Bridge for BigQuery MCP Server
 * 
 * 설계 방향 및 원칙:
 * - 핵심 책임: ChatGPT/Cursor의 STDIO MCP 클라이언트와 Cloud Run HTTP MCP 서버 간 프로토콜 변환
 * - 설계 원칙: 단순성(KISS), 안정성, 투명한 에러 처리
 * - 기술적 고려사항: JSON-RPC 2.0 준수, 비동기 처리, 적절한 타임아웃
 * - 사용 시 고려사항: Node.js 16+ 필요, 네트워크 연결 필수
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// BigQuery MCP 서버 엔드포인트
const MCP_SERVER_URL = 'https://bigquery-mcp-server-70394249237.asia-northeast1.run.app/message';

/**
 * HTTP POST 요청을 통해 MCP 서버에 메시지 전송
 * 
 * @param {Object} message - JSON-RPC 2.0 메시지
 * @returns {Promise<Object>} 서버 응답
 */
function sendMessage(message) {
    return new Promise((resolve, reject) => {
        const url = new URL(MCP_SERVER_URL);
        const postData = JSON.stringify(message);
        
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'BigQuery-MCP-Bridge/1.0.0'
            }
        };

        const protocol = url.protocol === 'https:' ? https : http;
        const req = protocol.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Invalid JSON response: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        // 60초 타임아웃 (BigQuery 쿼리는 시간이 오래 걸릴 수 있음)
        req.setTimeout(60000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.write(postData);
        req.end();
    });
}

/**
 * STDIN에서 JSON-RPC 메시지를 읽고 처리
 * 
 * @param {string} data - 입력 데이터
 */
async function processMessage(data) {
    try {
        const message = JSON.parse(data);
        const response = await sendMessage(message);
        process.stdout.write(JSON.stringify(response) + '\n');
    } catch (error) {
        // 에러 응답을 JSON-RPC 2.0 형식으로 반환
        const errorResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
                code: -32603,
                message: error.message || 'Internal error'
            }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
}

/**
 * 메인 실행 로직
 */
function main() {
    let buffer = '';
    let pendingRequests = 0;

    // STDIN에서 데이터 읽기
    process.stdin.on('data', async (chunk) => {
        buffer += chunk.toString();
        
        // 완전한 JSON 라인들 처리
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 보관
        
        for (const line of lines) {
            if (line.trim()) {
                pendingRequests++;
                try {
                    await processMessage(line.trim());
                } finally {
                    pendingRequests--;
                    
                    // 모든 요청 처리 완료 시 종료 확인
                    if (pendingRequests === 0 && process.stdin.destroyed) {
                        process.exit(0);
                    }
                }
            }
        }
    });

    // STDIN 종료 시 처리
    process.stdin.on('end', () => {
        // 남은 버퍼 처리
        if (buffer.trim()) {
            pendingRequests++;
            processMessage(buffer.trim()).finally(() => {
                pendingRequests--;
                if (pendingRequests === 0) {
                    process.exit(0);
                }
            });
        } else if (pendingRequests === 0) {
            process.exit(0);
        }
    });

    // 에러 처리
    process.stdin.on('error', (error) => {
        console.error('STDIN error:', error);
        process.exit(1);
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}

// 스크립트가 직접 실행될 때만 메인 함수 호출
if (require.main === module) {
    main();
}

module.exports = { sendMessage, processMessage };
