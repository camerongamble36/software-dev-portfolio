import { cva, type VariantProps } from "class-variance-authority";

// shadcn-style variants. Applied to <button>, <a> and <Link> alike via `buttonVariants()`.
export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-action text-on-primary hover:bg-action-hover active:bg-action-active",
        outline: "border border-line bg-surface text-primary hover:bg-sunken",
        ghost: "text-primary hover:bg-sunken",
      },
      size: {
        default: "",
        icon: "w-11 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
