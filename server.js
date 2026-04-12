const express = require('express');
const { Client } = require('pg');
const { exec } = require('child_process');
const app = express();

app.use(express.static('public'));

// 수집 실행 주소: /admin/collect
// server.js의 app.get('/admin/collect', ...) 부분을 이 코드로 교체하세요.
app.get('/admin/collect', (req, res) => {
    console.log("뉴스 수집 명령 수신됨...");
    
    const { exec } = require('child_process');
    // 명령 실행 후 결과(stdout)와 에러(stderr)를 모두 가로챕니다.
    exec('node collect.js', (err, stdout, stderr) => {
        if (err) {
            console.error(`실행 에러: ${err.message}`);
            return res.status(500).send(`
                <div style="padding:20px; border:1px solid red; font-family:monospace;">
                    <h2>❌ 실행 에러 발생</h2>
                    <p>${err.message}</p>
                    <hr>
                    <h3>로그 정보 (stderr):</h3>
                    <pre style="background:#f4f4f4; pading:10px;">${stderr}</pre>
                </div>
            `);
        }
        
        console.log(`수집 완료: ${stdout}`);
        res.send(`
            <div style="padding:20px; border:1px solid green; font-family:monospace;">
                <h2>✅ 명령 실행 시도 완료</h2>
                <h3>출력 메시지 (stdout):</h3>
                <pre style="background:#f4f4f4; padding:10px;">${stdout || "메시지가 없습니다. 코드를 확인하세요."}</pre>
                <hr>
                <p>위 메시지에 '모든 뉴스 처리 완료'가 떠야 성공입니다.</p>
                <a href="/">홈으로 돌아가기</a>
            </div>
        `);
    });
});

// 뉴스 목록 API
app.get('/api/news', async (req, res) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM news ORDER BY id DESC LIMIT 20');
        res.json(result.rows);
    } finally {
        await client.end();
    }
});

// 뉴스 상세 API
app.get('/api/news/:id', async (req, res) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } finally {
        await client.end();
    }
});

app.listen(process.env.PORT || 3000, () => console.log("서버 러닝 중..."));
