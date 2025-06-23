import * as React from "react"
import Image, { ImageProps } from "next/image";

import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg",
      "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-purple-500/20 before:to-pink-500/20",
      "before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100",
      "before:blur-2xl",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card"

const CardImage = React.forwardRef<HTMLImageElement, ImageProps>(({ className, ...props }, ref) => (
  <Image
    ref={ref}
    className={cn(
      "absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
      className
    )}
    {...props}
  />
));
CardImage.displayName = "CardImage";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("relative z-10 flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({
  className,
  ...props
}, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-white shadow-black/50 text-shadow-lg",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({
  className,
  ...props
}, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/80 shadow-black/50 text-shadow", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div ref={ref} className={cn(
    "relative z-10 p-6 pt-0",
    "bg-black/20 backdrop-blur-sm",
    className
  )} {...props} />
));
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("relative z-10 flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardImage,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
