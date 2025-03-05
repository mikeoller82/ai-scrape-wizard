
import { ScrapeConfig, BusinessData, ScrapingPermissions } from "@/types";
import { crawlWebsite } from "./scrape/firecrawlService";

// Export other utility functions from our refactored modules
export { checkScrapingPermissions } from "./scrape/permissionChecker";
export { downloadCsv, extractDataFromHtml, parseHtml } from "./scrape/htmlParser";
export { extractEmailsFromText, findContactLinks } from "./scrape/emailExtractor";

// Export Firecrawl functions
export { saveApiKey, getApiKey, testApiKey } from "./scrape/firecrawlService";

/**
 * Main function to scrape a website based on the provided configuration
 * Now uses Firecrawl instead of the previous implementation
 */
export const scrapeWebsite = async (config: ScrapeConfig): Promise<any[]> => {
  console.log("Scraping website with Firecrawl:", config.url);
  return crawlWebsite(config);
};
