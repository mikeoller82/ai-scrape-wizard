
/**
 * Rules extracted from a robots.txt file
 */
export interface RobotsTxtRules {
  allowedPaths: string[];
  disallowedPaths: string[];
  crawlDelay: number | null;
}

/**
 * Parser for robots.txt files to respect website crawling rules
 */
export class RobotsTxtParser {
  /**
   * Fetch and parse robots.txt for a given domain
   */
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
  
  /**
   * Check if a specific path is allowed according to robots.txt rules
   */
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
