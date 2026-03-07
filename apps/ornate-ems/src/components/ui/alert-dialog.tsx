"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "./utils";
import { buttonVariants } from "./button";

interface AlertDialogProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Root
> {}

interface AlertDialogTriggerProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Trigger
> {}

interface AlertDialogPortalProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Portal
> {}

interface AlertDialogOverlayProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Overlay
> {}

interface AlertDialogContentProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Content
> {}

interface AlertDialogHeaderProps extends React.ComponentProps<"div"> {}

interface AlertDialogFooterProps extends React.ComponentProps<"div"> {}

interface AlertDialogTitleProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Title
> {}

interface AlertDialogDescriptionProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Description
> {}

interface AlertDialogActionProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Action
> {}

interface AlertDialogCancelProps extends React.ComponentProps<
  typeof AlertDialogPrimitive.Cancel
> {}

function AlertDialog({ ...props }: AlertDialogProps) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: AlertDialogTriggerProps) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal({ ...props }: AlertDialogPortalProps) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({ className, ...props }: AlertDialogOverlayProps) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({ className, ...props }: AlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function AlertDialogAction({ className, ...props }: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}

function AlertDialogCancel({ className, ...props }: AlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
