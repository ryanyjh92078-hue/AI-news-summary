const GEMINI_API_KEY = 'AIzaSyDvzVT0cuncXo49fbGRGPLXycYPdcvZ8lk';
const NAVER_CLIENT_ID = '9sUJnKpjJHiBu5F6LRPE';
const NAVER_CLIENT_SECRET = 'fGJfW1jbwh';

// 1. 네이버에서 뉴스 가져오기
async function fetchNews() {
    const url = 'https://openapi.naver.com/v1/search/news.json?query=IT신기술&display=1'; // 테스트용으로 1개만
    const response = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
        }
    });
    const data = await response.json();
    return data.items[0]; // 가장 최신 뉴스 1개 반환
}

// 2. Gemini AI에게 요약 요청하기
async function summarizeNews(newsItem) {
    const genAI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // AI에게 줄 명령(Prompt) 설계
    const prompt = `
        다음 뉴스 기사의 제목과 내용을 바탕으로 개발자들이 읽기 좋게 딱 3줄로 요약해줘.
        형식은 반드시 "- 내용" 형태의 리스트로 작성해.
        
        제목: ${newsItem.title.replace(/<[^>]*>?/gm, '')}
        내용: ${newsItem.description.replace(/<[^>]*>?/gm, '')}
    `;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    try {
        const response = await fetch(genAI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        const summary = result.candidates[0].content.parts[0].text;
        
        console.log("=== AI 요약 결과 ===");
        console.log(summary);
        return summary;

    } catch (error) {
        console.error("요약 실패:", error);
    }
}

// 3. 실행 프로세스
async function start() {
    const news = await fetchNews();
    if (news) {
        console.log(`원본 제목: ${news.title.replace(/<[^>]*>?/gm, '')}`);
        await summarizeNews(news);
    }
}

start();
