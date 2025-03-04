import { ScrapeConfig, BusinessData } from "@/types";

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

// Enhanced email extraction regex patterns
const EMAIL_REGEX_PATTERNS = [
  /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  /mailto:([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  /([a-zA-Z0-9._-]+\s*[\[\(\{]at[\]\)\}]\s*[a-zA-Z0-9._-]+\s*[\[\(\{]dot[\]\)\}]\s*[a-zA-Z0-9_-]+)/gi,
  /([a-zA-Z0-9._-]+\s*@\s*[a-zA-Z0-9._-]+\s*\.\s*[a-zA-Z0-9_-]+)/gi
];

// robots.txt parser implementation
interface RobotsTxtRules {
  allowedPaths: string[];
  disallowedPaths: string[];
  crawlDelay: number | null;
}

class RobotsTxtParser {
  static async fetchAndParse(domain: string): Promise<RobotsTxtRules> {
    console.log(`Fetching robots.txt from ${domain}`);
    
    try {
      const corsProxies = [
        "https://api.allorigins.win/raw?url=",
        "https://corsproxy.io/?",
        "https://cors-anywhere.herokuapp.com/"
      ];
      
      let response = null;
      let proxyIndex = 0;
      
      while (!response && proxyIndex < corsProxies.length) {
        try {
          response = await fetch(`${corsProxies[proxyIndex]}https://${domain}/robots.txt`);
          if (!response.ok) {
            response = null;
            proxyIndex++;
          }
        } catch (err) {
          proxyIndex++;
        }
      }
      
      if (!response || !response.ok) {
        console.warn(`Couldn't fetch robots.txt from ${domain}, using default rules`);
        return {
          allowedPaths: ["/"],
          disallowedPaths: [],
          crawlDelay: null
        };
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      const rules: RobotsTxtRules = {
        allowedPaths: [],
        disallowedPaths: [],
        crawlDelay: null
      };
      
      let relevantSection = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
          continue;
        }
        
        if (trimmedLine.toLowerCase().startsWith('user-agent:')) {
          const userAgent = trimmedLine.substring('user-agent:'.length).trim().toLowerCase();
          relevantSection = userAgent === '*' || userAgent.includes('crawler') || userAgent.includes('bot');
          continue;
        }
        
        if (relevantSection) {
          if (trimmedLine.toLowerCase().startsWith('allow:')) {
            const path = trimmedLine.substring('allow:'.length).trim();
            rules.allowedPaths.push(path);
          } else if (trimmedLine.toLowerCase().startsWith('disallow:')) {
            const path = trimmedLine.substring('disallow:'.length).trim();
            rules.disallowedPaths.push(path);
          } else if (trimmedLine.toLowerCase().startsWith('crawl-delay:')) {
            const delay = trimmedLine.substring('crawl-delay:'.length).trim();
            rules.crawlDelay = parseInt(delay, 10) || null;
          }
        }
      }
      
      return rules;
    } catch (error) {
      console.error("Error fetching robots.txt:", error);
      return {
        allowedPaths: ["/"],
        disallowedPaths: [],
        crawlDelay: null
      };
    }
  }
  
  static isPathAllowed(rules: RobotsTxtRules, path: string): boolean {
    if (rules.disallowedPaths.some(disallowed => path.startsWith(disallowed))) {
      return false;
    }
    
    if (rules.allowedPaths.some(allowed => path.startsWith(allowed))) {
      return true;
    }
    
    return true;
  }
}

// Anti-blocking utilities
class AntiBlockingUtils {
  private static userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0.6045.169 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  ];
  
  private static proxyServers = [
    "proxy1.example.com:8080",
    "proxy2.example.com:8080",
    "proxy3.example.com:8080"
  ];
  
  static getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
  
  static getRandomProxy(): string {
    return this.proxyServers[Math.floor(Math.random() * this.proxyServers.length)];
  }
  
  static calculateDelay(baseDelay: number): number {
    return baseDelay * 1000 + Math.random() * 2000;
  }
  
  static getBrowserEmulationHeaders(userAgent: string): Record<string, string> {
    return {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    };
  }
}

