import React, { forwardRef } from "react";
import { ChevronDown } from "./icons";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  helperText?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, helperText, className = "", children, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-(--foreground-strong)">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={`w-full appearance-none rounded-2xl border border-(--line) bg-(--surface-deep) pl-4 pr-10 py-3 text-sm text-(--foreground-strong) focus:border-transparent focus:outline-none focus:ring-2 focus:ring-(--accent)/45 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted-foreground-strong)"
        />
      </div>
      {helperText && (
        <p className="text-xs text-(--muted-foreground)">{helperText}</p>
      )}
    </div>
  );
});

export default Select;
