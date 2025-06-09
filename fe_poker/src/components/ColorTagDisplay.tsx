import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ColorTagDisplayProps {
  tagId: string;
  size?: 'small' | 'medium' | 'large';
}

const colorMap: Record<string, string> = {
  '': 'transparent',
  'red': '#FF6B6B',
  'blue': '#4ECDC4',
  'green': '#45B7D1',
  'yellow': '#FFA726',
  'purple': '#AB47BC',
  'orange': '#FF7043',
  'pink': '#EC407A',
  'teal': '#26A69A',
};

export const ColorTagDisplay: React.FC<ColorTagDisplayProps> = ({
  tagId,
  size = 'medium',
}) => {
  if (!tagId || tagId === '') {
    return null; // Don't show anything for empty tags
  }

  const color = colorMap[tagId] || 'transparent';
  
  const sizeStyles = {
    small: { width: 12, height: 12, borderRadius: 6 },
    medium: { width: 16, height: 16, borderRadius: 8 },
    large: { width: 20, height: 20, borderRadius: 10 },
  };

  return (
    <View style={[
      styles.colorTag,
      sizeStyles[size],
      { backgroundColor: color }
    ]} />
  );
};

const styles = StyleSheet.create({
  colorTag: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
}); 