"use client";

import { InputHTMLAttributes, forwardRef, ReactNode , useState } from "react";
import { Eye, EyeOff } from "lucide-react";


interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className = "", type ,  ...props }, ref) => { 

      const [showPassword, setShowPassword] = useState(false);
      const isPasswordField = type === "password";
      const actualType = isPasswordField && showPassword ? "text" : type;


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
            type={actualType}
            {...props} />


            {isPasswordField && (
            <button
              type="button" // prevents accidentally submitting the form on click
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
              tabIndex={-1} // keeps Tab-key navigation skipping past this button
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

        </div>
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
