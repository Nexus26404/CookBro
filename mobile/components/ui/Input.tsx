import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, View, TextInput, ViewStyle, StyleProp, TextInputProps } from 'react-native';
import { theme } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helperText, style, containerStyle, editable = true, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            focused && styles.focused,
            error ? styles.hasError : null,
            !editable && styles.disabled,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={theme.colors.text.tertiary}
            editable={editable}
            onFocus={(e) => {
              setFocused(true);
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              if (props.onBlur) props.onBlur(e);
            }}
            underlineColorAndroid="transparent"
            {...props}
          />
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing[3],
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
    paddingLeft: 4,
  },
  inputContainer: {
    height: 46,
    backgroundColor: theme.colors.bg.input,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing[4],
    justifyContent: 'center',
  },
  focused: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.bg.card,
  },
  hasError: {
    borderColor: theme.colors.danger.default,
  },
  disabled: {
    opacity: 0.6,
  },
  input: {
    fontSize: 15,
    color: theme.colors.text.primary,
    padding: 0,
    height: '100%',
  },
  errorText: {
    fontSize: 11,
    color: theme.colors.danger.default,
    marginTop: theme.spacing[1],
    paddingLeft: 4,
  },
  helperText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
    paddingLeft: 4,
  },
});
