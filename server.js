const express = require('express');
const { Client } = require('pg');
const { exec } = require('child_process');
const path = require('path');
const app = express();

// 정적 파일(HTML) 서비스
app.use(express.static('public'));

/**
 * 1. 관리자용 뉴스 수집 실행 (502 에러 방지 버전)
 * 주소: /admin/collect
 */
app.get('/admin/collect', (req, res) => {
    console.log("뉴스 수집 명령 수신됨. 백그라운드 작업을 시작합니다...");

    // [중요] 502 에러 방지: 사용자에게 먼저 응답을 보내고 연결을 유지하지 않습니다.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
        <div style="padding: 20px; font-family: sans-serif; line-height: 1.6;">
            <h2>🚀 뉴스 수집 및 AI 요약을 시작했습니다.</h2>
            <p>서버가 백그라운드에서 네이버 뉴스를 가져와 Gemini로 요약 중입니다.</p>
            <p style="color: blue;"><b>약 30초~1분 뒤에 아래 버튼을 눌러 홈으로 가보세요.</b></p>
            <br>
            <a href="/" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">홈으로 가기</a>
        </div>
    `);

    // 응답을 보낸 후, 서버 내부에서 조용히 실행
    exec('node collect.js', (err, stdout, stderr) => {
        if (err) {
            console.error(`[수집기 실행 실패]: ${err.message}`);
            return;
        }
        if (stderr) {
            console.error(`[수집기 경고/에러]: ${stderr}`);
        }
        console.log(`[수집기 결과]:\n${stdout}`);
    });
});

/**
 * 2. 뉴스 목록 API
 * 주소: /api/news
 */
app.get('/api/news', async (req, res) => {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
    });
    
    try {
        await client.connect();
        const result = await client.query('SELECT id, title, summary, created_at FROM news ORDER BY id DESC LIMIT 20');
        res.json(result.rows);
    } catch (err) {
        console.error("DB 목록 호출 에러:", err);
        res.status(500).json({ error: "데이터를 불러오지 못했습니다." });
    } finally {
        await client.end();
    }
});

/**
 * 3. 뉴스 상세 API
 * 주소: /api/news/:id
 */
app.get('/api/news/:id', async (req, res) => {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
    });

    try {
        await client.connect();
        const result = await client.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "뉴스를 찾을 수 없습니다." });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("DB 상세 호출 에러:", err);
        res.status(500).json({ error: "데이터를 불러오지 못했습니다." });
    } finally {
        await client.end();
    }
});

// 서버 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
