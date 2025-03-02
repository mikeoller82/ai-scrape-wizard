
import { ScrapeConfig, BusinessData } from "@/types";

// Crawl4AI information for implementation
const crawl4aiInfo = {
  version: "0.4.3bx",
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
      const response = await fetch(`https://${domain}/robots.txt`);
      
      if (!response.ok) {
        console.warn(`Couldn't fetch robots.txt from ${domain}, status: ${response.status}`);
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
        
        // Check if line is a comment or empty
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
          continue;
        }
        
        // Check if this section applies to all user agents or our specific crawler
        if (trimmedLine.toLowerCase().startsWith('user-agent:')) {
          const userAgent = trimmedLine.substring('user-agent:'.length).trim().toLowerCase();
          relevantSection = userAgent === '*' || userAgent.includes('crawler') || userAgent.includes('bot');
          continue;
        }
        
        // Only process rules if we're in a relevant section
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
      // Return default permissive rules if we can't fetch robots.txt
      return {
        allowedPaths: ["/"],
        disallowedPaths: [],
        crawlDelay: null
      };
    }
  }
  
  static isPathAllowed(rules: RobotsTxtRules, path: string): boolean {
    // Check if the path is explicitly disallowed
    if (rules.disallowedPaths.some(disallowed => path.startsWith(disallowed))) {
      return false;
    }
    
    // Check if the path is explicitly allowed
    if (rules.allowedPaths.some(allowed => path.startsWith(allowed))) {
      return true;
    }
    
    // Default to allowed if not specified
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
    // In a real implementation, these would be actual proxy servers
    // For now, we'll just simulate proxy rotation
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
    // Add jitter to delay to appear more human-like
    return baseDelay * 1000 + Math.random() * 2000;
  }
  
  // Browser emulation headers
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

// Enhanced scraping configuration as part of ScrapeConfig
// We extended the ScrapeConfig type in @/types

