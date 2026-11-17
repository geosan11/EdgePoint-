import * as React from 'react';
import { Animated, View, type ViewProps } from 'react-native';
import { cn } from '../../lib/utils';

interface SkeletonProps extends ViewProps {
  className?: string;
}

function Skeleton({ className, style, ...props }: SkeletonProps) {
  const opacityAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[{ opacity: opacityAnim }, style]}
      className={cn('rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
