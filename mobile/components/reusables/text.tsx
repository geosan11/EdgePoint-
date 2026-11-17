import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '../../lib/utils';

const TextClassContext = React.createContext<string | undefined>(undefined);

export interface TextProps extends RNTextProps {
  className?: string;
  asChild?: boolean;
}

const Text = React.forwardRef<RNText, TextProps>(({ className, asChild = false, ...props }, ref) => {
  const textClass = React.useContext(TextClassContext);
  const Component = RNText;
  return (
    <Component
      ref={ref}
      className={cn('text-base text-foreground font-normal', textClass, className)}
      {...props}
    />
  );
});
Text.displayName = 'Text';

export { Text, TextClassContext };
