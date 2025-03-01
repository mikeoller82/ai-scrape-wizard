
import { 
  ToolUseRequest, 
  ToolUseResponse, 
  ToolCall,
  Tool,
  AVAILABLE_TOOLS
} from "@/types/aiTypes";

// Calculate function to evaluate expressions
function calculate(expression: string): string {
  try {
    // Use Function constructor instead of eval for safer evaluation
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expression}`)();
    return JSON.stringify({ result });
  } catch (error) {
    return JSON.stringify({ error: "Invalid expression" });
  }
}

// Mock weather data function
function getCurrentWeather(location: string, unit: string = "fahrenheit"): string {
  // This would be an actual API call in production
  const mockWeatherData: Record<string, any> = {
    "New York, NY": { temp: 72, condition: "Sunny", humidity: 45 },
    "San Francisco, CA": { temp: 65, condition: "Foggy", humidity: 75 },
    "Miami, FL": { temp: 85, condition: "Partly Cloudy", humidity: 80 },
    "Chicago, IL": { temp: 58, condition: "Windy", humidity: 50 },
    "Los Angeles, CA": { temp: 75, condition: "Clear", humidity: 35 },
  };

  // Adjust temperature if celsius
  const tempModifier = unit === "celsius" ? -17.8 : 0;
  
  const cityData = mockWeatherData[location] || { 
    temp: Math.floor(Math.random() * 35) + 50, 
    condition: ["Sunny", "Cloudy", "Rainy", "Clear"][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 50) + 30
  };
  
  return JSON.stringify({
    location,
    temperature: Math.round(cityData.temp + tempModifier),
    unit,
    condition: cityData.condition,
    humidity: cityData.humidity,
    timestamp: new Date().toISOString()
  });
}

// Extract business info function
function extractBusinessInfo(input: string, fields?: string): string {
  // Simple mock implementation - in production would use actual NLP
  const fieldList = fields ? fields.split(',') : [
    'name', 'phone', 'email', 'address', 'website', 
    'description', 'category', 'city', 'state', 'industry'
  ];
  
  // Very simple extraction logic as a demonstration
  const result: Record<string, string> = {};
  
  // Extract name (naive implementation for demo purposes)
  if (fieldList.includes('name') && input.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*(?:, Inc\.?| LLC| Co\.|, Ltd\.?))/)) {
    result.name = input.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*(?:, Inc\.?| LLC| Co\.|, Ltd\.?))/)?.[0] || "";
  }
  
  // Extract phone (naive implementation for demo purposes)
  if (fieldList.includes('phone') && input.match(/(\(\d{3}\) \d{3}-\d{4}|\d{3}-\d{3}-\d{4})/)) {
    result.phone = input.match(/(\(\d{3}\) \d{3}-\d{4}|\d{3}-\d{3}-\d{4})/)?.[0] || "";
  }
  
  // Extract email (naive implementation for demo purposes)
  if (fieldList.includes('email') && input.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)) {
    result.email = input.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[0] || "";
  }
  
  // Extract website (naive implementation for demo purposes)
  if (fieldList.includes('website') && input.match(/(https?:\/\/[^\s]+)/)) {
    result.website = input.match(/(https?:\/\/[^\s]+)/)?.[0] || "";
  }
  
  return JSON.stringify(result);
}

// Map of available tool implementations
const TOOL_IMPLEMENTATIONS: Record<string, Function> = {
  "calculate": (args: any) => calculate(args.expression),
  "get_current_weather": (args: any) => getCurrentWeather(args.location, args.unit),
  "extract_business_info": (args: any) => extractBusinessInfo(args.input, args.fields)
};

// Execute a tool call with the appropriate function
export function executeToolCall(toolCall: ToolCall): string {
  try {
    const functionName = toolCall.function.name;
    const implementation = TOOL_IMPLEMENTATIONS[functionName];
    
    if (!implementation) {
      return JSON.stringify({ error: `Tool ${functionName} not implemented` });
    }
    
    const args = JSON.parse(toolCall.function.arguments);
    return implementation(args);
  } catch (error) {
    console.error("Error executing tool call:", error);
    return JSON.stringify({ error: "Failed to execute tool" });
  }
}

// Process a request using the appropriate AI model and tools
export async function processWithTools(request: ToolUseRequest): Promise<ToolUseResponse> {
  // In a real implementation, this would call an external API like Groq or OpenAI
  console.log("Processing with tools:", request);
  
  // For demo purposes, we'll simulate an AI response with tool calls
  // The simulation will look at the request and decide if tool calls are needed
  
  const lastMessage = request.messages[request.messages.length - 1];
  const userContent = lastMessage.content.toLowerCase();
  
  // Simple routing based on keywords
  let toolToUse: Tool | null = null;
  
  if (userContent.includes("calculate") || userContent.includes("math") || 
      userContent.includes("add") || userContent.includes("multiply") ||
      userContent.includes("subtract") || userContent.includes("divide")) {
    toolToUse = AVAILABLE_TOOLS.calculate;
  } else if (userContent.includes("weather") || userContent.includes("temperature") ||
            userContent.includes("forecast") || userContent.includes("rain") ||
            userContent.includes("sunny") || userContent.includes("cloud")) {
    toolToUse = AVAILABLE_TOOLS.get_current_weather;
  } else if (userContent.includes("extract") || userContent.includes("business") ||
            userContent.includes("company") || userContent.includes("information") ||
            userContent.includes("data")) {
    toolToUse = AVAILABLE_TOOLS.extract_business_info;
  }
  
  // If we found a tool to use, generate a simulated tool call
  if (toolToUse && request.tools?.find(t => t.function.name === toolToUse?.function.name)) {
    // Create a simulated tool call
    const toolCall: ToolCall = {
      id: `call_${Math.floor(Math.random() * 1000000).toString(16)}`,
      type: "function",
      function: {
        name: toolToUse.function.name,
        arguments: "{}"
      }
    };
    
    // Populate arguments based on the tool
    if (toolToUse.function.name === "calculate") {
      // Extract a potential math expression
      const mathExpression = userContent.match(/calculate\s+([\d\s\+\-\*\/\(\)\.]+)/i)?.[1] || 
                             userContent.match(/([\d\s\+\-\*\/\(\)\.]+)/)?.[1] || 
                             "1+1";
      toolCall.function.arguments = JSON.stringify({ expression: mathExpression });
    } else if (toolToUse.function.name === "get_current_weather") {
      // Extract a potential location
      const location = userContent.match(/weather (?:in|for) ([a-z\s,]+)/i)?.[1] || 
                      userContent.match(/(?:in|for) ([a-z\s,]+)/i)?.[1] || 
                      "New York, NY";
      toolCall.function.arguments = JSON.stringify({ 
        location: location,
        unit: userContent.includes("celsius") ? "celsius" : "fahrenheit"
      });
    } else if (toolToUse.function.name === "extract_business_info") {
      // Use a mock input for extraction
      toolCall.function.arguments = JSON.stringify({ 
        input: "Acme Corporation, Inc. Contact us at (555) 123-4567 or info@acmecorp.com. Visit our website at https://www.acmecorp.com",
        fields: "name,phone,email,website"
      });
    }
    
    // Return a simulated response with the tool call
    return {
      id: `chatcmpl-${Math.floor(Math.random() * 1000000).toString(16)}`,
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "",
            tool_calls: [toolCall]
          },
          finish_reason: "tool_calls"
        }
      ]
    };
  }
  
  // If no tool needed, return a standard message response
  return {
    id: `chatcmpl-${Math.floor(Math.random() * 1000000).toString(16)}`,
    model: request.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: generateFakeResponse(userContent)
        },
        finish_reason: "stop"
      }
    ]
  };
}

// Generate a fake AI response for demo purposes
function generateFakeResponse(userContent: string): string {
  if (userContent.includes("hello") || userContent.includes("hi")) {
    return "Hello! I'm the DataZap AI assistant. How can I help you today?";
  } else if (userContent.includes("help")) {
    return "I can help you with various tasks including calculations, getting weather information, and extracting business information from text. Just let me know what you need!";
  } else {
    return "I understand you're looking for information. I can help with calculations, weather data, and business information extraction. Could you provide more specific details about what you need?";
  }
}
