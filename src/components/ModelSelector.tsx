
import { useId } from "react";
import { AIModel } from "@/types";
import { getAvailableModels } from "@/services/aiService";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onChange: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, onChange }: ModelSelectorProps) {
  const id = useId();
  const models = getAvailableModels();
  
  return (
    <div className="w-full">
      <RadioGroup 
        value={selectedModel} 
        onValueChange={(value) => onChange(value as AIModel)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {models.map((model) => (
          <Card 
            key={model.id}
            className={`border cursor-pointer transition-all duration-300 ease-in-out ${
              selectedModel === model.id 
                ? "border-gray-900 dark:border-gray-300 shadow-md" 
                : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            onClick={() => onChange(model.id)}
          >
            <CardContent className="p-4">
              <RadioGroupItem 
                value={model.id} 
                id={`${id}-${model.id}`}
                className="sr-only"
              />
              <div className="flex flex-col gap-1.5">
                <Label 
                  htmlFor={`${id}-${model.id}`}
                  className="font-medium"
                >
                  {model.name}
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {model.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}
