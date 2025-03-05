import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ModelSelector } from "@/components/ModelSelector"; 
import { DataPreview } from "@/components/DataPreview";
import { FirecrawlApiKeyForm } from "@/components/FirecrawlApiKeyForm";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AIModel, 
  ScrapeConfig, 
  ProcessingConfig, 
  BusinessData, 
  ScrapingResult 
} from "@/types";
import { 
  scrapeWebsite, 
  extractDataFromHtml,
  downloadCsv,
  checkScrapingPermissions,
  getApiKey
} from "@/services/scrapeService";
import { processWithAI } from "@/services/aiService";
import { 
  saveScrapeConfig, 
  saveProcessingConfig, 
  saveScrapeResult,
  getScrapeConfigs,
  getProcessingConfigs,
  getAllBusinessData
} from "@/services/supabaseService";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

export function ScrapeForm() {
  const { toast } = useToast();
  const [result, setResult] = useState<ScrapingResult>({
    rawData: [],
    processedData: [],
    status: "idle"
  });
  const [activeTab, setActiveTab] = useState("scrape");
  
  const defaultAiInstructions = 
    "Extract and clean business information from the provided HTML. " +
    "Identify the business name, phone number, email, address, website, " +
    "city, state, industry/niche, description, and category. Format the data consistently and fill in " +
    "missing information where possible.";

  // Get saved configurations and business data
  const { data: savedScrapeConfigs } = useQuery({
    queryKey: ['scrapeConfigs'],
    queryFn: getScrapeConfigs
  });
  
  const { data: savedProcessingConfigs } = useQuery({
    queryKey: ['processingConfigs'],
    queryFn: getProcessingConfigs
  });
  
  const { data: businessData, refetch: refetchBusinessData } = useQuery({
    queryKey: ['businessData'],
    queryFn: () => getAllBusinessData()
  });
  
  const form = useForm({
    defaultValues: {
      url: "https://www.yellowpages.com/search?search_terms=restaurants&geo_location_terms=New+York%2C+NY",
      location: {
        city: "",
        state: ""
      },
      industry: "",
      selectors: {
        container: ".business-card",
        name: ".business-name",
        phone: ".phone",
        address: ".address",
        website: ".website",
        description: ".description",
        category: ".category",
        city: ".city",
        state: ".state",
        industry: ".industry",
        email: ".email"
      },
      model: "gpt-4o-mini" as AIModel,
      instructions: defaultAiInstructions,
      advanced: {
        respectRobotsTxt: true,
        useRotatingProxies: true,
        useRandomUserAgents: true,
        baseDelaySeconds: 3
      },
      firecrawl: {
        limit: 20,
        followLinks: true,
        maxDepth: 2,
        formats: ["markdown", "html"]
      }
    }
  });
  
  const handleSubmit = async (values: any) => {
    try {
      // Check if we have a Firecrawl API key
      const apiKey = getApiKey();
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please enter your Firecrawl API key first",
          variant: "destructive",
          duration: 5000
        });
        return;
      }
      
      setResult({
        ...result,
        status: "loading"
      });
    
      // Build search URL with filters if specified
      let searchUrl = values.url;
    
      // If using Yellow Pages or similar directory, automatically format the URL with filters
      if (searchUrl.includes("yellowpages.com") || searchUrl.includes("yelp.com")) {
        const baseUrl = searchUrl.split("?")[0];
        const industry = values.industry ? encodeURIComponent(values.industry) : "businesses";
        let location = "";
      
        if (values.location.city && values.location.state) {
          location = `${values.location.city}%2C+${values.location.state}`;
        } else if (values.location.state) {
          location = values.location.state;
        } else if (values.location.city) {
          location = values.location.city;
        }
      
        if (location) {
          searchUrl = `${baseUrl}search?search_terms=${industry}&geo_location_terms=${location}`;
        } else {
          searchUrl = `${baseUrl}search?search_terms=${industry}`;
        }
      }
    
      // Configure scraping with firecrawl options
      const scrapeConfig: ScrapeConfig = {
        url: searchUrl,
        location: values.location.city || values.location.state ? {
          city: values.location.city,
          state: values.location.state
        } : undefined,
        industry: values.industry || undefined,
        selectors: values.selectors,
        respectRobotsTxt: values.advanced.respectRobotsTxt,
        useRotatingProxies: values.advanced.useRotatingProxies,
        useRandomUserAgents: values.advanced.useRandomUserAgents,
        baseDelaySeconds: values.advanced.baseDelaySeconds,
        firecrawlApiKey: apiKey,
        firecrawlOptions: {
          limit: values.firecrawl.limit,
          maxDepth: values.firecrawl.maxDepth,
          formats: values.firecrawl.formats
        }
      };
    
      // Configure AI processing
      const processingConfig: ProcessingConfig = {
        model: values.model,
        instructions: values.instructions,
        temperature: 0.2
      };
    
      // Start scraping
      toast({
        title: "Scraping started",
        description: `Scraping data from ${searchUrl} using Firecrawl`,
        duration: 3000
      });
    
      const rawData = await scrapeWebsite(scrapeConfig);
    
      if (!rawData || rawData.length === 0) {
        toast({
          title: "No data found",
          description: "No business listings found with the given criteria. Please try different search parameters.",
          variant: "destructive",
          duration: 5000
        });
        
        setResult({
          ...result,
          status: "error",
          error: "No data found"
        });
        return;
      }
      
      toast({
        title: "Data extracted",
        description: `Extracted ${rawData.length} items. Processing with AI...`,
        duration: 3000
      });
    
      // Process with AI
      const processedData = await processWithAI(rawData, processingConfig);
    
      // Update result
      const updatedResult = {
        rawData,
        processedData,
        status: "success" as const
      };
    
      setResult(updatedResult);
    
      toast({
        title: "Success",
        description: `Processed ${processedData.length} business records`,
        duration: 5000
      });
    
      // Save data to Supabase
      try {
        const savedScrapeConfig = await saveScrapeConfig(scrapeConfig);
        const savedProcessingConfig = await saveProcessingConfig(processingConfig);
        await saveScrapeResult(
          savedScrapeConfig.id,
          savedProcessingConfig.id,
          updatedResult
        );
        toast({
          title: "Data saved",
          description: "The scraping result has been saved to the database",
          duration: 3000
        });
      
        // Refresh business data
        refetchBusinessData();
      } catch (saveError) {
        console.error("Error saving to Supabase:", saveError);
        toast({
          title: "Warning",
          description: "Scraping completed but could not save to database",
          variant: "destructive",
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Error during scraping:", error);
      setResult({
        ...result,
        status: "error",
        error: (error as Error).message
      });
    
      toast({
        title: "Error",
        description: `Failed to scrape: ${(error as Error).message}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };
  
  const handleExportCsv = () => {
    if (result.processedData.length > 0) {
      downloadCsv(result.processedData);
    } else if (businessData && businessData.length > 0) {
      downloadCsv(businessData);
    } else {
      toast({
        title: "No data to export",
        description: "Please scrape some data first",
        variant: "destructive",
        duration: 3000
      });
    }
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px] mx-auto mb-6">
          <TabsTrigger value="scrape">Scrape New Data</TabsTrigger>
          <TabsTrigger value="results">Saved Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scrape" className="space-y-6">
          <FirecrawlApiKeyForm />
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out hover:shadow-md">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-900 dark:text-gray-100">Website URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://www.example.com/business-directory"
                              {...field}
                              className="transition-all duration-200"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the URL of the website you want to scrape with Firecrawl
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-gray-100">Industry/Niche</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Restaurants, Plumbers, Lawyers"
                                {...field}
                                className="transition-all duration-200"
                              />
                            </FormControl>
                            <FormDescription>
                              Specify the industry you want to target
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-gray-100">City</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. New York, Los Angeles"
                                {...field}
                                className="transition-all duration-200"
                              />
                            </FormControl>
                            <FormDescription>
                              Filter by city (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-gray-100">State</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. NY, CA, TX"
                                {...field}
                                className="transition-all duration-200"
                              />
                            </FormControl>
                            <FormDescription>
                              Filter by state (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Accordion type="single" collapsible defaultValue="firecrawl">
                        <AccordionItem value="firecrawl">
                          <AccordionTrigger className="text-gray-900 dark:text-gray-100 font-medium">
                            Firecrawl Options
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <FormField
                                control={form.control}
                                name="firecrawl.limit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Page Limit</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min={1} 
                                        max={100} 
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Maximum number of pages to crawl
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="firecrawl.maxDepth"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Max Depth</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min={1} 
                                        max={5} 
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      How many links deep to crawl
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="firecrawl.followLinks"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel>Follow Links</FormLabel>
                                      <FormDescription>
                                        Crawl links found on the page
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="selectors">
                          <AccordionTrigger className="text-gray-900 dark:text-gray-100 font-medium">
                            Advanced Selectors (Optional)
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <FormField
                                control={form.control}
                                name="selectors.container"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Container Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".business-card" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      CSS selector for each business container
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".business-name" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".phone" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.address"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Address Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".address" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.website"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Website Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".website" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".email" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".description" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".category" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>City Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".city" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>State Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".state" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="selectors.industry"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Industry Selector</FormLabel>
                                    <FormControl>
                                      <Input placeholder=".industry" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="advanced">
                          <AccordionTrigger className="text-gray-900 dark:text-gray-100 font-medium">
                            Advanced Crawling Options
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 p-2">
                              <FormField
                                control={form.control}
                                name="advanced.respectRobotsTxt"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel>Respect robots.txt</FormLabel>
                                      <FormDescription>
                                        Follow website rules about what can be scraped
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="advanced.useRotatingProxies"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel>Use rotating proxies</FormLabel>
                                      <FormDescription>
                                        Switch between different IPs to avoid blocks
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="advanced.useRandomUserAgents"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel>Use random user agents</FormLabel>
                                      <FormDescription>
                                        Change browser identifiers to avoid detection
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="advanced.baseDelaySeconds"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Request Delay (seconds)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Time between requests to avoid rate limiting
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  AI Processing
                </h2>
                
                <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel className="text-lg font-medium text-gray-900 dark:text-gray-100">
                              Select AI Model
                            </FormLabel>
                            <FormControl>
                              <ModelSelector
                                selectedModel={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-900 dark:text-gray-100">
                              AI Processing Instructions
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Instructions for the AI model..."
                                className="min-h-32 resize-none transition-all duration-200"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Customize how the AI should process and enhance the data
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={result.status === "loading" || !getApiKey()}
                  className="px-8 py-6 text-lg font-medium bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {result.status === "loading" ? "Processing..." : "Start Scraping with Firecrawl"}
                </Button>
              </div>
            </form>
          </Form>
          
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Data Preview
              </h2>
              
              <Button 
                variant="outline" 
                onClick={handleExportCsv}
                disabled={result.processedData.length === 0 && (!businessData || businessData.length === 0)}
              >
                Export to CSV
              </Button>
            </div>
            
            <DataPreview 
              data={result.processedData.length > 0 ? result.processedData : (businessData || [])} 
              loading={result.status === "loading"} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Saved Business Data
            </h2>
            
            <Button 
              variant="outline" 
              onClick={handleExportCsv}
              disabled={!businessData || businessData.length === 0}
            >
              Export to CSV
            </Button>
          </div>
          
          <DataPreview 
            data={businessData || []} 
            loading={false} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
