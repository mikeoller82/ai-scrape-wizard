
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIModel } from "@/types";
import { AVAILABLE_TOOLS, ChatMessage, TOOL_ENABLED_MODELS, Tool, ToolUseRequest } from "@/types/aiTypes";
import { executeToolCall, processWithTools } from "@/services/toolUseService";
import { processWithAI } from "@/services/aiService";
import { Check, CornerDownLeft, Loader2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export function AIChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: "You are a helpful assistant for DataZap that can call tools when needed." }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt-4o-mini");
  const [selectedTools, setSelectedTools] = useState<string[]>(["calculate", "get_current_weather", "extract_business_info"]);
  const [enableTools, setEnableTools] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleModelChange = (value: string) => {
    setSelectedModel(value as AIModel);
  };

  const handleToolToggle = (toolName: string) => {
    setSelectedTools(prev => 
      prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      if (enableTools && TOOL_ENABLED_MODELS.includes(selectedModel)) {
        await processWithToolsFlow(userMessage);
      } else {
        await processWithoutTools(userMessage);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I encountered an error while processing your request. Please try again." 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithToolsFlow = async (userMessage: ChatMessage) => {
    // Get tools based on selection
    const tools: Tool[] = selectedTools
      .map(name => AVAILABLE_TOOLS[name])
      .filter(Boolean);

    // Create request
    const request: ToolUseRequest = {
      model: selectedModel,
      messages: [...messages, userMessage],
      tools,
      tool_choice: "auto"
    };

    // Process the request
    const response = await processWithTools(request);
    const assistantMessage = response.choices[0].message;
    setMessages(prev => [...prev, assistantMessage]);

    // Check if tool calls are needed
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const updatedMessages = [...messages, userMessage, assistantMessage];
      
      // Process each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const toolResponse = executeToolCall(toolCall);
        const toolMessage: ChatMessage = {
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: toolResponse
        };
        
        updatedMessages.push(toolMessage);
        setMessages([...updatedMessages]);
      }

      // Make a second request with the tool responses
      const secondRequest: ToolUseRequest = {
        model: selectedModel,
        messages: updatedMessages
      };

      const secondResponse = await processWithTools(secondRequest);
      const finalMessage = secondResponse.choices[0].message;
      setMessages(prev => [...prev, finalMessage]);
    }
  };

  const processWithoutTools = async (userMessage: ChatMessage) => {
    // Process without tools using the regular AI service
    const result = await processWithAI(
      [{ description: userMessage.content }], 
      { 
        model: selectedModel, 
        instructions: "Respond to the user query in a helpful and informative way.",
        temperature: 0.7 
      }
    );

    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: result[0].description || "I'm sorry, I couldn't process your request properly." 
    }]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 border-blue-200 dark:border-blue-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <CardTitle className="flex items-center justify-center text-2xl">
          <Zap className="h-6 w-6 mr-2 text-yellow-300" />
          DataZap AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="model-select" className="mb-2 block">AI Model</Label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                <SelectItem value="llama-3-8b">Llama 3 (8B)</SelectItem>
                <SelectItem value="llama-3-70b">Llama 3 (70B)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="enable-tools" 
              checked={enableTools} 
              onCheckedChange={setEnableTools}
              disabled={!TOOL_ENABLED_MODELS.includes(selectedModel)}
            />
            <Label htmlFor="enable-tools">Enable Tools</Label>
          </div>
        </div>
        
        {enableTools && TOOL_ENABLED_MODELS.includes(selectedModel) && (
          <div className="mb-4">
            <Label className="mb-2 block">Available Tools</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(AVAILABLE_TOOLS).map(toolName => (
                <Button
                  key={toolName}
                  variant={selectedTools.includes(toolName) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToolToggle(toolName)}
                  className="flex items-center"
                >
                  {selectedTools.includes(toolName) && (
                    <Check className="mr-1 h-4 w-4" />
                  )}
                  {toolName.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.slice(1).map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'tool'
                      ? 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {message.role === 'tool' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Tool: {message.name}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">
                    {message.role === 'tool' 
                      ? formatToolResult(message.content)
                      : message.content}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 min-h-10 max-h-40"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={isProcessing || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CornerDownLeft className="h-5 w-5" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

// Format tool result for display
function formatToolResult(content: string): string {
  try {
    const data = JSON.parse(content);
    return JSON.stringify(data, null, 2);
  } catch {
    return content;
  }
}
