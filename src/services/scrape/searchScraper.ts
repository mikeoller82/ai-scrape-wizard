
import { ScrapeConfig, BusinessData } from "@/types";
import { AntiBlockingUtils } from "./antiBlocking";
import { extractEmailsFromText, enhanceResultsWithEmails, findContactLinks } from "./emailExtractor";

// Crawl4AI information (for reference only)
const crawl4aiInfo = {
  version: "0.5.1",
  features: [
    "Built for LLMs: Creates smart, concise Markdown optimized for RAG and fine-tuning applications",
    "Lightning Fast: Delivers results 6x faster with real-time, cost-efficient performance",
    "Flexible Browser Control: Offers session management, proxies, and custom hooks for seamless data access",
    "Heuristic Intelligence: Uses advanced algorithms for efficient extraction, reducing reliance on costly models",
    "Open Source & Deployable: Fully open-source with no API keys—ready for Docker and cloud integration",
    "Thriving Community: Actively maintained by a vibrant community and the #1 trending GitHub repository"
  ],
  githubUrl: "https://github.com/unclecode/crawl4ai"
};

/**
 * Build a Google search query from scraping config
 */
export function buildGoogleSearchQuery(config: ScrapeConfig): string {
  let query = config.industry || "businesses";
  
  if (config.location?.city || config.location?.state) {
    query += " in ";
    if (config.location.city) {
      query += config.location.city;
      if (config.location.state) {
        query += ", " + config.location.state;
      }
    } else if (config.location.state) {
      query += config.location.state;
    }
  }
  
  query += " contact email address";
  
  return query;
}

/**
 * Extract business data from Google search results
 */
export function extractBusinessDataFromGoogleSearch(html: string, config: ScrapeConfig): any[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const results = [];
  
  const searchResults = doc.querySelectorAll('div.g');
  
  console.log(`Found ${searchResults.length} Google search results`);
  
  for (let i = 0; i < searchResults.length; i++) {
    const result = searchResults[i];
    const rawHtml = result.outerHTML;
    
    const titleEl = result.querySelector('h3');
    const linkEl = result.querySelector('a');
    const snippetEl = result.querySelector('.VwiC3b');
    
    const title = titleEl ? titleEl.textContent?.trim() : '';
    const link = linkEl ? linkEl.getAttribute('href') : '';
    const snippet = snippetEl ? snippetEl.textContent?.trim() : '';
    
    const businessData: Partial<BusinessData> = {
      name: title || 'Unknown',
      website: link || '',
      description: snippet || '',
      industry: config.industry || '',
    };
    
    if (snippet) {
      const emails = extractEmailsFromText(snippet);
      if (emails.length > 0) {
        businessData.email = emails[0];
      }
    }
    
    if (config.location?.city) {
      businessData.city = config.location.city;
    }
    if (config.location?.state) {
      businessData.state = config.location.state;
    }
    
    results.push({
      rawHtml,
      extractedData: businessData,
      url: link
    });
  }
  
  return results;
}

/**
 * Extract data from alternative search engine results
 */
export function extractBusinessDataFromAlternativeSearch(html: string, config: ScrapeConfig): any[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const results = [];
  
  // DuckDuckGo HTML structure
  const searchResults = doc.querySelectorAll('.result');
  
  console.log(`Found ${searchResults.length} alternative search results`);
  
  for (let i = 0; i < searchResults.length; i++) {
    const result = searchResults[i];
    const rawHtml = result.outerHTML;
    
    const titleEl = result.querySelector('.result__title');
    const linkEl = result.querySelector('.result__url');
    const snippetEl = result.querySelector('.result__snippet');
    
    const title = titleEl ? titleEl.textContent?.trim() : '';
    const link = linkEl ? linkEl.getAttribute('href') : '';
    const snippet = snippetEl ? snippetEl.textContent?.trim() : '';
    
    const businessData: Partial<BusinessData> = {
      name: title || 'Unknown',
      website: link || '',
      description: snippet || '',
      industry: config.industry || '',
    };
    
    if (snippet) {
      const emails = extractEmailsFromText(snippet);
      if (emails.length > 0) {
        businessData.email = emails[0];
      }
    }
    
    if (config.location?.city) {
      businessData.city = config.location.city;
    }
    if (config.location?.state) {
      businessData.state = config.location.state;
    }
    
    results.push({
      rawHtml,
      extractedData: businessData,
      url: link
    });
  }
  
  return results;
}

/**
 * Scrape data from Google search results
 */
