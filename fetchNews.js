// 라이브러리 설치 없이 작성하는 코드
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

async function getITNews() {
    const url = 'https://openapi.naver.com/v1/search/news.json?query=IT&display=10';
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': CLIENT_ID,
                'X-Naver-Client-Secret': CLIENT_SECRET,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`에러 발생: ${response.status}`);
        }

        const data = await response.json();
        
        console.log("--- 가져온 IT 뉴스 ---");
        data.items.forEach((item, index) => {
            console.log(`[${index + 1}] ${item.title.replace(/<[^>]*>?/gm, '')}`);
        });

    } catch (error) {
        console.error("데이터 가져오기 실패:", error);
    }
}

getITNews();
