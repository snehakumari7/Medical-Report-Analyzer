import { ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-sm shadow-rose-200 hover:bg-red-700 disabled:bg-rose-200",
  ghost: "bg-transparent text-rose-700 hover:bg-rose-50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed",
      variants[variant],
      className,
    )}
    {...props}
  />
));

Button.displayName = "Button";
