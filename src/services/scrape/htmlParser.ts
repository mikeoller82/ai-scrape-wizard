
import { ScrapeConfig, BusinessData } from "@/types";

/**
 * Parse HTML from scraped data into structured business data
 */
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

/**
 * Extract data from HTML data
 */
export const extractDataFromHtml = (rawData: any[], config: ScrapeConfig): Partial<BusinessData>[] => {
  return rawData.map(item => {
    if (item.extractedData) {
      return item.extractedData;
    }
    return parseHtml(item.rawHtml, config.selectors);
  });
};

/**
 * Download data as CSV
 */
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
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
