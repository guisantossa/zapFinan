import { Check } from 'lucide-react';
import { Step } from './types';

interface PlanFormStepperProps {
  steps: Step[];
  currentStep: number;
  visitedSteps: Set<number>;
  onStepClick: (step: number) => void;
}

export function PlanFormStepper({ steps, currentStep, visitedSteps, onStepClick }: PlanFormStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = visitedSteps.has(step.id) && currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || isCurrent || visitedSteps.has(step.id);

          return (
            <li key={step.id} className="relative flex items-center flex-1">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`flex items-center gap-3 group transition-all duration-200 ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                {/* Circle */}
                {isCompleted ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                    <Check className="h-5 w-5 text-white" />
                  </span>
                ) : isCurrent ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-50 dark:bg-blue-950 shadow-lg">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{step.id}</span>
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400">{step.id}</span>
                  </span>
                )}

                {/* Label */}
                <span
                  className={`text-sm font-medium whitespace-nowrap ${
                    isCurrent
                      ? 'text-blue-600 dark:text-blue-400'
                      : isCompleted
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}