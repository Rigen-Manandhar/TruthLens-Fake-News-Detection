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
      <label htmlFor={id} className="text-sm font-semibold text-[#17130f]">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        className={`w-full rounded-2xl border border-(--line) bg-[#f7f1e6] px-4 py-3 text-sm text-[#17130f] placeholder:text-[#958878] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-(--accent)/45 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      />
      {helperText && (
        <p className="text-xs text-(--muted-foreground)">{helperText}</p>
      )}
    </div>
  );
});

export default Textarea;
