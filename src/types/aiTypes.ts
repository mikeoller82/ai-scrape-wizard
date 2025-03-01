
import { AIModel } from "./index";

export type ToolType = "function";

export interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
}

export interface ToolParametersSchema {
  type: string;
  properties: Record<string, ToolParameter>;
  required?: string[];
}

export interface Tool {
  type: ToolType;
  function: {
    name: string;
    description: string;
    parameters: ToolParametersSchema;
  };
}

export interface ToolCall {
  id: string;
  type: ToolType;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResponse {
  tool_call_id: string;
  role: "tool";
  name: string;
  content: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
}

export interface ToolUseRequest {
  model: AIModel | string;
  messages: ChatMessage[];
  tools?: Tool[];
  tool_choice?: "auto" | "none" | { type: ToolType; function: { name: string } };
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface ToolUseResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: "stop" | "length" | "tool_calls";
  }>;
}

// Available tools we can use with our AI
export const AVAILABLE_TOOLS: Record<string, Tool> = {
  calculate: {
    type: "function",
    function: {
      name: "calculate",
      description: "Evaluate a mathematical expression",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The mathematical expression to evaluate"
          }
        },
        required: ["expression"]
      }
    }
  },
  get_current_weather: {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather in a given location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA"
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "The unit of temperature"
          }
        },
        required: ["location"]
      }
    }
  },
  extract_business_info: {
    type: "function",
    function: {
      name: "extract_business_info",
      description: "Extract structured business information from raw text or HTML",
      parameters: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "The raw text or HTML content to extract information from"
          },
          fields: {
            type: "string",
            description: "Comma-separated list of fields to extract (name,phone,email,address,website,description,category,city,state,industry)"
          }
        },
        required: ["input"]
      }
    }
  }
};

// Models that support tool use
export const TOOL_ENABLED_MODELS: AIModel[] = [
  "gpt-4o",
  "gpt-4o-mini",
  "claude-3-haiku",
  "claude-3-sonnet"
];
