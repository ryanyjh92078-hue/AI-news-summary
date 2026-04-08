const express = require('express');
const { Client } = require('pg');
const { exec } = require('child_process');
const app = express();

app.use(express.static('public'));

// [실전용] 관리자 주소 호출 시 뉴스 수집 실행
app.get('/admin/collect', (req, res) => {
    exec('node collect.js', (err, stdout) => {
        if (err) return res.status(500).send("에러: " + err.message);
        res.send("<h1>뉴스 수집 완료!</h1><a href='/'>홈으로 가기</a>");
    });
});

// 뉴스 목록 API
app.get('/api/news', async (req, res) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const result = await client.query('SELECT * FROM news ORDER BY id DESC LIMIT 20');
    await client.end();
    res.json(result.rows);
});

// 뉴스 상세 API
app.get('/api/news/:id', async (req, res) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const result = await client.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
    await client.end();
    res.json(result.rows[0]);
});

app.listen(process.env.PORT || 3000);