// Web scraping implementation
export const scrapeWebsite = async (config: ScrapeConfig): Promise<any[]> => {
  console.log("Scraping website with search query:", config.industry);
  console.log("Location filters:", config.location);
  console.log("Using advanced scraping algorithms v" + crawl4aiInfo.version);
  
  const useGoogleSearch = true; // Always use Google search for better results
  
  if (useGoogleSearch) {
    return await scrapeGoogleSearch(config);
  } else {
    return await scrapeDirectoryWebsite(config);
  }
};

// New Google search scraper function
async function scrapeGoogleSearch(config: ScrapeConfig): Promise<any[]> {
  const searchQuery = buildGoogleSearchQuery(config);
  
  console.log("Using Google search query:", searchQuery);
  
  const encodedQuery = encodeURIComponent(searchQuery);
  
  const corsProxies = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://cors-anywhere.herokuapp.com/"
  ];
  
  let html = '';
  const googleSearchUrl = `https://www.google.com/search?q=${encodedQuery}&num=100`;
  
  const userAgent = config.useRandomUserAgents 
    ? AntiBlockingUtils.getRandomUserAgent() 
    : "Mozilla/5.0 (compatible; DataZapCrawler/1.0)";
  
  const headers = AntiBlockingUtils.getBrowserEmulationHeaders(userAgent);
  
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
        break;
      } else {
        console.warn(`Proxy ${i+1} failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error with proxy ${i+1}:`, error);
    }
  }
  
  if (!html || html.length < 100) {
    console.warn("Retrieved HTML is empty or too short, likely blocked or failed to fetch");
    return generateSampleResults(config);
  }
  
  const results = extractBusinessDataFromGoogleSearch(html, config);
  
  await enhanceResultsWithEmails(results, config);
  
  return results;
}

// Helper functions for Google search scraping
function buildGoogleSearchQuery(config: ScrapeConfig): string {
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

function extractBusinessDataFromGoogleSearch(html: string, config: ScrapeConfig): any[] {
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

async function enhanceResultsWithEmails(results: any[], config: ScrapeConfig): Promise<void> {
  const userAgent = config.useRandomUserAgents 
    ? AntiBlockingUtils.getRandomUserAgent() 
    : "Mozilla/5.0 (compatible; DataZapCrawler/1.0)";
  
  const headers = AntiBlockingUtils.getBrowserEmulationHeaders(userAgent);
  
  const maxPagesToScan = 10;
  const pagesToScan = Math.min(results.length, maxPagesToScan);
  
  console.log(`Enhancing ${pagesToScan} results with email extraction`);
  
  const corsProxies = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://cors-anywhere.herokuapp.com/"
  ];
  
  for (let i = 0; i < pagesToScan; i++) {
    const result = results[i];
    
    if (result.extractedData.email || !result.url) {
      continue;
    }
    
    const delay = config.baseDelaySeconds ? config.baseDelaySeconds * 1000 + Math.random() * 2000 : 3000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    let pageHtml = '';
    const targetUrl = encodeURIComponent(result.url);
    
    for (let j = 0; j < corsProxies.length; j++) {
      try {
        console.log(`Fetching ${result.url} via CORS proxy ${j+1}`);
        
        const response = await fetch(`${corsProxies[j]}${targetUrl}`, {
          method: 'GET',
          headers: headers,
        });
        
        if (response.ok) {
          pageHtml = await response.text();
          console.log(`Successfully fetched ${pageHtml.length} bytes from ${result.url}`);
          break;
        }
      } catch (error) {
        console.error(`Error fetching ${result.url} with proxy ${j+1}:`, error);
      }
    }
    
    if (pageHtml && pageHtml.length > 100) {
      const emails = extractEmailsFromText(pageHtml);
      
      if (emails.length > 0) {
        console.log(`Found email address for ${result.extractedData.name}: ${emails[0]}`);
        result.extractedData.email = emails[0];
        
        if (emails.length > 1) {
          const additionalEmails = emails.slice(1).join(', ');
          result.extractedData.description = 
            `${result.extractedData.description || ''}\nAdditional emails: ${additionalEmails}`;
        }
      }
    }
  }
}

function extractEmailsFromText(text: string): string[] {
  const emails = new Set<string>();
  
  for (const pattern of EMAIL_REGEX_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        let email = match.replace(/\s*[\[\(\{]at[\]\)\}]\s*/gi, '@')
                         .replace(/\s*[\[\(\{]dot[\]\)\}]\s*/gi, '.')
                         .replace(/\s+/g, '');
        
        email = email.replace(/[^\w.@+-]+$/, '');
        
        if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/.test(email)) {
          emails.add(email);
        }
      });
    }
  }
  
  return Array.from(emails);
}

