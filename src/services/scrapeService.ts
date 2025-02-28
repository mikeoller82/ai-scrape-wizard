
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

export const scrapeWebsite = async (config: ScrapeConfig): Promise<any[]> => {
  // In a real implementation, this would use a server-side function or API
  // to scrape the website based on the provided URL and selectors
  // In the future, this could integrate with Crawl4AI for more powerful scraping
  
  console.log("Scraping website:", config.url);
  console.log("Location filters:", config.location);
  console.log("Industry filter:", config.industry);
  console.log("Using advanced AI scraping algorithms inspired by Crawl4AI v" + crawl4aiInfo.version);
  
  // For demo purposes, filter the mock data based on location and industry
  let filteredData = [...mockYellowPagesData];
  
  // Changed this to a less strict matching algorithm
  if (config.location?.city || config.location?.state || config.industry) {
    filteredData = mockYellowPagesData.filter(item => {
      const doc = new DOMParser().parseFromString(item.rawHtml, "text/html");
      let match = true;
      
      // Filter by city if specified, using a less strict comparison
      if (config.location?.city && config.location.city.trim() !== "") {
        const cityElement = doc.querySelector(".city");
        const cityText = cityElement?.textContent?.trim().toLowerCase() || "";
        const cityFilter = config.location.city.toLowerCase().trim();
        // Changed to a more permissive check
        if (!cityText.includes(cityFilter) && !cityFilter.includes(cityText)) {
          match = false;
        }
      }
      
      // Filter by state if specified, using a less strict comparison
      if (config.location?.state && config.location.state.trim() !== "" && match) {
        const stateElement = doc.querySelector(".state");
        const stateText = stateElement?.textContent?.trim().toLowerCase() || "";
        const stateFilter = config.location.state.toLowerCase().trim();
        // Changed to a more permissive check
        if (!stateText.includes(stateFilter) && !stateFilter.includes(stateText)) {
          match = false;
        }
      }
      
      // Filter by industry if specified, using a more inclusive approach
      if (config.industry && config.industry.trim() !== "" && match) {
        const industryElement = doc.querySelector(".industry");
        const categoryElement = doc.querySelector(".category");
        const descElement = doc.querySelector(".description");
        const nameElement = doc.querySelector(".business-name");
        
        const industryText = industryElement?.textContent?.trim().toLowerCase() || "";
        const categoryText = categoryElement?.textContent?.trim().toLowerCase() || "";
        const descText = descElement?.textContent?.trim().toLowerCase() || "";
        const nameText = nameElement?.textContent?.trim().toLowerCase() || "";
        
        const industryFilter = config.industry.toLowerCase().trim();
        
        // Look for industry keywords in multiple fields with partial matching
        const keywordFound = 
            industryText.includes(industryFilter) || 
            industryFilter.includes(industryText) ||
            categoryText.includes(industryFilter) || 
            descText.includes(industryFilter) ||
            nameText.includes(industryFilter);
            
        if (!keywordFound) {
          match = false;
        }
      }
      
      return match;
    });
  }
  
  // Return filtered data after a short delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(filteredData);
    }, 1500);
  });
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
