import puppeteer from 'puppeteer';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('FastcupScraper');

export interface FastcupData {
  fastcupId: string;
  skill: number;
  level: string; // S, A, B, etc.
}

export async function scrapeFastcupProfile(url: string): Promise<FastcupData> {
  if (!url || !url.includes('cs.fastcup.net/')) {
    throw new Error('Invalid Fastcup URL format');
  }
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1] || '';
  // `id12345` ise `12345` al, değilse (custom URL) direkt `asyte` olarak sakla.
  const fastcupId = lastPart.startsWith('id') && !isNaN(Number(lastPart.replace('id', ''))) 
    ? lastPart.replace('id', '') 
    : lastPart;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Block unnecessary resources to speed up load
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Go to the profile page
    await page.goto(`https://cs.fastcup.net/id${fastcupId}`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Evaluate the page content to find Rank and Skill
    const data = await page.evaluate(() => {
      let skill = 1000;
      let level = 'E';

      // @ts-ignore
      const allElements = Array.from(document.querySelectorAll('div, span, p'));
      
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i] as any;
        const text = (el.textContent || '').trim();
        
        // Search for skill points (Fastcup usually shows it clearly next to Rank or Skill label)
        if (text.match(/^(?:Skill|Rating|Скилл)[\s:]*\d{3,4}$/i) || text.match(/^\d{3,4}$/)) {
          const sMatch = text.match(/(\d{3,4})/);
          if (sMatch) skill = parseInt(sMatch[1], 10);
        }
        
        // Search for Rank letter (S, A, B, C, D, E, F, G)
        // Usually inside a badge or distinct class
        if (text.match(/^(S|A|B|C|D|E|F|G)$/i) && typeof el.className === 'string' && el.className.toLowerCase().includes('rank')) {
          level = text.toUpperCase();
        }
      }
      return { skill, level };
    });
    
    return {
      fastcupId,
      skill: data.skill,
      level: data.level || 'E'
    };

  } catch (error) {
    logger.error(`Error scraping fastcup for ${url}:`, error);
    throw new Error('Failed to scrape Fastcup data. Please check if the URL is correct or try again later.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
