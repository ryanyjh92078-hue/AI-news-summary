const express = require('express');
const { Client } = require('pg');
const { exec } = require('child_process');
const app = express();

app.use(express.static('public'));

// 수집 실행 주소: /admin/collect
app.get('/admin/collect', (req, res) => {
    // 결과를 화면에 바로 출력하도록 수정
    exec('node collect.js', (err, stdout, stderr) => {
        if (err) {
            return res.status(500).send(`<h1>❌ 에러 발생</h1><pre>${err.message}</pre>`);
        }
        res.send(`<h1>📊 수집 결과</h1><pre>${stdout}</pre><p>이 내용이 비어있다면 API 설정을 확인하세요.</p><a href='/'>홈으로 가기</a>`);
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
