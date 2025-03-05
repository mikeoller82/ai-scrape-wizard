
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { saveApiKey, getApiKey, testApiKey } from "@/services/scrapeService";

export function FirecrawlApiKeyForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(!!getApiKey());
  
  const form = useForm({
    defaultValues: {
      apiKey: "",
    },
  });
  
  const onSubmit = async (values: { apiKey: string }) => {
    setIsLoading(true);
    try {
      const isValid = await testApiKey(values.apiKey);
      
      if (isValid) {
        saveApiKey(values.apiKey);
        setHasApiKey(true);
        toast({
          title: "API Key Saved",
          description: "Your Firecrawl API key has been verified and saved.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Invalid API Key",
          description: "The provided API key could not be verified. Please check and try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify API key. Please try again later.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    localStorage.removeItem('firecrawl_api_key');
    setHasApiKey(false);
    toast({
      title: "API Key Removed",
      description: "Your Firecrawl API key has been removed.",
      duration: 3000,
    });
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Firecrawl API Key</CardTitle>
      </CardHeader>
      <CardContent>
        {hasApiKey ? (
          <div className="space-y-4">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Firecrawl API key is set and ready to use.
            </p>
            <Button variant="outline" onClick={handleReset}>
              Reset API Key
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firecrawl API Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your Firecrawl API key"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your Firecrawl API key to enable web scraping functionality.
                      You can get an API key from the Firecrawl dashboard.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Save API Key"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
