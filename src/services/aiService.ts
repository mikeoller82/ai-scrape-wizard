
import { AIModel, BusinessData, ProcessingConfig } from "@/types";

// Mock AI processing function - in a real implementation this would call a backend API
export const processWithAI = async (
  data: Partial<BusinessData>[], 
  config: ProcessingConfig
): Promise<BusinessData[]> => {
  console.log("Processing data with AI model:", config.model);
  console.log("Instructions:", config.instructions);
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock AI enhancement of the data
  return data.map(item => {
    const enhancedItem: BusinessData = {
      name: item.name || "Unknown Business",
      ...item,
    };
    
    // Mock some AI enhancements based on the selected model
    if (config.model === "gpt-4o") {
      if (item.description) {
        enhancedItem.description = `${item.description} (Enhanced with detailed analysis)`;
      }
      
      // Simulate email extraction if not present
      if (!item.email && item.name) {
        const domain = item.website ? 
          item.website.replace(/^https?:\/\//, '').replace(/^www\./, '') : 
          `${item.name.toLowerCase().replace(/\s+/g, '')}.com`;
        enhancedItem.email = `contact@${domain}`;
      }
    }
    
    // Add mock categorization for all models
    if (!enhancedItem.category && enhancedItem.description) {
      const description = enhancedItem.description.toLowerCase();
      
      if (description.includes("technology") || description.includes("innovative")) {
        enhancedItem.category = "Technology";
      } else if (description.includes("food") || description.includes("cafe") || description.includes("restaurant")) {
        enhancedItem.category = "Food & Dining";
      } else if (description.includes("service") || description.includes("professional")) {
        enhancedItem.category = "Professional Services";
      } else if (description.includes("plumbing") || description.includes("emergency")) {
        enhancedItem.category = "Home Services";
      } else if (description.includes("legal") || description.includes("law")) {
        enhancedItem.category = "Legal Services";
      } else {
        enhancedItem.category = "Other";
      }
    }
    
    // Extract city and state from address if not present
    if (enhancedItem.address && (!enhancedItem.city || !enhancedItem.state)) {
      const addressParts = enhancedItem.address.split(',').map(part => part.trim());
      
      if (!enhancedItem.city && addressParts.length >= 2) {
        enhancedItem.city = addressParts[addressParts.length - 2];
      }
      
      if (!enhancedItem.state && addressParts.length >= 1) {
        const lastPart = addressParts[addressParts.length - 1];
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s+\d{5}/);
        if (stateZipMatch && stateZipMatch[1]) {
          enhancedItem.state = stateZipMatch[1];
        }
      }
    }
    
    // Extract or infer industry based on category and description if not present
    if (!enhancedItem.industry) {
      if (enhancedItem.category === "Food & Dining") {
        enhancedItem.industry = "Restaurants";
      } else if (enhancedItem.category === "Home Services") {
        enhancedItem.industry = "Home Improvement";
      } else if (enhancedItem.category === "Technology") {
        enhancedItem.industry = "Tech Companies";
      } else if (enhancedItem.category === "Professional Services") {
        enhancedItem.industry = "Consulting";
      } else if (enhancedItem.category === "Legal Services") {
        enhancedItem.industry = "Lawyers";
      } else {
        enhancedItem.industry = enhancedItem.category || "Other";
      }
    }
    
    return enhancedItem;
  });
};

export const getAvailableModels = (): { id: AIModel; name: string; description: string }[] => {
  return [
    { 
      id: "gpt-4o-mini", 
      name: "GPT-4o Mini", 
      description: "Fast and cost-effective for most use cases" 
    },
    { 
      id: "gpt-4o", 
      name: "GPT-4o", 
      description: "Most capable model for complex tasks" 
    },
    { 
      id: "claude-3-haiku", 
      name: "Claude 3 Haiku", 
      description: "Fast, efficient text processing" 
    },
    { 
      id: "claude-3-sonnet", 
      name: "Claude 3 Sonnet", 
      description: "Balance of speed and capability" 
    },
    { 
      id: "llama-3-8b", 
      name: "Llama 3 (8B)", 
      description: "Open source, lightweight model" 
    },
    { 
      id: "llama-3-70b", 
      name: "Llama 3 (70B)", 
      description: "Advanced open source large model" 
    }
  ];
};
