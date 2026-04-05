const express = require('express');
const { Client } = require('pg');
const path = require('path');
const app = express();

app.use(express.static('public'));

// API: 전체 뉴스 목록 가져오기
app.get('/api/news', async (req, res) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM news ORDER BY id DESC LIMIT 20');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await client.end();
    }
});

// API: 특정 ID 뉴스 상세 가져오기
app.get('/api/news/:id', async (req, res) => {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await client.end();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` 서버 가동 중: 포트 ${PORT}`));
