const { Client } = require('pg');

async function runCollector() {
    const NAVER_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_SECRET = process.env.NAVER_CLIENT_SECRET;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const DB_URL = process.env.DATABASE_URL;

    // DB 클라이언트를 루프 밖에서 한 번만 생성
    const client = new Client({ 
        connectionString: DB_URL, 
        ssl: { rejectUnauthorized: false } 
    });

    try {
        console.log("1. 네이버 뉴스 수집 시작...");
        const naverRes = await fetch(`https://openapi.naver.com/v1/search/news.json?query=IT신기술&display=5`, {
            headers: { 'X-Naver-Client-Id': NAVER_ID, 'X-Naver-Client-Secret': NAVER_SECRET }
        });
        const newsData = await naverRes.json();

        if (!newsData.items || newsData.items.length === 0) {
            console.log("뉴스 데이터가 없습니다.");
            return;
        }

        await client.connect();

        for (let item of newsData.items) {
            try {
                console.log(`요약 중: ${item.title.substring(0, 20)}...`);
                
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
                const aiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: `다음 뉴스를 핵심만 3줄 요약해줘: ${item.description}` }] }] })
                });
                
                const aiData = await aiRes.json();
                
                // [에러 방지] AI 응답값이 정상인지 체크
                if (!aiData.candidates || !aiData.candidates[0].content) {
                    console.log("⚠️ AI 요약 실패 (응답 없음), 스킵합니다.");
                    continue; 
                }

                const summary = aiData.candidates[0].content.parts[0].text;

                const sql = `INSERT INTO news (title, summary, origin_url) VALUES ($1, $2, $3) ON CONFLICT (origin_url) DO NOTHING`;
                await client.query(sql, [item.title.replace(/<[^>]*>?/gm, ''), summary, item.originallink || item.link]);
                
            } catch (itemError) {
                console.error("이 뉴스 처리 중 에러 발생:", itemError.message);
                // 개별 뉴스 에러 시 다음 뉴스로 넘어감
            }
        }
        console.log("✅ 모든 작업 완료!");
    } catch (err) {
        console.error("❌ 전체 프로세스 에러:", err);
    } finally {
        await client.end().catch(() => {}); // 안전하게 DB 닫기
    }
}

runCollector();
