
import { useState, useMemo } from "react";
import { BusinessData } from "@/types";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadCsv } from "@/services/scrapeService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Code, Table, FileJson } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface DataPreviewProps {
  data: BusinessData[] | any[];
  loading?: boolean;
}

export function DataPreview({ data, loading = false }: DataPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>("table");
  const { toast } = useToast();
  
  const columns = useMemo(() => {
    if (!data || !data.length) return [];
    
    // Get all unique keys from the data
    const allKeys = Array.from(new Set(data.flatMap(Object.keys)));
    
    // Prioritize common business fields
    const priorityFields = [
      "name", 
      "phone", 
      "email", 
      "address", 
      "website", 
      "category", 
      "description",
      "title",
      "url",
      "extractedDataString" // This is our new field with nice string representation
    ];
    
    // Sort fields so priority fields come first, then the rest alphabetically
    const sortedKeys = [
      ...priorityFields.filter(field => allKeys.includes(field)),
      ...allKeys.filter(key => !priorityFields.includes(key) && 
                              key !== "extractedData" && // Skip showing raw extracted data object
                              key !== "rawHtml" && // Skip showing raw HTML in table
                              key !== "text" // Skip showing full text content
                      ).sort()
    ];
    
    return sortedKeys.map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      accessorKey: key,
      cell: ({ getValue }: { getValue: () => any }) => {
        const value = getValue();
        if (!value) return "-";
        
        if (key === "website" || key === "url") {
          const url = typeof value === "string" ? value : String(value);
          return (
            <a
              href={url.startsWith("http") ? url : `https://${url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {url.length > 50 ? url.substring(0, 50) + "..." : url}
            </a>
          );
        }
        
        if (key === "email") {
          return (
            <a
              href={`mailto:${value}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {value}
            </a>
          );
        }
        
        if (key === "phone") {
          return (
            <a
              href={`tel:${value.replace(/[^0-9+]/g, "")}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {value}
            </a>
          );
        }
        
        if (key === "extractedDataString") {
          return (
            <pre className="whitespace-pre-wrap max-h-60 overflow-auto text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
              {value}
            </pre>
          );
        }
        
        // Truncate long text
        if (typeof value === "string" && value.length > 200) {
          return value.substring(0, 200) + "...";
        }
        
        return String(value);
      }
    }));
  }, [data]);
  
  const rawJson = useMemo(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);
  
  // Check if data contains sample/error results
  const containsSampleData = useMemo(() => {
    if (!data || !data.length) return false;
    
    // Check if any item has a name that starts with "SCRAPING FAILED" or description that contains warning signs
    return data.some(item => 
      (item.name && item.name.includes("SCRAPING FAILED")) || 
      (item.description && item.description.includes("⚠️"))
    );
  }, [data]);
  
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Processing data...
        </div>
      </div>
    );
  }
  
  // Completely empty data case
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border rounded-lg p-6 space-y-4">
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertDescription className="text-center text-amber-800 dark:text-amber-200">
            No data found yet. This may happen because:<br />
            1. The search is still in progress<br />
            2. No results match your search criteria<br />
            3. Google may have temporarily blocked the request<br /><br />
            Try a different search query or try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const handleDownload = () => {
    // If data contains extractedData objects, convert them to BusinessData for download
    const processedData = data.map(item => {
      if (item.extractedData && typeof item.extractedData === 'object') {
        return item.extractedData;
      }
      return item;
    });
    
    downloadCsv(processedData);
    toast({
      title: "Download started",
      description: `Exporting ${processedData.length} records to CSV file`,
    });
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Results ({data.length} {data.length === 1 ? "item" : "items"})
          {containsSampleData && (
            <span className="ml-2 text-amber-600 text-sm font-normal">
              (Contains sample data - real scraping failed)
            </span>
          )}
        </h3>
        <Button
          onClick={handleDownload}
          className="transition-all duration-300"
        >
          Download CSV
        </Button>
      </div>
      
      {containsSampleData && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 mb-4">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 ml-2">
            Some data couldn't be scraped from the web due to access restrictions. Try changing your search terms or try again later.
            Check browser console for detailed logs.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="table" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="table">
            <Table className="h-4 w-4 mr-2" />
            Table View
          </TabsTrigger>
          <TabsTrigger value="extracted">
            <Code className="h-4 w-4 mr-2" />
            Extracted Data
          </TabsTrigger>
          <TabsTrigger value="json">
            <FileJson className="h-4 w-4 mr-2" />
            Raw JSON
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="mt-4">
          <ScrollArea className="h-[500px] rounded-md border">
            <DataTable data={data} columns={columns} />
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="extracted" className="mt-4">
          <ScrollArea className="h-[500px] rounded-md border">
            <DataTable 
              data={data.map(item => typeof item.extractedData === 'object' ? item.extractedData : item)} 
              columns={useMemo(() => {
                const extractedKeys = Array.from(new Set(
                  data
                    .filter(item => item.extractedData)
                    .flatMap(item => Object.keys(item.extractedData))
                ));
                
                if (extractedKeys.length === 0) return [];
                
                const priorityFields = ["name", "phone", "email", "address", "website", "description"];
                const sortedKeys = [
                  ...priorityFields.filter(field => extractedKeys.includes(field)),
                  ...extractedKeys.filter(key => !priorityFields.includes(key)).sort()
                ];
                
                return sortedKeys.map(key => ({
                  header: key.charAt(0).toUpperCase() + key.slice(1),
                  accessorKey: key
                }));
              }, [data])} 
            />
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="json" className="mt-4">
          <ScrollArea className="h-[500px] rounded-md border bg-gray-50 dark:bg-gray-900 p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
              {rawJson}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
