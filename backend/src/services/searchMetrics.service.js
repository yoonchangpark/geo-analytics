import crypto from 'crypto';
import axios from 'axios';

function generateSignature(timestamp, method, path, secretKey) {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(`${timestamp}.${method}.${path}`);
  return hmac.digest('base64');
}

function fallbackSearchData(targetBrands) {
  const metrics = {};
  targetBrands.forEach((brand) => {
    metrics[brand] = {
      searchVolume: 0,
      pc: 0,
      mobile: 0,
      docCount: 0
    };
  });
  return metrics;
}

export async function getRealSearchMetrics(keyword, targetBrands) {
  // 대표님 자동 배포를 위한 임시 하드코딩 (Render에서 Environment Variable 설정을 건너뛰기 위함)
  const API_KEY = process.env.NAVER_AD_API_KEY || '0100000000b7be9b0a3ddf6d1b056a2ac910a21e22c08445385f5362c701896db0537b3704';
  const SECRET_KEY = process.env.NAVER_AD_SECRET_KEY || 'AQAAAAC3vpsKPd9tGwVqKskQoh4iYsDYLCpMrla9Gwbidzwp+A==';
  const CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID || '4342542';
  
  if (!API_KEY || !SECRET_KEY) {
     console.log("[Search API] No Naver credentials found. Falling back to local data map.");
     return fallbackSearchData(targetBrands);
  }

  const metrics = {};
  try {
     
     // Naver keywordstool supports up to 5 keywords per request. We slice array into chunks of 5.
     for (let i = 0; i < targetBrands.length; i += 5) {
       const chunk = targetBrands.slice(i, i + 5);
       const timestamp = Date.now().toString();
       const path = '/keywordstool';
       const method = 'GET';
       const queryParam = `?hintKeywords=${encodeURIComponent(chunk.join(','))}&showDetail=1`;
       
       const signature = generateSignature(timestamp, method, path, SECRET_KEY);

       const res = await axios.get(`https://api.naver.com${path}${queryParam}`, {
          headers: {
             'X-Timestamp': timestamp,
             'X-API-KEY': API_KEY,
             'X-Customer': CUSTOMER_ID,
             'X-Signature': signature
          }
       });

       const kwdList = res.data.keywordList || [];
       kwdList.forEach(k => {
           // 네이버 검색수는 '< 10' 으로 내려오는 경우가 있어 방어코드 추가
           const mobile = typeof k.monthlyMobileQcCnt === 'string' ? 10 : (k.monthlyMobileQcCnt || 0);
           const pc = typeof k.monthlyPcQcCnt === 'string' ? 10 : (k.monthlyPcQcCnt || 0);
           const total = mobile + pc;
           
           // API는 공백을 없앤 키워드를 내려주기도 함
           const matchedBrand = chunk.find(b => b.replace(/\s/g, '').toLowerCase() === k.relKeyword.toLowerCase());
           
           if (matchedBrand) {
              metrics[matchedBrand] = {
                 searchVolume: total,
                 pc: pc,
                 mobile: mobile,
                 docCount: (k.monthlyMobileClkCnt || 0) + (k.monthlyPcClkCnt || 0) // 임시 문서 건수 대용 지표
              };
           }
       });
     }
     
     // 추출되지 못한 브랜드의 경우 0 처리 방어
     targetBrands.forEach(b => {
        if (!metrics[b]) {
           metrics[b] = { searchVolume: 0, pc: 0, mobile: 0, docCount: 0 };
        }
     });

     console.log("[Search API] Successfully fetched from Naver Ads.");
     return metrics;

  } catch(err) {
      console.error("[Search API Error]", err.message);
      return fallbackSearchData(targetBrands);
  }
}
