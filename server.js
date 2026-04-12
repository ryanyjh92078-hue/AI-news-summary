const express = require('express');
const { Client } = require('pg');
const { exec } = require('child_process');
const app = express();

app.use(express.static('public'));

// 수집 실행 주소: /admin/collect
app.get('/admin/collect', (req, res) => {
    exec('node collect.js', (err, stdout) => {
        if (err) return res.status(500).send("실패: " + err.message);
        res.send("<h1>수집 완료!</h1><a href='/'>홈으로 가기</a>");
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
