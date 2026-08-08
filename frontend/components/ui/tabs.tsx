"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const Tabs = ({ children, defaultValue, value, onValueChange, className, ...props }: React.ComponentProps<"div"> & {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  );
};

const TabsList = ({ children, className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-slate-800/50 p-1 text-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ children, value, disabled, className, ...props }: React.ComponentProps<"button"> & {
  value: string;
  disabled?: boolean;
}) => {
  const [isActive, setIsActive] = React.useState(false);
  
  return (
    <button
      type="button"
      value={value}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white/5 text-emerald-300"
          : "text-slate-300 hover:text-white hover:bg-white/5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, className, ...props }: React.ComponentProps<"div"> & {
  value: string;
}) => {
  const [selectedValue, setSelectedValue] = React.useState("");
  
  // In a real implementation, this would be controlled by the parent Tabs component
  // For now, we'll use a simple context-like approach
  const isActive = selectedValue === value || (!selectedValue && value === "users");
  
  if (!isActive) return null;
  
  return (
    <div className={cn("mt-2 ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2", className)} {...props}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };