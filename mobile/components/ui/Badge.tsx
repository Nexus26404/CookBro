import React from 'react';
import { StyleSheet, Text, View, TextStyle, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  style,
}: BadgeProps) {
  const badgeStyles: StyleProp<ViewStyle>[] = [
    styles.badge,
    styles[variant],
    styles[size],
    style
  ];

  const textStyles: StyleProp<TextStyle>[] = [
    styles.text,
    styles[`text_${variant}` as keyof typeof styles],
    styles[`text_${size}` as keyof typeof styles]
  ];

  return (
    <View style={badgeStyles}>
      {typeof children === 'string' ? (
        <Text style={textStyles}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  default: {
    backgroundColor: theme.colors.neutral[100],
  },
  primary: {
    backgroundColor: theme.colors.primary[50],
  },
  success: {
    backgroundColor: theme.colors.success.light,
  },
  warning: {
    backgroundColor: theme.colors.warning.light,
  },
  danger: {
    backgroundColor: theme.colors.danger.light,
  },
  text: {
    fontWeight: '500',
  },
  text_sm: {
    fontSize: 11,
  },
  text_md: {
    fontSize: 13,
  },
  text_default: {
    color: theme.colors.text.secondary,
  },
  text_primary: {
    color: theme.colors.primary[700],
  },
  text_success: {
    color: theme.colors.success.dark,
  },
  text_warning: {
    color: theme.colors.warning.dark,
  },
  text_danger: {
    color: theme.colors.danger.dark,
  },
});
