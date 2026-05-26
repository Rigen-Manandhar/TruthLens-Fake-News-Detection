import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-(--foreground-strong)">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-3 border border-(--line) rounded-xl bg-(--surface-strong) focus:outline-none focus:ring-2 focus:ring-(--accent)/40 transition-all placeholder:text-(--muted-foreground)/70 text-(--foreground-strong) shadow-[0_10px_20px_rgba(24,16,8,0.06)] hover:bg-white disabled:bg-(--surface-deep) disabled:text-(--muted-foreground)/70 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
}
