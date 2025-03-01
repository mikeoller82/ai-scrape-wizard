import { ScrapeConfig, BusinessData } from "@/types";

// Mock data for demonstration purposes
const mockYellowPagesData = [
  {
    rawHtml: `<div class="business-card">
      <h3 class="business-name">Acme Corporation</h3>
      <p class="phone">(555) 123-4567</p>
      <p class="address">123 Main St, Anytown, CA 12345</p>
      <p class="website">www.acmecorp.com</p>
      <p class="email">contact@acmecorp.com</p>
      <p class="description">Leading provider of innovative solutions</p>
      <p class="category">Technology</p>
      <p class="city">Anytown</p>
      <p class="state">CA</p>
      <p class="industry">Technology</p>
    </div>`
  },
  {
    rawHtml: `<div class="business-card">
      <h3 class="business-name">XYZ Services</h3>
      <p class="phone">(555) 987-6543</p>
      <p class="address">456 Oak Ave, Somewhere, NY 54321</p>
      <p class="website">www.xyzservices.com</p>
      <p class="email">info@xyzservices.com</p>
      <p class="description">Professional services for all your needs</p>
      <p class="category">Professional Services</p>
      <p class="city">Somewhere</p>
      <p class="state">NY</p>
      <p class="industry">Consulting</p>
    </div>`
  },
  {
    rawHtml: `<div class="business-card">
      <h3 class="business-name">City Cafe</h3>
      <p class="phone">(555) 789-0123</p>
      <p class="address">789 Elm Blvd, Metropolis, IL 67890</p>
      <p class="website">www.citycafe.com</p>
      <p class="email">hello@citycafe.com</p>
      <p class="description">Cozy cafe with a variety of drinks and pastries</p>
      <p class="category">Food & Dining</p>
      <p class="city">Metropolis</p>
      <p class="state">IL</p>
      <p class="industry">Restaurants</p>
    </div>`
  },
  {
    rawHtml: `<div class="business-card">
      <h3 class="business-name">Metro Plumbing</h3>
      <p class="phone">(555) 456-7890</p>
      <p class="address">321 Water St, Springfield, IL 45678</p>
      <p class="website">www.metroplumbing.com</p>
      <p class="email">service@metroplumbing.com</p>
      <p class="description">24/7 emergency plumbing services</p>
      <p class="category">Home Services</p>
      <p class="city">Springfield</p>
      <p class="state">IL</p>
      <p class="industry">Plumbers</p>
    </div>`
  },
  {
    rawHtml: `<div class="business-card">
      <h3 class="business-name">Legal Eagles</h3>
      <p class="phone">(555) 234-5678</p>
      <p class="address">555 Justice Ave, Lawtown, NY 12345</p>
      <p class="website">www.legaleagles.com</p>
      <p class="email">help@legaleagles.com</p>
      <p class="description">Expert legal services for individuals and businesses</p>
      <p class="category">Legal Services</p>
      <p class="city">Lawtown</p>
      <p class="state">NY</p>
      <p class="industry">Lawyers</p>
    </div>`
  }
];

// Crawl4AI information for future implementation
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
  installation: {
    pip: "pip install -U crawl4ai",
    preRelease: "pip install crawl4ai --pre",
    setup: "crawl4ai-setup"
  },
  githubUrl: "https://github.com/unclecode/crawl4ai"
};

// New robots.txt parser implementation
interface RobotsTxtRules {
  allowedPaths: string[];
  disallowedPaths: string[];
  crawlDelay: number | null;
}

class RobotsTxtParser {
  static async fetchAndParse(domain: string): Promise<RobotsTxtRules> {
    console.log(`Fetching robots.txt from ${domain}`);
    
    // In a real implementation, this would fetch and parse the actual robots.txt
    // For now, we'll return mock rules
    return {
      allowedPaths: ["/", "/public", "/business"],
      disallowedPaths: ["/admin", "/private", "/user"],
      crawlDelay: 5 // seconds
    };
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
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  ];
  
