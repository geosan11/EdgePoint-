import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../../lib/utils';

interface ProgressProps extends ViewProps {
  className?: string;
  value?: number; // 0 to 100
  indicatorClassName?: string;
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <View
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedValue}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-muted',
          className
        )}
        {...props}
      >
        <View
          className={cn('h-full bg-primary rounded-full transition-all', indicatorClassName)}
          style={{ width: `${clampedValue}%` }}
        />
      </View>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
