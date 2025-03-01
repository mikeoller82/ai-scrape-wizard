
export interface BusinessData {
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

export type AIModel = 
  | "gpt-4o-mini"
  | "gpt-4o"
  | "claude-3-haiku"
  | "claude-3-sonnet"
  | "llama-3-8b"
  | "llama-3-70b"
  | "llama-3.3-70b-versatile";

export interface ScrapeConfig {
  url: string;
  location?: {
    city?: string;
    state?: string;
  };
  industry?: string;
  selectors?: {
    container?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    description?: string;
    category?: string;
    city?: string;
    state?: string;
    industry?: string;
    [key: string]: string | undefined;
  };
  dataFields?: string[];
  respectRobotsTxt?: boolean;
  useRotatingProxies?: boolean;
  useRandomUserAgents?: boolean;
  baseDelaySeconds?: number;
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

export interface ScrapingPermissions {
  allowed: boolean;
  reason?: string;
  recommendedDelay?: number;
}
