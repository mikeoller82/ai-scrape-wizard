
import { ScrapeForm } from "@/components/ScrapeForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 space-y-16">
        <header className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            AI-Powered Web Scraper
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Extract business information from websites, process it with AI, and export clean structured data.
          </p>
        </header>
        
        <ScrapeForm />
        
        <footer className="text-center pt-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Designed for extracting and processing business information with AI
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
