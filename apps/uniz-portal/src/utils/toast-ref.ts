import { ToasterRef } from "@/components/ui/toast";
import { createRef } from "react";

export const toasterRef = createRef<ToasterRef>();

export const toast = {
  show: (props: Parameters<ToasterRef["show"]>[0]) => {
    toasterRef.current?.show(props);
  },
  success: (message: string, title?: string) => {
    toasterRef.current?.show({ message, title, variant: "success" });
  },
  error: (message: string, title?: string) => {
    toasterRef.current?.show({ message, title, variant: "error" });
  },
  warning: (message: string, title?: string) => {
    toasterRef.current?.show({ message, title, variant: "warning" });
  },
  info: (message: string, title?: string) => {
    toasterRef.current?.show({ message, title, variant: "default" });
  },
};