export async function scrapeGoogleSearch(config: ScrapeConfig): Promise<any[]> {
  const searchQuery = buildGoogleSearchQuery(config);
  
  console.log("Using Google search query:", searchQuery);
  
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Using more reliable CORS proxies
  const corsProxies = [
    "https://corsproxy.io/?",
    "https://api.allorigins.win/raw?url=",
    "https://cors-anywhere.herokuapp.com/",
    "https://cors.eu.org/",
    "https://crossorigin.me/",
    "https://crossorigin.kirchner.dev/?url="
  ];
  
  let html = '';
  const googleSearchUrl = `https://www.google.com/search?q=${encodedQuery}&num=100`;
  
  const userAgent = config.useRandomUserAgents 
    ? AntiBlockingUtils.getRandomUserAgent() 
    : "Mozilla/5.0 (compatible; Crawl4AI/0.5.1; +https://github.com/unclecode/crawl4ai)";
  
  const headers = AntiBlockingUtils.getBrowserEmulationHeaders(userAgent);
  
  // Try each CORS proxy until one works
  let proxySuccessful = false;
  for (let i = 0; i < corsProxies.length; i++) {
    try {
      console.log(`Fetching Google search results via CORS proxy ${i+1}: ${corsProxies[i]}${googleSearchUrl}`);
      
      const response = await fetch(`${corsProxies[i]}${googleSearchUrl}`, {
        method: 'GET',
        headers: headers,
      });
      
      if (response.ok) {
        html = await response.text();
        console.log(`Successfully fetched ${html.length} bytes of HTML using proxy ${i+1}`);
        proxySuccessful = true;
        break;
      } else {
        console.warn(`Proxy ${i+1} failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error with proxy ${i+1}:`, error);
    }
  }
  
  if (!proxySuccessful || !html || html.length < 100) {
    console.warn("All proxies failed, attempting direct fetch with CORS mode no-cors");
    try {
      // Try a desperate approach with no-cors mode - this may not get data but is a last resort
      const response = await fetch(`https://www.google.com/search?q=${encodedQuery}&num=100`, {
        method: 'GET',
        headers: headers,
        mode: 'no-cors' // This might help in some cases but won't return usable data in most browsers
      });
      
      if (response.type === 'opaque') {
        console.log("Got opaque response from direct fetch");
      }
    } catch (directError) {
      console.error("Direct fetch also failed:", directError);
    }
  }
  
  let results = [];
  
  // If we have HTML content, extract data from it
  if (html && html.length > 100) {
    results = extractBusinessDataFromGoogleSearch(html, config);
    
    if (results.length > 0) {
      await enhanceResultsWithEmails(results, config, corsProxies, 
        AntiBlockingUtils.getBrowserEmulationHeaders, 
        AntiBlockingUtils.getRandomUserAgent);
      return results;
    }
  }
  
  // Try alternative scraping method directly from search engine
  const alternativeResults = await scrapeAlternativeSearchEngine(config);
  if (alternativeResults.length > 0) {
    return alternativeResults;
  }
  
  console.warn("All scraping methods failed, generating minimal sample data for demonstration");
  // Return a minimal set of sample data with clear indicators that it's sample data
  return [
    {
      rawHtml: "<div class='sample-data'>Sample Data Notice</div>",
      extractedData: {
        name: "SCRAPING FAILED - Sample Result",
        email: "example@domain.com",
        phone: "555-123-4567",
        city: config.location?.city || "Sample City",
        state: config.location?.state || "Sample State",
        industry: config.industry || "Sample Industry",
        description: "⚠️ NOTICE: This is sample data shown because web scraping failed. This could be due to CORS restrictions, IP blocking, or changing website structures. Try adjusting your search criteria or try again later. See console for detailed error logs."
      }
    }
  ];
}

/**
 * Scrape data from alternative search engine
 */
export async function scrapeAlternativeSearchEngine(config: ScrapeConfig): Promise<any[]> {
  console.log("Attempting to use alternative search engine...");
  
  const searchQuery = buildGoogleSearchQuery(config);
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Try DuckDuckGo HTML (which sometimes has fewer restrictions)
  const corsProxies = [
    "https://corsproxy.io/?",
    "https://api.allorigins.win/raw?url="
  ];
  
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
  
  let html = '';
  let proxySuccessful = false;
  
  const userAgent = config.useRandomUserAgents 
    ? AntiBlockingUtils.getRandomUserAgent() 
    : "Mozilla/5.0 (compatible; Crawl4AI/0.5.1; +https://github.com/unclecode/crawl4ai)";
  
  const headers = AntiBlockingUtils.getBrowserEmulationHeaders(userAgent);
  
  for (let i = 0; i < corsProxies.length; i++) {
    try {
      console.log(`Fetching alternative search results via CORS proxy ${i+1}`);
      
      const response = await fetch(`${corsProxies[i]}${searchUrl}`, {
        method: 'GET',
        headers: headers,
      });
      
      if (response.ok) {
        html = await response.text();
        console.log(`Successfully fetched ${html.length} bytes from alternative search`);
        proxySuccessful = true;
        break;
      }
    } catch (error) {
      console.error(`Error with alternative search proxy ${i+1}:`, error);
    }
  }
  
  if (!proxySuccessful || !html || html.length < 100) {
    console.warn("Alternative search engine scraping failed");
    return [];
  }
  
  // Extract data from alternative search engine HTML
  const results = extractBusinessDataFromAlternativeSearch(html, config);
  
  if (results.length > 0) {
    await enhanceResultsWithEmails(results, config, corsProxies, 
      AntiBlockingUtils.getBrowserEmulationHeaders, 
      AntiBlockingUtils.getRandomUserAgent);
  }
  
  return results;
}

/**
 * Main scraping function that orchestrates the scraping process
 */
export const scrapeSearch = async (config: ScrapeConfig): Promise<any[]> => {
  console.log("Scraping website with search query:", config.industry);
  console.log("Location filters:", config.location);
  console.log("Using advanced scraping algorithms v" + crawl4aiInfo.version);
  
  // Always use Google search for better results
  return await scrapeGoogleSearch(config);
};
