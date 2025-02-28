
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/ModelSelector"; 
import { DataPreview } from "@/components/DataPreview";
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
import { 
  AIModel, 
  ScrapeConfig, 
  ProcessingConfig, 
  BusinessData, 
  ScrapingResult 
} from "@/types";
import { 
  scrapeWebsite, 
  extractDataFromHtml 
} from "@/services/scrapeService";
import { processWithAI } from "@/services/aiService";
import { useForm } from "react-hook-form";

export function ScrapeForm() {
  const { toast } = useToast();
  const [result, setResult] = useState<ScrapingResult>({
    rawData: [],
    processedData: [],
    status: "idle"
  });
  
  const defaultAiInstructions = 
    "Extract and clean business information from the provided HTML. " +
    "Identify the business name, phone number, email, address, website, " +
    "city, state, industry/niche, description, and category. Format the data consistently and fill in " +
    "missing information where possible.";
  
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
        industry: ".industry"
      },
      model: "gpt-4o-mini" as AIModel,
      instructions: defaultAiInstructions
    }
  });
  
  const handleSubmit = async (values: any) => {
    try {
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
      
      // Configure scraping
      const scrapeConfig: ScrapeConfig = {
        url: searchUrl,
        location: values.location.city || values.location.state ? {
          city: values.location.city,
          state: values.location.state
        } : undefined,
        industry: values.industry || undefined,
        selectors: values.selectors
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
        description: `Scraping data from ${searchUrl}`,
        duration: 3000
      });
      
      const rawData = await scrapeWebsite(scrapeConfig);
      
      // Extract structured data from raw HTML
      const extractedData = extractDataFromHtml(rawData, scrapeConfig);
      
      toast({
        title: "Data extracted",
        description: `Extracted ${extractedData.length} items. Processing with AI...`,
        duration: 3000
      });
      
      // Process with AI
      const processedData = await processWithAI(extractedData, processingConfig);
      
      // Update result
      setResult({
        rawData,
        processedData,
        status: "success"
      });
      
      toast({
        title: "Success",
        description: `Processed ${processedData.length} business records`,
        duration: 5000
      });
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
  
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
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
                        Enter the URL of the website you want to scrape
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
                  <Accordion type="single" collapsible defaultValue="selectors">
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
              disabled={result.status === "loading"}
              className="px-8 py-6 text-lg font-medium bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {result.status === "loading" ? "Processing..." : "Start Scraping"}
            </Button>
          </div>
        </form>
      </Form>
            
      <div className="mt-8">
        <DataPreview 
          data={result.processedData} 
          loading={result.status === "loading"} 
        />
      </div>
    </div>
  );
}
