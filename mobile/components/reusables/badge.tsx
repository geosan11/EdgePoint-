import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text, TextClassContext } from './text';

const badgeVariants = cva(
  'inline-flex flex-row items-center rounded-full border px-2.5 py-0.5 web:transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary',
        secondary: 'border-transparent bg-secondary/15',
        destructive: 'border-transparent bg-destructive/15',
        outline: 'border-border bg-transparent',
        amber: 'border-amber-200 bg-amber-50',
        green: 'border-emerald-200 bg-emerald-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const badgeTextVariants = cva('text-xs font-semibold', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-secondary',
      destructive: 'text-destructive',
      outline: 'text-foreground',
      amber: 'text-amber-800',
      green: 'text-emerald-800',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends ViewProps,
    VariantProps<typeof badgeVariants> {
  className?: string;
}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <View className={cn(badgeVariants({ variant }), className)} {...props}>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </View>
    </TextClassContext.Provider>
  );
}

export { Badge, badgeVariants, badgeTextVariants };
