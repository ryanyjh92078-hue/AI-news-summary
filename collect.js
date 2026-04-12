const { Client } = require('pg');

async function runCollector() {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
    });

    try {
        console.log("1. 뉴스 검색 시작...");
        const naverRes = await fetch(`https://openapi.naver.com/v1/search/news.json?query=IT신기술&display=5&sort=date`, {
            headers: { 
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID, 
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET 
            }
        });
        const newsData = await naverRes.json();
        
        if (!newsData.items || newsData.items.length === 0) {
            console.log("뉴스 항목이 없습니다.");
            return;
        }

        await client.connect();
        console.log("2. DB 연결 성공. 요약 시작...");

        for (let item of newsData.items) {
            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
                const aiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: `요약해줘: ${item.description}` }] }] })
                });
                
                const aiData = await aiRes.json();
                if (aiData.candidates && aiData.candidates[0].content) {
                    const summary = aiData.candidates[0].content.parts[0].text;
                    const cleanTitle = item.title.replace(/<[^>]*>?/gm, '');

                    await client.query(
                        `INSERT INTO news (title, summary, origin_url) VALUES ($1, $2, $3) ON CONFLICT (origin_url) DO NOTHING`,
                        [cleanTitle, summary, item.originallink || item.link]
                    );
                    console.log(`✅ 저장: ${cleanTitle.substring(0, 10)}...`);
                }
            } catch (e) {
                console.error("항목 처리 중 건너뜀:", e.message);
            }
        }
        console.log("🏁 모든 뉴스 처리 완료!");
    } catch (err) {
        console.error("❌ 치명적 에러:", err.message);
    } finally {
        await client.end().catch(() => {});
    }
}
runCollector();
