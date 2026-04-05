import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.SCRAPER_API_KEY || '6f33ab61c2582970a9baf3b75d6c1982';
const targetUrl = 'https://smartstore.naver.com/wechik';

async function testProxy() {
    try {
        console.log(`[Proxy Mode] Fetching via ScraperAPI: ${targetUrl}`);
        // Render parameter ensures SPAs/JS-heavy pages execute their scripts
        const proxyUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;
        
        console.log("Sending request. This may take up to 20-30 seconds depending on the proxy location...");
        const response = await axios.get(proxyUrl, { timeout: 60000 });
        
        const $ = cheerio.load(response.data);
        const text = $('body').text().replace(/\s+/g, ' ');
        
        console.log("\n[FETCH SUCCESS]");
        console.log("Extracted text length:", text.length);
        console.log("Preview text:");
        console.log(text.substring(0, 200));
        
        if (text.includes('접속이 불가합니다') || text.includes('security verification')) {
            console.error("WARNING: WAF Block hit even with proxy!");
        } else {
            console.log("Proxy successfully bypassed firewall!");
        }
    } catch(err) {
        console.error("Proxy error:", err.message);
    }
}

testProxy();
