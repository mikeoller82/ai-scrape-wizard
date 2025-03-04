
import { ScrapeConfig, BusinessData } from "@/types";

// Enhanced email extraction regex patterns
const EMAIL_REGEX_PATTERNS = [
  /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  /mailto:([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  /([a-zA-Z0-9._-]+\s*[\[\(\{]at[\]\)\}]\s*[a-zA-Z0-9._-]+\s*[\[\(\{]dot[\]\)\}]\s*[a-zA-Z0-9_-]+)/gi,
  /([a-zA-Z0-9._-]+\s*@\s*[a-zA-Z0-9._-]+\s*\.\s*[a-zA-Z0-9_-]+)/gi
];

/**
 * Extract email addresses from text using multiple regex patterns
 */
export function extractEmailsFromText(text: string): string[] {
  const emails = new Set<string>();
  
  for (const pattern of EMAIL_REGEX_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        let email = match.replace(/\s*[\[\(\{]at[\]\)\}]\s*/gi, '@')
                       .replace(/\s*[\[\(\{]dot[\]\)\}]\s*/gi, '.')
                       .replace(/\s+/g, '');
        
        email = email.replace(/[^\w.@+-]+$/, '');
        
        if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/.test(email)) {
          emails.add(email);
        }
      });
    }
  }
  
  // Also try heuristic approach to find obfuscated emails
  try {
    const obfuscatedPattern = /([a-zA-Z0-9._-]+)\s*(?:[\[\(\{]|\[|\(|at|@|AT)\s*([a-zA-Z0-9._-]+)\s*(?:[\]\)\}]|\]|\)|dot|DOT|\.)\s*([a-zA-Z0-9_-]+)/g;
    const obfuscatedMatches = Array.from(text.matchAll(obfuscatedPattern));
    
    for (const match of obfuscatedMatches) {
      if (match.length >= 4) {
        const reconstructed = `${match[1]}@${match[2]}.${match[3]}`;
        if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/.test(reconstructed)) {
          emails.add(reconstructed);
        }
      }
    }
  } catch (e) {
    console.error("Error in obfuscated email detection:", e);
  }
  
  return Array.from(emails);
}

/**
 * Find "Contact" or "About" links in HTML
 */
export function findContactLinks(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const links = Array.from(doc.querySelectorAll('a'));
  const contactLinks: string[] = [];
  
  const contactTerms = ['contact', 'get in touch', 'reach us', 'email us', 'about us', 'about', 'our team'];
  
  for (const link of links) {
    const href = link.getAttribute('href');
    const text = link.textContent?.toLowerCase() || '';
    
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      if (contactTerms.some(term => href.toLowerCase().includes(term) || text.includes(term))) {
        contactLinks.push(href);
      }
    }
  }
  
  return contactLinks;
}

/**
 * Enhance results with email addresses by checking website pages and contact pages
 */
