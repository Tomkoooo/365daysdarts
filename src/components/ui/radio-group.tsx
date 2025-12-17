"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, value, onValueChange, children, ...props }, ref) => {
  return (
    <div className={cn("grid gap-2", className)} {...props} ref={ref}>
       {/* Simplistic Context implementation via cloneElement for demo compatibility without installing Radix */}
       {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
             return React.cloneElement(child as any, { 
                selectedValue: value, 
                onValueChange 
             })
          }
          return child
       })}
    </div>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
      value: string
      selectedValue?: string
      onValueChange?: (value: string) => void
  }
>(({ className, value, selectedValue, onValueChange, ...props }, ref) => {
  const isChecked = value === selectedValue

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => onValueChange && onValueChange(value)}
      ref={ref}
      {...props}
    >
      <span className={cn("flex items-center justify-center", isChecked ? "block" : "hidden")}>
        <Check className="h-2.5 w-2.5 fill-current text-current" />
      </span>
    </button>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
