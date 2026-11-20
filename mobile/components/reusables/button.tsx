import * as React from 'react';
import { Pressable, type PressableProps, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { TextClassContext } from './text';

const buttonVariants = cva(
  'group flex flex-row items-center justify-center rounded-xl web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary active:opacity-90',
        destructive: 'bg-destructive active:opacity-90',
        outline:
          'border border-border bg-background active:bg-muted/30 web:hover:bg-muted/20',
        secondary: 'bg-muted active:opacity-80',
        ghost: 'active:bg-muted/50 web:hover:bg-muted/30',
        link: 'web:underline-offset-4 web:hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2.5',
        sm: 'h-8 px-3 rounded-lg',
        lg: 'h-13 px-6 rounded-2xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('text-sm font-semibold web:whitespace-nowrap', {
  variants: {
    variant: {
      default: 'text-white',
      destructive: 'text-white',
      outline: 'text-foreground',
      secondary: 'text-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
    size: {
      default: 'text-sm',
      sm: 'text-xs',
      lg: 'text-base',
      icon: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  className?: string;
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
        <Pressable
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          role="button"
          {...props}
        >
          {children}
        </Pressable>
      </TextClassContext.Provider>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants, buttonTextVariants };
