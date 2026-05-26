import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "w-full h-12 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--accent)/50 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "bg-(--ink) text-(--ink-foreground) shadow-[0_12px_24px_rgba(24,16,8,0.2)] hover:bg-(--accent)",
    secondary:
      "border border-(--line) bg-(--surface-strong) text-(--muted-foreground) shadow-[0_8px_20px_rgba(24,16,8,0.08)] hover:bg-(--surface-hover)",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
