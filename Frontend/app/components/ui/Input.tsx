import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Input({ label, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-900">
        {label}
      </label>
      <input
        id={id}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder:text-gray-400 text-gray-900 shadow-sm shadow-transparent hover:border-gray-300"
        {...props}
      />
    </div>
  );
}