// Web scraping implementation
export const scrapeWebsite = async (config: ScrapeConfig): Promise<any[]> => {
  console.log("Scraping website:", config.url);
  console.log("Location filters:", config.location);
  console.log("Industry filter:", config.industry);
  console.log("Using advanced Crawl4AI-inspired algorithms v" + crawl4aiInfo.version);
  
  // Extract domain from URL
  const urlObj = new URL(config.url);
  const domain = urlObj.hostname;
  const path = urlObj.pathname;
  
  // Check robots.txt if enabled
  let robotsRules: RobotsTxtRules | null = null;
  if (config.respectRobotsTxt) {
    try {
      console.log("Checking robots.txt rules");
      robotsRules = await RobotsTxtParser.fetchAndParse(domain);
      console.log("Robot rules fetched:", robotsRules);
      
      // Check if the path is allowed
      if (!RobotsTxtParser.isPathAllowed(robotsRules, path)) {
        console.warn(`Path ${path} is disallowed by robots.txt, aborting scrape`);
        return [];
      }
      
      console.log(`Path ${path} is allowed by robots.txt, proceeding with scrape`);
    } catch (error) {
      console.error("Error fetching robots.txt:", error);
      // Continue with scrape if we can't fetch robots.txt
    }
  }
  
  // Set up anti-blocking measures
  const userAgent = config.useRandomUserAgents 
    ? AntiBlockingUtils.getRandomUserAgent() 
    : "Mozilla/5.0 (compatible; DataZapCrawler/1.0)";
  
  const proxy = config.useRotatingProxies 
    ? AntiBlockingUtils.getRandomProxy() 
    : null;
  
  // Calculate delay based on robots.txt or config
  const baseDelay = robotsRules?.crawlDelay || config.baseDelaySeconds || 2;
  const delay = AntiBlockingUtils.calculateDelay(baseDelay);
  
  console.log("Using user agent:", userAgent);
  if (proxy) {
    console.log("Using proxy server:", proxy);
  }
  console.log(`Adding delay of ${delay}ms between requests to avoid rate limiting`);
  
  // Get browser emulation headers
  const headers = AntiBlockingUtils.getBrowserEmulationHeaders(userAgent);
  
  try {
    // Use fetch with appropriate headers to simulate a browser
    const response = await fetch(config.url, {
      method: 'GET',
      headers: headers,
      // In a real-world scenario, we would configure proxies here
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${config.url}, status: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    console.log(`Fetched ${html.length} bytes of HTML from ${config.url}`);
    
    // Parse the HTML using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract data based on selectors
    const containerSelector = config.selectors?.container || ".business-card";
    const containers = doc.querySelectorAll(containerSelector);
    console.log(`Found ${containers.length} business listings using selector ${containerSelector}`);
    
    const results = [];
    
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const rawHtml = container.outerHTML;
      
      // Add the raw HTML to results
      results.push({ rawHtml });
    }
    
    // Filter results based on location and industry if provided
    let filteredResults = [...results];
    
    // Only filter if we have non-empty filter values
    const hasLocationFilter = !!(config.location?.city?.trim() || config.location?.state?.trim());
    const hasIndustryFilter = !!config.industry?.trim();
    
    if (hasLocationFilter || hasIndustryFilter) {
      filteredResults = results.filter(item => {
        const itemDoc = parser.parseFromString(item.rawHtml, "text/html");
        
        // Default to true - we'll eliminate if filters don't match
        let locationMatch = true;
        let industryMatch = true;
        
        // Only check location if filter is provided
        if (hasLocationFilter) {
          locationMatch = false; // Default to no match, prove it matches
          
          const cityElement = itemDoc.querySelector(config.selectors?.city || ".city");
          const stateElement = itemDoc.querySelector(config.selectors?.state || ".state");
          const addressElement = itemDoc.querySelector(config.selectors?.address || ".address");
          
          const cityText = cityElement?.textContent?.trim().toLowerCase() || "";
          const stateText = stateElement?.textContent?.trim().toLowerCase() || "";
          const addressText = addressElement?.textContent?.trim().toLowerCase() || "";
          
          const cityFilter = (config.location?.city || "").toLowerCase().trim();
          const stateFilter = (config.location?.state || "").toLowerCase().trim();
          
          // Check city match (if city filter provided)
          const cityMatches = !cityFilter || 
            cityText.includes(cityFilter) || 
            cityFilter.includes(cityText) ||
            addressText.includes(cityFilter);
            
          // Check state match (if state filter provided)
          const stateMatches = !stateFilter || 
            stateText.includes(stateFilter) || 
            stateFilter.includes(stateText) ||
            addressText.includes(stateFilter);
            
          // Location matches if both city AND state match (or if one filter is not provided)
          locationMatch = cityMatches && stateMatches;
        }
        
        // Only check industry if filter is provided
        if (hasIndustryFilter) {
          industryMatch = false; // Default to no match, prove it matches
          
          const industryElement = itemDoc.querySelector(config.selectors?.industry || ".industry");
          const categoryElement = itemDoc.querySelector(config.selectors?.category || ".category");
          const descElement = itemDoc.querySelector(config.selectors?.description || ".description");
          const nameElement = itemDoc.querySelector(config.selectors?.name || ".business-name");
          
          const industryText = industryElement?.textContent?.trim().toLowerCase() || "";
          const categoryText = categoryElement?.textContent?.trim().toLowerCase() || "";
          const descText = descElement?.textContent?.trim().toLowerCase() || "";
          const nameText = nameElement?.textContent?.trim().toLowerCase() || "";
          
          const industryFilter = config.industry?.toLowerCase().trim() || "";
          
          // Check for industry match across multiple fields
          industryMatch = 
              industryText.includes(industryFilter) || 
              industryFilter.includes(industryText) ||
              categoryText.includes(industryFilter) || 
              categoryText.toLowerCase() === industryFilter.toLowerCase() ||
              descText.includes(industryFilter) ||
              nameText.includes(industryFilter);
        }
        
        // For ANDing filters: item matches if it passes both location and industry checks
        return locationMatch && industryMatch;
      });
    }
    
    console.log(`Filtered to ${filteredResults.length} relevant business listings`);
    
    // Apply the calculated delay to simulate respecting crawl-delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return filteredResults;
    
  } catch (error) {
    console.error("Error during web scraping:", error);
    throw new Error(`Failed to scrape website: ${(error as Error).message}`);
  }
};

export const parseHtml = (html: string, selectors: ScrapeConfig["selectors"]): Partial<BusinessData> => {
  // Use a proper DOM parser to extract data from HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  const data: Partial<BusinessData> = {};
  
  if (selectors) {
    Object.entries(selectors).forEach(([field, selector]) => {
      if (selector && field !== "container") {
        const element = doc.querySelector(selector);
        if (element) {
          data[field] = element.textContent?.trim() || "";
        }
      }
    });
  }
  
  // Fallback to basic extraction if no data was found or no selectors provided
  if (Object.keys(data).length === 0) {
    const nameEl = doc.querySelector(".business-name");
    if (nameEl) data.name = nameEl.textContent?.trim() || "";
    
    const phoneEl = doc.querySelector(".phone");
    if (phoneEl) data.phone = phoneEl.textContent?.trim() || "";
    
    const addressEl = doc.querySelector(".address");
    if (addressEl) data.address = addressEl.textContent?.trim() || "";
    
    const websiteEl = doc.querySelector(".website");
    if (websiteEl) data.website = websiteEl.textContent?.trim() || "";
    
    const emailEl = doc.querySelector(".email");
    if (emailEl) data.email = emailEl.textContent?.trim() || "";
    
    const descriptionEl = doc.querySelector(".description");
    if (descriptionEl) data.description = descriptionEl.textContent?.trim() || "";
    
    const categoryEl = doc.querySelector(".category");
    if (categoryEl) data.category = categoryEl.textContent?.trim() || "";
    
    const cityEl = doc.querySelector(".city");
    if (cityEl) data.city = cityEl.textContent?.trim() || "";
    
    const stateEl = doc.querySelector(".state");
    if (stateEl) data.state = stateEl.textContent?.trim() || "";
    
    const industryEl = doc.querySelector(".industry");
    if (industryEl) data.industry = industryEl.textContent?.trim() || "";
  }
  
  // If we have an address but no city/state, try to parse them from the address
  if (data.address && (!data.city || !data.state)) {
    const addressParts = data.address.split(',').map(part => part.trim());
    if (addressParts.length >= 2) {
      // Assuming format like "123 Main St, Anytown, CA 12345"
      if (!data.city && addressParts.length >= 2) {
        data.city = addressParts[addressParts.length - 2];
      }
      
      // Try to extract state from the last part
      if (!data.state && addressParts.length >= 1) {
        const lastPart = addressParts[addressParts.length - 1];
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s+\d{5}/);
        if (stateZipMatch && stateZipMatch[1]) {
          data.state = stateZipMatch[1];
        }
      }
    }
  }
  
  return data;
};

export const extractDataFromHtml = (rawData: any[], config: ScrapeConfig): Partial<BusinessData>[] => {
  return rawData.map(item => {
    return parseHtml(item.rawHtml, config.selectors);
  });
};

export const downloadCsv = (data: BusinessData[], filename = "business-data.csv") => {
  if (data.length === 0) return;
  
  // Get all unique fields from all objects
  const fields = Array.from(
    new Set(
      data.flatMap(item => Object.keys(item))
    )
  );
  
  // Prioritize important lead generation fields
  const priorityFields = ["name", "phone", "email", "website", "address", "city", "state", "industry", "category", "description"];
  fields.sort((a, b) => {
    const aIndex = priorityFields.indexOf(a);
    const bIndex = priorityFields.indexOf(b);
    
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  // Create CSV header
  let csv = fields.join(",") + "\n";
  
  // Add data rows
  csv += data.map(item => {
    return fields.map(field => {
      const value = item[field] || "";
      // Escape values that contain commas or quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",");
  }).join("\n");
  
  // Create download link
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
    
    // Check robots.txt
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
      allowed: true, // Default to allowed if we can't check
      reason: "Unable to check robots.txt, proceeding with caution",
      recommendedDelay: 5 // Conservative default
    };
  }
};
