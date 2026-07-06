import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const isTextLike = (child: any): boolean => {
  return typeof child === 'string' || typeof child === 'number';
};

export function Button({
  children,
  onPress,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const handlePress = onPress || onClick;

  const buttonStyles: StyleProp<ViewStyle>[] = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : null,
    style
  ];

  const textStyles: StyleProp<TextStyle>[] = [
    styles.text,
    styles[`text_${variant}` as keyof typeof styles],
    styles[`text_${size}` as keyof typeof styles]
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? theme.colors.primary[500] : '#ffffff'}
          size="small"
        />
      );
    }
    
    if (isTextLike(children) || (Array.isArray(children) && children.every(isTextLike))) {
      return <Text style={textStyles}>{children}</Text>;
    }
    
    return children;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: theme.colors.primary[500],
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  secondary: {
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.danger.default,
    shadowColor: theme.colors.danger.default,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  sm: {
    height: 36,
    paddingHorizontal: theme.spacing[3],
  },
  md: {
    height: 44,
    paddingHorizontal: theme.spacing[5],
  },
  lg: {
    height: 52,
    paddingHorizontal: theme.spacing[8],
    borderRadius: theme.radius.xl,
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_primary: {
    color: theme.colors.text.inverse,
  },
  text_secondary: {
    color: theme.colors.text.primary,
  },
  text_ghost: {
    color: theme.colors.text.secondary,
  },
  text_danger: {
    color: theme.colors.text.inverse,
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 17,
  },
});
