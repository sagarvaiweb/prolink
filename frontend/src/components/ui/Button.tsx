import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
}

export default function Button({
  children,
  isLoading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      disabled={disabled || isLoading} // disable the button while a request is in flight
      {...props} >
        
      {isLoading ? "Please wait..." : children}
    </button>
  );
}