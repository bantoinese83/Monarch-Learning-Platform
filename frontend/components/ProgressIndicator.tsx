'use client'

interface Step {
  id: string
  label: string
  completed?: boolean
  current?: boolean
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
}

export default function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className="relative flex-1">
            {stepIdx !== steps.length - 1 ? (
              <>
                <div className="flex items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      stepIdx < currentStep
                        ? 'border-primary-600 bg-primary-600'
                        : stepIdx === currentStep
                          ? 'border-primary-600 bg-white'
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    {stepIdx < currentStep ? (
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span
                        className={`text-sm font-medium ${
                          stepIdx === currentStep ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      >
                        {stepIdx + 1}
                      </span>
                    )}
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        stepIdx <= currentStep ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
                <div
                  className={`absolute left-5 top-10 h-full w-0.5 ${
                    stepIdx < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                  aria-hidden="true"
                />
              </>
            ) : (
              <div className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    stepIdx < currentStep
                      ? 'border-primary-600 bg-primary-600'
                      : stepIdx === currentStep
                        ? 'border-primary-600 bg-white'
                        : 'border-gray-300 bg-white'
                  }`}
                >
                  {stepIdx < currentStep ? (
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`text-sm font-medium ${
                        stepIdx === currentStep ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {stepIdx + 1}
                    </span>
                  )}
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      stepIdx <= currentStep ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
