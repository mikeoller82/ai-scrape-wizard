
import { supabase } from "@/integrations/supabase/client";
import { BusinessData } from "@/types";

/**
 * Enhance business data using the Supabase Edge Function
 */
export const enhanceBusinessData = async (
  businessData: BusinessData[],
  instructions: string = "Enhance and normalize business information"
): Promise<BusinessData[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('enhance-lead-data', {
      body: {
        businessData,
        instructions
      }
    });

    if (error) throw error;
    return data.data;
  } catch (error) {
    console.error("Error enhancing business data:", error);
    throw error;
  }
};

/**
 * Get all available edge functions 
 */
export const getAvailableFunctions = async (): Promise<string[]> => {
  try {
    // Instead of using an OPTIONS method which is not allowed,
    // we'll use GET and check the response or use a predefined list
    const { data, error } = await supabase.functions.invoke('enhance-lead-data', {
      method: 'GET'
    });

    if (error) return ['enhance-lead-data'];
    return data || ['enhance-lead-data'];
  } catch (error) {
    console.error("Error getting available functions:", error);
    return ['enhance-lead-data'];
  }
};
