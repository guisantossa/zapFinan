"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs@1.1.3";

import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-auto items-center justify-center rounded-2xl",
        "p-1 text-gray-500 dark:text-gray-400 w-fit flex-wrap",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const [isHovered, setIsHovered] = React.useState(false);
  const ref = React.useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const checkActiveState = () => {
      const isCurrentlyActive = element.getAttribute('data-state') === 'active';
      setIsActive(isCurrentlyActive);
    };

    // Check immediately
    checkActiveState();

    // Create observer for attribute changes
    const observer = new MutationObserver(checkActiveState);
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-state']
    });

    return () => observer.disconnect();
  }, []);

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    borderRadius: '12px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    outline: 'none',
    border: 'none',
    background: isActive
      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      : isHovered
        ? 'rgba(255, 255, 255, 0.8)'
        : 'transparent',
    color: isActive
      ? 'white'
      : isHovered
        ? '#111827'
        : '#6b7280',
    boxShadow: isActive
      ? '0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.05)'
      : 'none',
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      style={baseStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
