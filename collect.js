const { Client } = require('pg');

async function runCollector() {
    const NAVER_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_SECRET = process.env.NAVER_CLIENT_SECRET;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const DB_URL = process.env.DATABASE_URL;

    try {
        // 1. 네이버 뉴스 가져오기
        const naverRes = await fetch(`https://openapi.naver.com/v1/search/news.json?query=IT신기술&display=5`, {
            headers: { 'X-Naver-Client-Id': NAVER_ID, 'X-Naver-Client-Secret': NAVER_SECRET }
        });
        const newsData = await naverRes.json();

        const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();

        for (let item of newsData.items) {
            // 2. Gemini AI 요약
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
            const prompt = `다음 뉴스를 개발자 관점에서 핵심만 3줄 요약해줘. 형식은 "- 내용" 리스트로 해줘.\n제목: ${item.title}\n내용: ${item.description}`;
            
            const aiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const aiData = await aiRes.json();
            const summary = aiData.candidates[0].content.parts[0].text;

            // 3. Neon DB 저장 (중복 링크는 무시)
            const sql = `INSERT INTO news (title, summary, origin_url) VALUES ($1, $2, $3) ON CONFLICT (origin_url) DO NOTHING`;
            await client.query(sql, [item.title.replace(/<[^>]*>?/gm, ''), summary, item.originallink || item.link]);
        }
        await client.end();
        console.log("✅ 뉴스 수집 및 AI 요약 완료!");
    } catch (err) {
        console.error("❌ 작업 중 에러:", err);
    }
}
runCollector();
