
import FirecrawlApp from '@mendable/firecrawl-js';
import { ScrapeConfig, BusinessData } from '@/types';

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
  pages?: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

// Local storage key for storing API key
const API_KEY_STORAGE_KEY = 'firecrawl_api_key';

/**
 * Save Firecrawl API key to local storage
 */
export const saveApiKey = (apiKey: string): void => {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  console.log('Firecrawl API key saved');
};

/**
 * Get Firecrawl API key from local storage
 */
export const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

/**
 * Test if a Firecrawl API key is valid
 */
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    console.log('Testing Firecrawl API key');
    const firecrawl = new FirecrawlApp({ apiKey });
    
    // Use a minimal test crawl to verify the API key
    const testResponse = await firecrawl.crawlUrl('https://example.com', {
      limit: 1
    });
    
    return testResponse.success;
  } catch (error) {
    console.error('Error testing Firecrawl API key:', error);
    return false;
  }
};

/**
 * Extract business data from crawled pages
 */
const extractBusinessData = (pages: any[], config: ScrapeConfig): BusinessData[] => {
  if (!pages || pages.length === 0) {
    return [];
  }
  
  return pages.map(page => {
    // Default business data object
    const businessData: BusinessData = {
      name: page.title || 'Unknown',
      website: page.url || '',
      description: page.summary || page.text?.substring(0, 200) || '',
      industry: config.industry || '',
    };
    
    // Extract email if present in content
    if (page.text) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = page.text.match(emailRegex);
      if (emails && emails.length > 0) {
        businessData.email = emails[0];
      }
    }
    
    // Extract phone if present in content
    if (page.text) {
      const phoneRegex = /(\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
      const phones = page.text.match(phoneRegex);
      if (phones && phones.length > 0) {
        businessData.phone = phones[0];
      }
    }
    
    // Add location from config
    if (config.location?.city) {
      businessData.city = config.location.city;
    }
    if (config.location?.state) {
      businessData.state = config.location.state;
    }
    
    return businessData;
  });
};

/**
 * Crawl a website using Firecrawl API
 */
export const crawlWebsite = async (config: ScrapeConfig): Promise<any[]> => {
  // Get API key from config or local storage
  const apiKey = config.firecrawlApiKey || getApiKey();
  
  if (!apiKey) {
    throw new Error('Firecrawl API key is required');
  }
  
  try {
    console.log('Starting Firecrawl crawl for URL:', config.url);
    const firecrawl = new FirecrawlApp({ apiKey });
    
    // Configure Firecrawl options
    const crawlOptions = {
      limit: config.firecrawlOptions?.limit || 20,
      maxDepth: config.firecrawlOptions?.maxDepth || 2,
      allowedDomains: config.firecrawlOptions?.allowedDomains,
      formats: config.firecrawlOptions?.formats || ["markdown", "html"]
    };
    
    // Start the crawl
    const crawlResponse = await firecrawl.crawlUrl(config.url, crawlOptions) as CrawlResponse;
    
    if (!crawlResponse.success) {
      console.error('Firecrawl error:', (crawlResponse as ErrorResponse).error);
      throw new Error((crawlResponse as ErrorResponse).error || 'Failed to crawl website');
    }
    
    console.log('Firecrawl crawl completed successfully');
    console.log('Stats:', {
      status: crawlResponse.status,
      completed: crawlResponse.completed,
      total: crawlResponse.total,
      creditsUsed: crawlResponse.creditsUsed
    });
    
    // Return the pages or data
    const pages = crawlResponse.pages || crawlResponse.data || [];
    
    // Process pages into business data format
    const businessData = extractBusinessData(pages, config);
    
    // Return both raw data and processed data
    return pages.map((page, index) => ({
      rawHtml: page.html || '',
      url: page.url,
      extractedData: businessData[index] || {}
    }));
  } catch (error) {
    console.error('Error during Firecrawl crawl:', error);
    throw error;
  }
};