// Fallback directory scraping logic
async function scrapeDirectoryWebsite(config: ScrapeConfig): Promise<any[]> {
  // Original directory scraping implementation
  console.log("Scraping directory website...");
  return generateSampleResults(config);
}

// Generate sample data when scraping fails
function generateSampleResults(config: ScrapeConfig): any[] {
  console.log("Generating sample results for demonstration");
  
  const sampleData = [
    {
      rawHtml: "<div class='sample-data'>Sample Business 1</div>",
      extractedData: {
        name: "Sample Business 1",
        email: "contact@samplebusiness1.com",
        phone: "555-123-4567",
        address: "123 Main St",
        city: config.location?.city || "Sample City",
        state: config.location?.state || "Sample State",
        website: "https://www.samplebusiness1.com",
        industry: config.industry || "Sample Industry",
        description: "This is a sample business generated to demonstrate functionality."
      }
    },
    {
      rawHtml: "<div class='sample-data'>Sample Business 2</div>",
      extractedData: {
        name: "Sample Business 2",
        email: "info@samplebusiness2.com",
        phone: "555-987-6543",
        address: "456 Oak Avenue",
        city: config.location?.city || "Sample City",
        state: config.location?.state || "Sample State",
        website: "https://www.samplebusiness2.com",
        industry: config.industry || "Sample Industry",
        description: "This is another sample business generated for demonstration."
      }
    }
  ];
  
  return sampleData;
}

