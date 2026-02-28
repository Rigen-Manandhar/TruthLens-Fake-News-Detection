import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-[#17130f]">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-3 border border-[var(--line)] rounded-xl bg-[#fffdf8] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-all placeholder:text-[#988c7d] text-[#17130f] shadow-[0_10px_20px_rgba(24,16,8,0.06)] hover:bg-white disabled:bg-[#f3ebdf] disabled:text-[#a59a8c] disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
}
