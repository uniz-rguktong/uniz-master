import { ToasterProps, ToasterRef } from "@/components/ui/toast";
import { createRef } from "react";

export const toasterRef = createRef<ToasterRef>();

export const toast = {
  show: (props: ToasterProps) => {
    toasterRef.current?.show(props);
  },
  success: (
    message: string,
    optionsOrTitle?: string | Partial<ToasterProps>,
  ) => {
    const props: ToasterProps =
      typeof optionsOrTitle === "object"
        ? { message, variant: "success", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "success" };
    toasterRef.current?.show(props);
  },
  error: (message: string, optionsOrTitle?: string | Partial<ToasterProps>) => {
    const props: ToasterProps =
      typeof optionsOrTitle === "object"
        ? { message, variant: "error", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "error" };
    toasterRef.current?.show(props);
  },
  warning: (
    message: string,
    optionsOrTitle?: string | Partial<ToasterProps>,
  ) => {
    const props: ToasterProps =
      typeof optionsOrTitle === "object"
        ? { message, variant: "warning", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "warning" };
    toasterRef.current?.show(props);
  },
  info: (message: string, optionsOrTitle?: string | Partial<ToasterProps>) => {
    const props: ToasterProps =
      typeof optionsOrTitle === "object"
        ? { message, variant: "default", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "default" };
    toasterRef.current?.show(props);
  },
};
