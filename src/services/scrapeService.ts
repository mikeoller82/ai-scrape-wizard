
import { ScrapeConfig, BusinessData } from "@/types";

const mockYellowPagesData = [
  {
    rawHtml: `<div class="business-card">
      <h3 class="business-name">Acme Corporation</h3>
      <p class="phone">(555) 123-4567</p>
      <p class="address">123 Main St, Anytown, CA 12345</p>
      <p class="website">www.acmecorp.com</p>
      <p class="description">Leading provider of innovative solutions</p>
      <p class="category">Technology</p>
    </div>`
  },
  {
    rawHtml: `<div class="business-card">
      <h3 class="business-name">XYZ Services</h3>
      <p class="phone">(555) 987-6543</p>
      <p class="address">456 Oak Ave, Somewhere, NY 54321</p>
      <p class="website">www.xyzservices.com</p>
      <p class="description">Professional services for all your needs</p>
      <p class="category">Professional Services</p>
    </div>`
  },
  {
    rawHtml: `<div class="business-card">
      <h3 class="business-name">City Cafe</h3>
      <p class="phone">(555) 789-0123</p>
      <p class="address">789 Elm Blvd, Metropolis, IL 67890</p>
      <p class="website">www.citycafe.com</p>
      <p class="description">Cozy cafe with a variety of drinks and pastries</p>
      <p class="category">Food & Dining</p>
    </div>`
  }
];

export const scrapeWebsite = async (config: ScrapeConfig): Promise<any[]> => {
  // In a real implementation, this would use a server-side function or API
  // to scrape the website based on the provided URL and selectors
  
  console.log("Scraping website:", config.url);
  
  // For demo purposes, return mock data after a short delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockYellowPagesData);
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
    
    const descriptionEl = doc.querySelector(".description");
    if (descriptionEl) data.description = descriptionEl.textContent?.trim() || "";
    
    const categoryEl = doc.querySelector(".category");
    if (categoryEl) data.category = categoryEl.textContent?.trim() || "";
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
