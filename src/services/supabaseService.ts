
import { supabase } from "@/integrations/supabase/client";
import { 
  ScrapeConfig, 
  ProcessingConfig, 
  BusinessData, 
  ScrapingResult as AppScrapingResult 
} from "@/types";

// Save scrape configuration
export const saveScrapeConfig = async (config: ScrapeConfig) => {
  const { data, error } = await supabase
    .from('scrape_configs')
    .insert({
      url: config.url,
      location_city: config.location?.city,
      location_state: config.location?.state,
      industry: config.industry,
      selectors: config.selectors,
      data_fields: config.dataFields
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Save processing configuration
export const saveProcessingConfig = async (config: ProcessingConfig) => {
  const { data, error } = await supabase
    .from('processing_configs')
    .insert({
      model: config.model,
      instructions: config.instructions,
      temperature: config.temperature
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Save scraping result
export const saveScrapeResult = async (
  scrapeConfigId: string,
  processingConfigId: string,
  result: AppScrapingResult
) => {
  const { data, error } = await supabase
    .from('scraping_results')
    .insert({
      scrape_config_id: scrapeConfigId,
      processing_config_id: processingConfigId,
      raw_data: result.rawData,
      processed_data: result.processedData,
      status: result.status,
      error: result.error
    })
    .select('*')
    .single();

  if (error) throw error;
  
  // If we have processed data, save business records
  if (result.processedData && result.processedData.length > 0) {
    const businessEntries = result.processedData.map((business: BusinessData) => ({
      scraping_result_id: data.id,
      name: business.name,
      phone: business.phone,
      email: business.email,
      address: business.address,
      website: business.website,
      description: business.description,
      category: business.category,
      city: business.city,
      state: business.state,
      industry: business.industry,
      additional_data: Object.keys(business)
        .filter(key => !['name', 'phone', 'email', 'address', 'website', 'description', 'category', 'city', 'state', 'industry']
        .includes(key))
        .reduce((obj, key) => {
          obj[key] = business[key];
          return obj;
        }, {} as Record<string, any>)
    }));

    const { error: businessError } = await supabase
      .from('business_data')
      .insert(businessEntries);

    if (businessError) console.error("Error saving business data:", businessError);
  }

  return data;
};

// Get saved scrape configurations
export const getScrapeConfigs = async () => {
  const { data, error } = await supabase
    .from('scrape_configs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get saved processing configurations
export const getProcessingConfigs = async () => {
  const { data, error } = await supabase
    .from('processing_configs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get scraping results
export const getScrapingResults = async (limit = 10) => {
  const { data, error } = await supabase
    .from('scraping_results')
    .select('*, scrape_config:scrape_config_id(*), processing_config:processing_config_id(*)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Get business data from a specific scraping result
export const getBusinessData = async (scrapingResultId: string) => {
  const { data, error } = await supabase
    .from('business_data')
    .select('*')
    .eq('scraping_result_id', scrapingResultId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

// Get all business data
export const getAllBusinessData = async (limit = 1000) => {
  const { data, error } = await supabase
    .from('business_data')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Delete a business record
export const deleteBusinessRecord = async (id: string) => {
  const { error } = await supabase
    .from('business_data')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
