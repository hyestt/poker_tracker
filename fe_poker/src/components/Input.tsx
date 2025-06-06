import React from 'react';
import { TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

export const Input: React.FC<Props> = ({ value, onChangeText, placeholder, style, inputStyle, secureTextEntry, keyboardType }) => (
  <TextInput
    style={[styles.input, inputStyle, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={theme.colors.gray}
    secureTextEntry={secureTextEntry}
    keyboardType={keyboardType}
  />
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.inputBg,
  },
}); 