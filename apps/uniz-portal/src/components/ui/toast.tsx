"use client";

import { forwardRef, useImperativeHandle } from "react";
import { Toaster as HotToaster } from "react-hot-toast";
import { showToast, type ToastInput } from "@/utils/toast-ref";

export type Variant = "default" | "success" | "error" | "warning";

export type ToasterProps = ToastInput;

export interface ToasterRef {
  show: (props: ToasterProps) => void;
}

const hotToastOptions = {
  duration: 4000,
  style: {
    background: "transparent",
    boxShadow: "none",
    padding: 0,
    maxWidth: "100%",
  },
};

/** react-hot-toast host — slides in from the bottom-right */
const Toaster = forwardRef<
  ToasterRef,
  { defaultPosition?: "bottom-right" | "top-right" }
>(({ defaultPosition = "bottom-right" }, ref) => {
  useImperativeHandle(ref, () => ({
    show: (props) => showToast(props),
  }));

  return (
    <HotToaster
      position={defaultPosition}
      gutter={10}
      containerStyle={{
        bottom: 20,
        right: 20,
        top: defaultPosition.startsWith("top") ? 20 : undefined,
      }}
      toastOptions={hotToastOptions}
    />
  );
});

Toaster.displayName = "Toaster";

export default Toaster;
