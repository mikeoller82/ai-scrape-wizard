
import { useState, useMemo } from "react";
import { BusinessData } from "@/types";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadCsv } from "@/services/scrapeService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataPreviewProps {
  data: BusinessData[];
  loading?: boolean;
}

export function DataPreview({ data, loading = false }: DataPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>("table");
  
  const columns = useMemo(() => {
    if (!data.length) return [];
    
    // Get all unique keys from the data
    const allKeys = Array.from(new Set(data.flatMap(Object.keys)));
    
    // Prioritize common business fields
    const priorityFields = ["name", "phone", "email", "address", "website", "category", "description"];
    
    // Sort fields so priority fields come first, then the rest alphabetically
    const sortedKeys = [
      ...priorityFields.filter(field => allKeys.includes(field)),
      ...allKeys.filter(key => !priorityFields.includes(key)).sort()
    ];
    
    return sortedKeys.map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1),
      accessorKey: key,
      cell: ({ getValue }: { getValue: () => any }) => {
        const value = getValue();
        if (!value) return "-";
        if (key === "website" && typeof value === "string") {
          return (
            <a
              href={value.startsWith("http") ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {value}
            </a>
          );
        }
        if (key === "email" && typeof value === "string") {
          return (
            <a
              href={`mailto:${value}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {value}
            </a>
          );
        }
        if (key === "phone" && typeof value === "string") {
          return (
            <a
              href={`tel:${value.replace(/[^0-9+]/g, "")}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {value}
            </a>
          );
        }
        return String(value);
      }
    }));
  }, [data]);
  
  const rawJson = useMemo(() => {
    return JSON.stringify(data, null, 2);
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
  
  if (!data.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg">
        <div className="text-gray-500 dark:text-gray-400">
          No data available. Start a scrape to see results here.
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Results ({data.length} {data.length === 1 ? "item" : "items"})
        </h3>
        <Button
          onClick={() => downloadCsv(data)}
          className="transition-all duration-300"
        >
          Download CSV
        </Button>
      </div>
      
      <Tabs defaultValue="table" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="json">Raw JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-4">
          <ScrollArea className="h-[500px] rounded-md border">
            <DataTable data={data} columns={columns} />
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
