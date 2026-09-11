
import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className = "", ...props }, ref) => { 
    return (
      <div className="w-full">
        <div className="relative w-full flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center justify-center text-gray-400 pointer-events-none z-10 w-5 h-5">
              {icon}
            </div>
          )}
          
          <input 
            ref={ref}
            className={`w-full rounded-lg border text-base md:text-sm bg-white text-gray-900 border-gray-300 py-3 ${
              icon ? "pl-12" : "pl-4"
            } pr-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all duration-200 ${
              error ? "border-red-400 focus:ring-red-400" : "border-gray-300"
            } ${className}`}
            {...props} />

        </div>
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
