
import { ScrapeForm } from "@/components/ScrapeForm";
import { useQuery } from "@tanstack/react-query";
import { getAllBusinessData, getScrapingResults } from "@/services/supabaseService";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Database, FileSpreadsheet, Search } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  // Fetch statistics
  const { data: businessData } = useQuery({
    queryKey: ['businessData'],
    queryFn: () => getAllBusinessData()
  });
  
  const { data: scrapingResults } = useQuery({
    queryKey: ['scrapingResults'],
    queryFn: () => getScrapingResults()
  });
  
  // Calculate statistics
  const businessCount = businessData?.length || 0;
  const scrapeCount = scrapingResults?.length || 0;
  const uniqueIndustries = new Set(businessData?.map(business => business.industry).filter(Boolean)).size;
  const uniqueLocations = new Set(businessData?.map(business => business.city && business.state ? `${business.city}, ${business.state}` : (business.city || business.state)).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 space-y-16">
        <header className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            AI-Powered Web Scraper
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Extract business information from websites, process it with AI, and export clean structured data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
            <StatCard 
              title="Businesses" 
              value={businessCount.toString()} 
              icon={<Database className="h-5 w-5" />} 
            />
            <StatCard 
              title="Scrapes" 
              value={scrapeCount.toString()} 
              icon={<Search className="h-5 w-5" />} 
            />
            <StatCard 
              title="Industries" 
              value={uniqueIndustries.toString()} 
              icon={<FileSpreadsheet className="h-5 w-5" />} 
            />
            <StatCard 
              title="Locations" 
              value={uniqueLocations.toString()} 
              icon={<ExternalLink className="h-5 w-5" />} 
            />
          </div>
        </header>
        
        <ScrapeForm />
        
        <footer className="text-center pt-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Designed for extracting and processing business information with AI
          </p>
          <div className="mt-2">
            <Link 
              to="https://github.com/unclecode/crawl4ai" 
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              target="_blank"
            >
              Scraping technology based on Crawl4AI (open source)
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Stat card component
const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
  <Card className="overflow-hidden transition-all hover:shadow-md">
    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{value}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </CardContent>
  </Card>
);

export default Index;
