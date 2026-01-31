"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: "#111827",
          color: "#f9fafb",
          borderRadius: "12px",
          padding: "12px 14px",
          fontSize: "0.875rem",
        },
      }}
    />
  );
}
