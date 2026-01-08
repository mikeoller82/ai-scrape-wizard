
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
const extractReviewCount = (text?: string): number | null => {
  if (!text) {
    return null;
  }
  const match = text.match(/(\d{1,4})\s+reviews?/i);
  if (!match) {
    return null;
  }
  const count = Number.parseInt(match[1], 10);
  return Number.isNaN(count) ? null : count;
};

const normalizeLink = (link: unknown): string | null => {
  if (!link) {
    return null;
  }
  if (typeof link === 'string') {
    return link;
  }
  if (typeof link === 'object') {
    const linkObject = link as { href?: string; url?: string };
    return linkObject.href || linkObject.url || null;
  }
  return null;
};

const extractWebsiteFromMetadata = (metadata: any, pageUrl?: string): string => {
  const links = metadata?.links;
  if (!links) {
    return pageUrl || '';
  }

  const linkList = Array.isArray(links) ? links : [links];
  const candidates = linkList
    .map(normalizeLink)
    .filter((link): link is string => Boolean(link))
    .map(link => link.trim())
    .filter(link => link.length > 0);

  const firstExternal = candidates.find(link => {
    const lower = link.toLowerCase();
    if (pageUrl && lower === pageUrl.toLowerCase()) {
      return false;
    }
    return !lower.includes('google.com/maps') && !lower.includes('google.com/search');
  });

  return firstExternal || pageUrl || '';
};

const assessWebsiteQuality = (website?: string, text?: string) => {
  if (!website) {
    return { hasWebsite: false, websiteQuality: 'none' };
  }

  const lowerWebsite = website.toLowerCase();
  const lowerText = text?.toLowerCase() || '';
  const looksLikeDirectory = /(facebook|instagram|yelp|angi|homeadvisor|thumbtack|bbb\.org)/.test(lowerWebsite);
  const looksUnderConstruction = /under construction|coming soon|not available|no website/i.test(lowerText);

  if (looksLikeDirectory || looksUnderConstruction) {
    return { hasWebsite: true, websiteQuality: 'poor' };
  }

  return { hasWebsite: true, websiteQuality: 'good' };
};

const extractBusinessData = (pages: any[], config: ScrapeConfig): BusinessData[] => {
  if (!pages || pages.length === 0) {
    return [];
  }
  
  return pages.map(page => {
    const website = extractWebsiteFromMetadata(page.metadata, page.url);
    const reviewCount = extractReviewCount(page.text || page.summary);
    const { hasWebsite, websiteQuality } = assessWebsiteQuality(website, page.text || page.summary);

    // Default business data object with all fields initialized
    const businessData: BusinessData = {
      name: page.title || 'Unknown',
      phone: '',
      email: '',
      address: '',
      website,
      description: page.summary || page.text?.substring(0, 200) || '',
      category: '',
      city: '',
      state: '',
      industry: config.industry || '',
      reviewCount,
      hasWebsite,
      websiteQuality
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

const applyLeadCriteria = (
  pages: any[],
  businessData: BusinessData[],
  criteria?: ScrapeConfig['leadCriteria']
) => {
  if (!criteria) {
    return pages.map((page, index) => ({ page, data: businessData[index] }));
  }

  const maxReviews = criteria.maxReviews ?? 20;
  const requirePoorWebsite = criteria.requirePoorWebsite ?? true;

  return pages
    .map((page, index) => ({ page, data: businessData[index] }))
    .filter(({ data }) => {
      const reviewCount = typeof data.reviewCount === 'number' ? data.reviewCount : null;
      if (reviewCount === null || reviewCount > maxReviews) {
        return false;
      }
      if (!requirePoorWebsite) {
        return true;
      }
      return data.websiteQuality === 'none' || data.websiteQuality === 'poor';
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
    
    // Configure Firecrawl options - REMOVE formats key that's causing the error
    const crawlOptions = {
      limit: config.firecrawlOptions?.limit || 20,
      maxDepth: config.firecrawlOptions?.maxDepth || 2,
      allowedDomains: config.firecrawlOptions?.allowedDomains
      // Removed the 'formats' parameter as it's not recognized by the API
    };
    
    console.log('Crawl options:', crawlOptions);
    
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
    const filteredResults = applyLeadCriteria(pages, businessData, config.leadCriteria);
    
    // Return expanded raw data with all available fields for debugging
    return filteredResults.map(({ page, data }, index) => ({
      rawHtml: page.html || '',
      url: page.url,
      title: page.title || '',
      text: page.text || '',
      summary: page.summary || '',
      metadata: page.metadata || {},
      extractedData: data || {},
      // Convert the extracted data to a flattened string representation for display
      extractedDataString: JSON.stringify(data || {}, null, 2)
    }));
  } catch (error) {
    console.error('Error during Firecrawl crawl:', error);
    throw error;
  }
};
