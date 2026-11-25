"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./button"

const Sheet = SheetPrimitive.Root

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-background duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const screenClass =
  "fixed inset-0 z-50 flex h-dvh flex-col bg-background duration-200 ease-soft data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"

type SheetContentProps = React.ComponentPropsWithoutRef<
  typeof SheetPrimitive.Content
>

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(screenClass, className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-control opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-medium text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

function MenuSheetTrigger({ className }: { className?: string }) {
  return (
    <SheetPrimitive.Trigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Open menu"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>
    </SheetPrimitive.Trigger>
  )
}

function MenuSheetHeader({ description }: { description: string }) {
  return (
    <div className="flex h-16 shrink-0 items-center px-5">
      <SheetTitle className="text-meta font-normal">Menu</SheetTitle>
      <SheetDescription className="sr-only">{description}</SheetDescription>
    </div>
  )
}

export { Sheet, SheetContent, MenuSheetTrigger, MenuSheetHeader }
