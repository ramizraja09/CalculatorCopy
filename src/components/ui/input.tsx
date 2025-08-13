
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number' && event.target.value === '0') {
        event.target.value = '';
      }
      // Propagate the onFocus event if it exists in props
      if (props.onFocus) {
        props.onFocus(event);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
       if (type === 'number' && event.target.value === '') {
        // This is tricky with react-hook-form. The parent component's state should handle setting it back to 0.
        // For now, we just ensure onBlur is propagated.
      }
       // Propagate the onBlur event if it exists in props
      if (props.onBlur) {
        props.onBlur(event);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
