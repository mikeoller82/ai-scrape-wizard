
import { ScrapingPermissions } from "@/types";
import { parseRobotsTxt } from "./robotsTxtParser";

/**
 * Check if a URL is allowed to be scraped based on robots.txt and other site policies
 */
export const checkScrapingPermissions = async (url: string): Promise<ScrapingPermissions> => {
  try {
    // Parse domain from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const robotsTxtUrl = `${urlObj.protocol}//${domain}/robots.txt`;
    
    // Attempt to fetch and parse robots.txt
    let robotsData = null;
    try {
      const response = await fetch(robotsTxtUrl);
      if (response.ok) {
        const robotsTxtContent = await response.text();
        robotsData = parseRobotsTxt(robotsTxtContent);
      }
    } catch (error) {
      console.warn("Error fetching robots.txt:", error);
    }
    
    // Check for known anti-scraping sites
    const antiScrapingSites = [
      "linkedin.com",
      "facebook.com",
      "instagram.com",
      "twitter.com",
      "x.com"
    ];
    
    const isAntiScrapingSite = antiScrapingSites.some(site => domain.includes(site));
    
    return {
      allowed: !isAntiScrapingSite && (!robotsData || !robotsData.disallowAll),
      robotsData: robotsData,
      restrictions: isAntiScrapingSite ? ["Site policy prohibits scraping"] : [],
      recommendedDelay: robotsData?.crawlDelay || 1000
    };
  } catch (error) {
    console.error("Error checking scraping permissions:", error);
    return {
      allowed: false,
      restrictions: ["Error checking permissions"],
      recommendedDelay: 1000
    };
  }
};