export async function enhanceResultsWithEmails(
  results: any[], 
  config: ScrapeConfig, 
  corsProxies: string[],
  getHeaders: (userAgent: string) => Record<string, string>,
  getRandomUserAgent: () => string
): Promise<void> {
  const userAgent = config.useRandomUserAgents 
    ? getRandomUserAgent() 
    : "Mozilla/5.0 (compatible; Crawl4AI/0.5.1; +https://github.com/unclecode/crawl4ai)";
  
  const headers = getHeaders(userAgent);
  
  // First pass: check if we already have emails in the results
  let emailsFound = 0;
  for (const result of results) {
    if (result.extractedData.email) {
      emailsFound++;
    }
  }
  
  console.log(`Found ${emailsFound} emails in initial results`);
  
  // If we have enough emails already, don't waste resources trying to get more
  if (emailsFound >= results.length * 0.7) {
    console.log("Sufficient emails already found, skipping enhancement");
    return;
  }
  
  // Determine how many pages to scan based on the number of results
  const maxPagesToScan = Math.min(20, results.length);
  
  console.log(`Enhancing up to ${maxPagesToScan} results with email extraction`);
  
  // Process in batches to avoid overwhelming the network
  const batchSize = 3;
  for (let i = 0; i < maxPagesToScan; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    const batchPromises = batch.map(async (result) => {
      if (result.extractedData.email || !result.url) {
        return;
      }
      
      // Add jitter to delay to look more human
      const baseDelay = config.baseDelaySeconds || 3;
      const delay = baseDelay * 1000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      let pageHtml = '';
      let targetUrl;
      
      // Ensure the URL is properly formatted
      try {
        if (!result.url.startsWith('http')) {
          targetUrl = encodeURIComponent(`https://${result.url}`);
        } else {
          targetUrl = encodeURIComponent(result.url);
        }
      } catch (e) {
        console.error(`Invalid URL: ${result.url}`);
        return;
      }
      
      for (let j = 0; j < corsProxies.length; j++) {
        try {
          console.log(`Fetching ${result.url} via CORS proxy ${j+1}`);
          
          const response = await fetch(`${corsProxies[j]}${targetUrl}`, {
            method: 'GET',
            headers: headers,
          });
          
          if (response.ok) {
            pageHtml = await response.text();
            console.log(`Successfully fetched ${pageHtml.length} bytes from ${result.url}`);
            break;
          }
        } catch (error) {
          console.error(`Error fetching ${result.url} with proxy ${j+1}:`, error);
        }
      }
      
      if (pageHtml && pageHtml.length > 100) {
        // Enhanced email extraction logic
        const emails = extractEmailsFromText(pageHtml);
        
        // Also try to find "contact" or "about" page links
        if (emails.length === 0) {
          const contactLinks = findContactLinks(pageHtml);
          
          if (contactLinks.length > 0) {
            console.log(`Found ${contactLinks.length} potential contact page links for ${result.extractedData.name}`);
            
            // Try to fetch the first contact page
            for (const contactLink of contactLinks.slice(0, 2)) { // Try at most 2 contact pages
              try {
                let contactUrl;
                if (contactLink.startsWith('http')) {
                  contactUrl = contactLink;
                } else if (contactLink.startsWith('/')) {
                  // Handle relative URLs
                  try {
                    const urlObj = new URL(result.url.startsWith('http') ? result.url : `https://${result.url}`);
                    contactUrl = `${urlObj.origin}${contactLink}`;
                  } catch (e) {
                    continue;
                  }
                } else {
                  continue;
                }
                
                console.log(`Checking contact page: ${contactUrl}`);
                
                // Add a small delay between fetches
                await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
                
                let contactHtml = '';
                const encodedContactUrl = encodeURIComponent(contactUrl);
                
                for (let k = 0; k < corsProxies.length; k++) {
                  try {
                    const response = await fetch(`${corsProxies[k]}${encodedContactUrl}`, {
                      method: 'GET',
                      headers: headers,
                    });
                    
                    if (response.ok) {
                      contactHtml = await response.text();
                      break;
                    }
                  } catch (err) {
                    console.error(`Error fetching contact page with proxy ${k+1}:`, err);
                  }
                }
                
                if (contactHtml && contactHtml.length > 100) {
                  const contactEmails = extractEmailsFromText(contactHtml);
                  if (contactEmails.length > 0) {
                    emails.push(...contactEmails);
                    break; // We found emails, no need to check more contact pages
                  }
                }
              } catch (contactError) {
                console.error(`Error processing contact link ${contactLink}:`, contactError);
              }
            }
          }
        }
        
        if (emails.length > 0) {
          console.log(`Found email address for ${result.extractedData.name}: ${emails[0]}`);
          result.extractedData.email = emails[0];
          
          if (emails.length > 1) {
            const additionalEmails = emails.slice(1).join(', ');
            result.extractedData.description = 
              `${result.extractedData.description || ''}\nAdditional emails: ${additionalEmails}`.trim();
          }
        }
      }
    });
    
    await Promise.all(batchPromises);
    
    // Show progress
    console.log(`Processed ${Math.min((i + batchSize), maxPagesToScan)} out of ${maxPagesToScan} results`);
  }
}
