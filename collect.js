const { Client } = require('pg');

async function runCollector() {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
    });

    try {
        console.log("1. 뉴스 데이터 가져오는 중...");
        const naverRes = await fetch(`https://openapi.naver.com/v1/search/news.json?query=IT신기술&display=8`, {
            headers: { 
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID, 
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET 
            }
        });
        const newsData = await naverRes.json();

        if (!newsData.items) throw new Error("네이버 API 응답이 올바르지 않습니다.");

        await client.connect();

        for (let item of newsData.items) {
            try {
                // Gemini AI 요약
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
                const aiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: `다음 IT 뉴스를 핵심만 3줄 요약해줘: ${item.description}` }] }] })
                });
                const aiData = await aiRes.json();
                
                // AI 응답 검증
                if (!aiData.candidates || !aiData.candidates[0].content) continue;

                const summary = aiData.candidates[0].content.parts[0].text;
                const cleanTitle = item.title.replace(/<[^>]*>?/gm, '');

                // DB 저장 (중복 링크 제외)
                const sql = `INSERT INTO news (title, summary, origin_url) VALUES ($1, $2, $3) ON CONFLICT (origin_url) DO NOTHING`;
                await client.query(sql, [cleanTitle, summary, item.originallink || item.link]);
                console.log(`저장 완료: ${cleanTitle.substring(0, 15)}...`);
            } catch (e) {
                console.error("개별 항목 처리 중 에러:", e.message);
            }
        }
        console.log("✅ 모든 뉴스 처리 완료!");
    } catch (err) {
        console.error("❌ 치명적 에러:", err);
    } finally {
        await client.end();
    }
}
runCollector();
