import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<Props> = ({ title, onPress, style, textStyle, disabled }) => {
  const handlePress = () => {
    console.log('🔲 [Button] Button pressed:', title);
    if (disabled) {
      console.warn('⚠️ [Button] Button press blocked - button is disabled:', title);
      return;
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  text: {
    color: '#fff',
    fontSize: theme.font.size.body,
    fontWeight: '700',
  },
  disabled: {
    backgroundColor: theme.colors.gray,
  },
});
