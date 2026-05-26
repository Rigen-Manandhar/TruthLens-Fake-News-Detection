import React, { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, id, helperText, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-(--foreground-strong)">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        className={`w-full rounded-2xl border border-(--line) bg-(--surface-deep) px-4 py-3 text-sm text-(--foreground-strong) placeholder:text-(--muted-foreground)/70 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-(--accent)/45 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      />
      {helperText && (
        <p className="text-xs text-(--muted-foreground)">{helperText}</p>
      )}
    </div>
  );
});

export default Textarea;
