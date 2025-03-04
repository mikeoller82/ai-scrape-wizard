
import { RobotsTxtParser } from "./robotsTxtParser";
import { ScrapingPermissions } from "@/types";

/**
 * Check if scraping is allowed for a given website
 */
export const checkScrapingPermissions = async (url: string): Promise<ScrapingPermissions> => {
  try {
    console.log(`Checking scraping permissions for ${url}`);
    
    // Extract domain from URL
    let domain;
    try {
      domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch (e) {
      console.error("Invalid URL format:", e);
      return { allowed: false, reason: "Invalid URL format" };
    }
    
    // Check robots.txt for this domain
    if (domain) {
      const robotsRules = await RobotsTxtParser.fetchAndParse(domain);
      
      // If there are a lot of disallowed paths, the site might be restrictive
      if (robotsRules.disallowedPaths.length > 10) {
        console.warn("Website has many disallowed paths in robots.txt");
        return { 
          allowed: true, 
          reason: "Website has restrictive robots.txt but we'll proceed carefully" 
        };
      }
      
      // Check if the specific path we want to access is allowed
      const urlPath = new URL(url.startsWith('http') ? url : `https://${url}`).pathname;
      if (!RobotsTxtParser.isPathAllowed(robotsRules, urlPath)) {
        console.warn(`Path ${urlPath} is not allowed by robots.txt`);
        return {
          allowed: true,
          reason: "Path not allowed by robots.txt but we'll proceed with caution"
        };
      }
      
      // Check if crawl-delay is excessively high
      if (robotsRules.crawlDelay && robotsRules.crawlDelay > 30) {
        console.warn(`Crawl delay is very high: ${robotsRules.crawlDelay} seconds`);
        return {
          allowed: true,
          reason: `Website requests ${robotsRules.crawlDelay}s between requests but we'll proceed carefully`,
          recommendedDelay: robotsRules.crawlDelay
        };
      }
    }
    
    // For Google search, we'll always allow but with a notice
    if (url.includes("google.com/search")) {
      return {
        allowed: true,
        reason: "Note: Google search results scraping requires careful handling to avoid blocks"
      };
    }
    
    // Check if the site has known anti-scraping measures
    if (
      url.includes("linkedin.com") || 
      url.includes("instagram.com") || 
      url.includes("facebook.com") ||
      url.includes("twitter.com") ||
      url.includes("amazon.com/s") ||
      url.includes("indeed.com")
    ) {
      return {
        allowed: false,
        reason: "This website has strong anti-scraping measures and may block our requests"
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error("Error checking scraping permissions:", error);
    return { allowed: true, reason: "Could not verify permissions but will proceed" };
  }
};
