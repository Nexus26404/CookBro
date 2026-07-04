import React from 'react';
import { StyleSheet, View, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  onPress,
  onClick,
  padding = 'md',
}: CardProps) {
  const handlePress = onPress || onClick;
  const Component = handlePress ? TouchableOpacity : View;
  
  const paddingVal = 
    padding === 'none' ? 0 :
    padding === 'sm' ? theme.spacing[3] :
    padding === 'md' ? theme.spacing[4] :
    theme.spacing[6];

  return (
    <Component
      style={[
        styles.card,
        { padding: paddingVal },
        style
      ]}
      onPress={handlePress}
      activeOpacity={handlePress ? 0.75 : 1}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    // Shadow for iOS
    shadowColor: '#1c1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 2,
    width: '100%',
  },
});
