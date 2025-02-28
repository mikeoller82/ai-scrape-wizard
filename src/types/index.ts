
export interface BusinessData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

export type AIModel = 
  | "gpt-4o-mini"
  | "gpt-4o"
  | "claude-3-haiku"
  | "claude-3-sonnet"
  | "llama-3-8b"
  | "llama-3-70b";

export interface ScrapeConfig {
  url: string;
  selectors?: {
    container?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    description?: string;
    category?: string;
    [key: string]: string | undefined;
  };
  dataFields?: string[];
}

export interface ProcessingConfig {
  model: AIModel;
  instructions: string;
  temperature?: number;
}

export interface ScrapingResult {
  rawData: any[];
  processedData: BusinessData[];
  status: "idle" | "loading" | "success" | "error";
  error?: string;
}
