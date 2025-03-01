
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessData {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  description?: string;
  category?: string;
  city?: string;
  state?: string;
  industry?: string;
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessData, instructions } = await req.json();
    
    if (!businessData || !Array.isArray(businessData)) {
      throw new Error('Invalid business data provided');
    }
    
    // Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Enhanced data with AI
    const enhancedData = await enhanceBusinessData(businessData, instructions || '');
    
    // Update the database with enhanced data if we have IDs
    if (enhancedData.some(item => item.id)) {
      await Promise.all(enhancedData
        .filter(item => item.id)
        .map(async (item) => {
          const { id, ...dataWithoutId } = item;
          await supabase
            .from('business_data')
            .update(dataWithoutId)
            .eq('id', id);
        })
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: enhancedData 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Enhance business data using AI
async function enhanceBusinessData(businessData: BusinessData[], instructions: string): Promise<BusinessData[]> {
  // In a real-world scenario, this would call an AI model API
  // For now, we'll enhance the data with some basic logic
  
  return businessData.map(business => {
    const enhanced = { ...business };
    
    // Format phone numbers consistently
    if (enhanced.phone) {
      enhanced.phone = formatPhoneNumber(enhanced.phone);
    }
    
    // Format email addresses to lowercase
    if (enhanced.email) {
      enhanced.email = enhanced.email.toLowerCase();
    }
    
    // Ensure website has http/https prefix
    if (enhanced.website && !enhanced.website.match(/^https?:\/\//)) {
      enhanced.website = `https://${enhanced.website}`;
    }
    
    // Extract city/state from address if not present
    if (enhanced.address && (!enhanced.city || !enhanced.state)) {
      const addressParts = enhanced.address.split(',').map(part => part.trim());
      
      // Try to extract city and state
      if (!enhanced.city && addressParts.length >= 2) {
        enhanced.city = addressParts[addressParts.length - 2];
      }
      
      if (!enhanced.state && addressParts.length >= 1) {
        const lastPart = addressParts[addressParts.length - 1];
        const stateMatch = lastPart.match(/([A-Z]{2})/);
        if (stateMatch && stateMatch[1]) {
          enhanced.state = stateMatch[1];
        }
      }
    }
    
    // Generate email if missing but we have website
    if (!enhanced.email && enhanced.website) {
      const domain = enhanced.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      enhanced.email = `contact@${domain}`;
    }
    
    return enhanced;
  });
}

// Format phone number to (XXX) XXX-XXXX format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format the phone number
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 11)}`;
  }
  
  // If the phone number doesn't match expected formats, return the original
  return phone;
}
