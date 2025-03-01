
import { ScrapeForm } from "@/components/ScrapeForm";
import { useQuery } from "@tanstack/react-query";
import { getAllBusinessData, getScrapingResults } from "@/services/supabaseService";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Database, FileSpreadsheet, Search, Zap, Trophy, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Index = () => {
  const [showAnimation, setShowAnimation] = useState(true);
  
  // Fade out animation after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
      {showAnimation && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1 }}
            className="text-7xl text-yellow-400 flex items-center"
          >
            <Zap className="h-24 w-24 mr-4 text-yellow-400" />
            <span className="font-bold">DataZap</span>
          </motion.div>
        </motion.div>
      )}
      
      <div className="container mx-auto px-4 py-16 space-y-16">
        <header className="text-center space-y-6">
          <div className="inline-block relative">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 tracking-tight flex items-center justify-center">
              <Zap className="h-10 w-10 mr-2 text-yellow-400 animate-pulse" />
              DataZap Scraper
              <Zap className="h-10 w-10 ml-2 text-yellow-400 animate-pulse transform scale-x-[-1]" />
            </h1>
            <motion.div 
              className="absolute -top-6 right-0 bg-yellow-400 text-blue-900 text-xs px-2 py-1 rounded-full font-bold"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              POWERED BY AI
            </motion.div>
          </div>
          <p className="text-lg text-blue-700 dark:text-blue-300 max-w-2xl mx-auto">
            Extract business information from websites, process it with AI, and export clean structured data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
            <StatCard 
              title="Businesses" 
              value={businessCount.toString()} 
              icon={<Database className="h-5 w-5 text-blue-500" />} 
              color="blue"
            />
            <StatCard 
              title="Scrapes" 
              value={scrapeCount.toString()} 
              icon={<Search className="h-5 w-5 text-green-500" />} 
              color="green"
            />
            <StatCard 
              title="Industries" 
              value={uniqueIndustries.toString()} 
              icon={<FileSpreadsheet className="h-5 w-5 text-purple-500" />} 
              color="purple"
            />
            <StatCard 
              title="Locations" 
              value={uniqueLocations.toString()} 
              icon={<Target className="h-5 w-5 text-red-500" />} 
              color="red"
            />
          </div>
        </header>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ScrapeForm />
        </motion.div>
        
        <footer className="text-center pt-16">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <Trophy className="inline-block h-4 w-4 mr-1 text-yellow-400" />
            Designed for extracting and processing business information with AI
          </p>
          <div className="mt-2">
            <Link 
              to="https://github.com/unclecode/crawl4ai" 
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center gap-1"
              target="_blank"
            >
              <ExternalLink className="h-3 w-3" />
              Scraping technology based on Crawl4AI (open source)
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Stat card component with interactive elements
const StatCard = ({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  color: "blue" | "green" | "purple" | "red" 
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600"
  };
  
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card className="overflow-hidden transition-all border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <div className={`rounded-full bg-gradient-to-r ${colorClasses[color]} p-3 mb-3 text-white shadow-md`}>
            {icon}
          </div>
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value}</h3>
          <p className="text-sm text-blue-500 dark:text-blue-300">{title}</p>
          <div className="w-full h-1 mt-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Index;
