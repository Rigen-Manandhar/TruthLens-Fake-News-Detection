"use client";

import { Toaster } from "react-hot-toast";
import { CheckCircle2, Loader2, XCircle } from "./ui/icons";

const baseStyle = {
  background: "#fffdf8",
  color: "#17130f",
  border: "1px solid rgba(74, 58, 38, 0.14)",
  borderRadius: "16px",
  padding: "12px 14px",
  fontSize: "0.875rem",
  boxShadow: "0 18px 36px rgba(24, 16, 8, 0.12)",
};

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: baseStyle,
        success: {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden />,
          iconTheme: {
            primary: "#047857",
            secondary: "#ecfdf5",
          },
        },
        error: {
          icon: <XCircle className="h-5 w-5 text-red-700" aria-hidden />,
          iconTheme: {
            primary: "#b91c1c",
            secondary: "#fef2f2",
          },
        },
        loading: {
          icon: (
            <Loader2 className="h-5 w-5 animate-spin text-(--accent)" aria-hidden />
          ),
        },
      }}
    />
  );
}
