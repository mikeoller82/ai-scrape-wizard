
import { ScrapeConfig, BusinessData, ScrapingPermissions } from "@/types";

// Export everything from our refactored modules
export { checkScrapingPermissions } from "./scrape/permissionChecker";
export { downloadCsv, extractDataFromHtml, parseHtml } from "./scrape/htmlParser";
export { extractEmailsFromText, findContactLinks } from "./scrape/emailExtractor";

/**
 * Main function to scrape a website based on the provided configuration
 */
export const scrapeWebsite = async (config: ScrapeConfig): Promise<any[]> => {
  // Import dynamically to avoid circular references
  const { scrapeSearch } = await import("./scrape/searchScraper");
  return scrapeSearch(config);
};