  private static proxyServers = [
    // In a production environment, these would be real proxy servers
    "mock-proxy-1",
    "mock-proxy-2",
    "mock-proxy-3"
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
}

// Enhanced scraping configuration
interface EnhancedScrapeConfig extends ScrapeConfig {
  respectRobotsTxt?: boolean;
  useRotatingProxies?: boolean;
  useRandomUserAgents?: boolean;
  baseDelaySeconds?: number;
}

export const scrapeWebsite = async (config: EnhancedScrapeConfig): Promise<any[]> => {
  // In a real implementation, this would use a server-side function or API
  // to scrape the website based on the provided URL and selectors
  
  console.log("Scraping website:", config.url);
  console.log("Location filters:", config.location);
  console.log("Industry filter:", config.industry);
  console.log("Using advanced AI scraping algorithms inspired by Crawl4AI v" + crawl4aiInfo.version);
  
  // Extract domain from URL
  const urlObj = new URL(config.url);
  const domain = urlObj.hostname;
  
  // Check robots.txt if enabled
  let robotsRules: RobotsTxtRules | null = null;
  if (config.respectRobotsTxt) {
    try {
      console.log("Checking robots.txt rules");
      robotsRules = await RobotsTxtParser.fetchAndParse(domain);
      console.log("Robot rules fetched:", robotsRules);
      
      // Check if the path is allowed
      const urlPath = urlObj.pathname;
      if (!RobotsTxtParser.isPathAllowed(robotsRules, urlPath)) {
        console.warn(`Path ${urlPath} is disallowed by robots.txt, aborting scrape`);
        return [];
      }
      
      console.log(`Path ${urlPath} is allowed by robots.txt, proceeding with scrape`);
    } catch (error) {
      console.error("Error fetching robots.txt:", error);
      // Continue with scrape if we can't fetch robots.txt
    }
  }
  
  // Set up anti-blocking measures
  const userAgent = config.useRandomUserAgents 
    ? AntiBlockingUtils.getRandomUserAgent() 
    : "Mozilla/5.0 (compatible; Crawler/1.0)";
  
  const proxy = config.useRotatingProxies 
    ? AntiBlockingUtils.getRandomProxy() 
    : null;
  
  console.log("Using user agent:", userAgent);
  if (proxy) {
    console.log("Using proxy server:", proxy);
  }
  
  // Calculate delay based on robots.txt or config
  const baseDelay = robotsRules?.crawlDelay || config.baseDelaySeconds || 2;
  const delay = AntiBlockingUtils.calculateDelay(baseDelay);
  
  console.log(`Adding delay of ${delay}ms between requests to avoid rate limiting`);
  
  // For demo purposes, always return all mock data unless there are very specific filters
  // This ensures we get results even with loose matching
  let filteredData = [...mockYellowPagesData];
  
  // Only filter if we have non-empty filter values
  const hasLocationFilter = !!(config.location?.city?.trim() || config.location?.state?.trim());
  const hasIndustryFilter = !!config.industry?.trim();
  
  if (hasLocationFilter || hasIndustryFilter) {
    filteredData = mockYellowPagesData.filter(item => {
      const doc = new DOMParser().parseFromString(item.rawHtml, "text/html");
      
      // If no filters are specified, consider it a match
      if (!hasLocationFilter && !hasIndustryFilter) return true;
      
      // Default to true - we'll eliminate if filters don't match
      let locationMatch = true;
      let industryMatch = true;
      
      // Only check location if filter is provided
      if (hasLocationFilter) {
        locationMatch = false; // Default to no match, prove it matches
        
        const cityElement = doc.querySelector(".city");
        const stateElement = doc.querySelector(".state");
        const addressElement = doc.querySelector(".address");
        
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
        
        const industryElement = doc.querySelector(".industry");
        const categoryElement = doc.querySelector(".category");
        const descElement = doc.querySelector(".description");
        const nameElement = doc.querySelector(".business-name");
        
        const industryText = industryElement?.textContent?.trim().toLowerCase() || "";
        const categoryText = categoryElement?.textContent?.trim().toLowerCase() || "";
        const descText = descElement?.textContent?.trim().toLowerCase() || "";
        const nameText = nameElement?.textContent?.trim().toLowerCase() || "";
        
        const industryFilter = config.industry?.toLowerCase().trim() || "";
        
        // Ultra-permissive industry matching
        // Any of these fields containing any part of the filter is a match
        industryMatch = 
            industryText.includes(industryFilter) || 
            industryFilter.includes(industryText) ||
            categoryText.includes(industryFilter) || 
            categoryText.toLowerCase() === industryFilter.toLowerCase() ||
            descText.includes(industryFilter) ||
            nameText.includes(industryFilter);
      }
      
      // For ANDing filters: item matches if it passes both location and industry checks
      // If just one filter type is provided, it only needs to match that filter
      return locationMatch && industryMatch;
    });
  }
  
  console.log(`Found ${filteredData.length} matching businesses using Crawl4AI-inspired algorithms`);
  
  // Apply the calculated delay to simulate respecting crawl-delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return filteredData;
};

export const parseHtml = (html: string, selectors: ScrapeConfig["selectors"]): Partial<BusinessData> => {
  // This is a simplified version of HTML parsing
  // In a real implementation, we would use a proper DOM parser
  
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

// Future implementation: integration with Crawl4AI
export const getCrawl4AIInfo = () => {
  return {
    ...crawl4aiInfo,
    description: "Crawl4AI is the #1 trending GitHub repository, actively maintained by a vibrant community. It delivers blazing-fast, AI-ready web crawling tailored for LLMs, AI agents, and data pipelines. Open source, flexible, and built for real-time performance, Crawl4AI empowers developers with unmatched speed, precision, and deployment ease."
  };
};

// Add new advanced scraping capabilities
export const advancedScrapeWebsite = async (config: EnhancedScrapeConfig): Promise<any[]> => {
  console.log("Starting advanced scrape with anti-blocking measures");
  
  // Enhanced configuration with anti-blocking features enabled
  const enhancedConfig: EnhancedScrapeConfig = {
    ...config,
    respectRobotsTxt: config.respectRobotsTxt ?? true,
    useRotatingProxies: config.useRotatingProxies ?? true,
    useRandomUserAgents: config.useRandomUserAgents ?? true,
    baseDelaySeconds: config.baseDelaySeconds ?? 3
  };
  
  // Log the enhanced configuration
  console.log("Enhanced scrape configuration:", {
    url: enhancedConfig.url,
    respectRobotsTxt: enhancedConfig.respectRobotsTxt,
    useRotatingProxies: enhancedConfig.useRotatingProxies,
    useRandomUserAgents: enhancedConfig.useRandomUserAgents,
    baseDelaySeconds: enhancedConfig.baseDelaySeconds
  });
  
  // Use the base scraping function with enhanced configuration
  return await scrapeWebsite(enhancedConfig);
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
    
    // Check robots.txt
    const robotsRules = await RobotsTxtParser.fetchAndParse(domain);
    const urlPath = urlObj.pathname;
    
    if (!RobotsTxtParser.isPathAllowed(robotsRules, urlPath)) {
      return {
        allowed: false,
        reason: `Path ${urlPath} is disallowed by robots.txt`
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