// Parse HTML from the scraped data
export const parseHtml = (html: string, selectors: ScrapeConfig["selectors"]): Partial<BusinessData> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  const data: Partial<BusinessData> = {};
  
  const findContent = (selectorList: string[], defaultSelector: string): string => {
    for (const selector of selectorList) {
      const element = doc.querySelector(selector);
      if (element && element.textContent) {
        return element.textContent.trim();
      }
    }
    return '';
  };
  
  data.name = findContent(
    [selectors?.name || ".business-name", ".name", ".biz-name", "[itemprop='name']", "h1", "h2", "h3"],
    ".business-name"
  );
  
  data.phone = findContent(
    [selectors?.phone || ".phone", ".tel", ".telephone", "[itemprop='telephone']", ".phones"],
    ".phone"
  );
  
  data.email = findContent(
    [selectors?.email || ".email", ".e-mail", "[itemprop='email']"],
    ".email"
  );
  
  data.address = findContent(
    [selectors?.address || ".address", ".street-address", "[itemprop='address']", ".adr", ".location"],
    ".address"
  );
  
  data.website = findContent(
    [selectors?.website || ".website", ".url", "[itemprop='url']", "a.website", ".links a.website"],
    ".website"
  );
  
  data.description = findContent(
    [selectors?.description || ".description", ".desc", "[itemprop='description']", ".snippet", ".business-desc"],
    ".description"
  );
  
  data.category = findContent(
    [selectors?.category || ".category", ".categories", "[itemprop='category']", ".business-categories"],
    ".category"
  );
  
  data.city = findContent(
    [selectors?.city || ".city", ".locality", "[itemprop='addressLocality']"],
    ".city"
  );
  
  data.state = findContent(
    [selectors?.state || ".state", ".region", "[itemprop='addressRegion']"],
    ".state"
  );
  
  data.industry = findContent(
    [selectors?.industry || ".industry", ".business-category", ".primary-facet"],
    ".industry"
  );
  
  if (data.address && (!data.city || !data.state)) {
    try {
      const addressParts = data.address.split(',').map(part => part.trim());
      if (addressParts.length >= 2) {
        if (!data.city && addressParts.length >= 2) {
          data.city = addressParts[addressParts.length - 2];
        }
        
        if (!data.state && addressParts.length >= 1) {
          const lastPart = addressParts[addressParts.length - 1];
          const stateZipMatch = lastPart.match(/([A-Z]{2})\s+\d{5}/);
          if (stateZipMatch && stateZipMatch[1]) {
            data.state = stateZipMatch[1];
          }
        }
      }
    } catch (e) {
      console.error("Error parsing address:", e);
    }
  }
  
  if (!data.industry && data.category) {
    data.industry = data.category;
  }
  
  if (!data.name && html.length > 20) {
    try {
      for (let i = 1; i <= 5; i++) {
        const headings = doc.querySelectorAll(`h${i}`);
        if (headings.length > 0) {
          data.name = headings[0].textContent?.trim() || 'Unknown Business';
          break;
        }
      }
      
      if (!data.name) {
        const title = doc.querySelector('title');
        if (title) {
          data.name = title.textContent?.trim() || 'Unknown Business';
        } else {
          data.name = 'Unknown Business';
        }
      }
    } catch (e) {
      data.name = 'Unknown Business';
    }
  }
  
  return data;
};

// Extract data from HTML
export const extractDataFromHtml = (rawData: any[], config: ScrapeConfig): Partial<BusinessData>[] => {
  return rawData.map(item => {
    if (item.extractedData) {
      return item.extractedData;
    }
    return parseHtml(item.rawHtml, config.selectors);
  });
};

// Download data as CSV
export const downloadCsv = (data: BusinessData[], filename = "business-data.csv") => {
  if (data.length === 0) return;
  
  const fields = Array.from(
    new Set(
      data.flatMap(item => Object.keys(item))
    )
  );
  
  const priorityFields = ["name", "phone", "email", "website", "address", "city", "state", "industry", "category", "description"];
  fields.sort((a, b) => {
    const aIndex = priorityFields.indexOf(a);
    const bIndex = priorityFields.indexOf(b);
    
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  let csv = fields.join(",") + "\n";
  
  csv += data.map(item => {
    return fields.map(field => {
      const value = item[field] || "";
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",");
  }).join("\n");
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Get Crawl4AI information
export const getCrawl4AIInfo = () => {
  return {
    ...crawl4aiInfo,
    description: "Crawl4AI is the #1 trending GitHub repository, actively maintained by a vibrant community. It delivers blazing-fast, AI-ready web crawling tailored for LLMs, AI agents, and data pipelines. Open source, flexible, and built for real-time performance, Crawl4AI empowers developers with unmatched speed, precision, and deployment ease."
  };
};

// Helper function to verify if a website allows scraping
export const checkScrapingPermissions = async (url: string): Promise<{
  allowed: boolean;
  reason?: string;
  recommendedDelay?: number;
}> => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    const robotsRules = await RobotsTxtParser.fetchAndParse(domain);
    
    if (!RobotsTxtParser.isPathAllowed(robotsRules, path)) {
      return {
        allowed: false,
        reason: `Path ${path} is disallowed by robots.txt`
      };
    }
    
    return {
      allowed: true,
      recommendedDelay: robotsRules.crawlDelay || 2
    };
  } catch (error) {
    console.error("Error checking scraping permissions:", error);
    return {
      allowed: true,
      reason: "Unable to check robots.txt, proceeding with caution",
      recommendedDelay: 5
    };
  }
};
