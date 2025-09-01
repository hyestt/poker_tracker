import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

export type HandStage = 'preflop' | 'flop' | 'turn' | 'river';

interface Props {
  preflopDetails: string;
  flopDetails: string;
  turnDetails: string;
  riverDetails: string;
  onDetailsChange: (stage: HandStage, details: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  onStageChange?: (stage: HandStage) => void;
  onFocus?: () => void;
  showSoftInputOnFocus?: boolean;
  onPressIn?: () => void;
  inputRef?: React.RefObject<TextInput>;
  readOnly?: boolean;
}

export const HandDetailsTabs: React.FC<Props> = ({
  preflopDetails,
  flopDetails,
  turnDetails,
  riverDetails,
  onDetailsChange,
  onSelectionChange,
  onStageChange,
  onFocus,
  showSoftInputOnFocus = true,
  onPressIn,
  inputRef,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<HandStage>('preflop');
  const internalInputRef = useRef<TextInput>(null);
  const currentInputRef = inputRef || internalInputRef;

  const tabs = [
    { key: 'preflop', label: 'PF', value: preflopDetails },
    { key: 'flop', label: 'F', value: flopDetails },
    { key: 'turn', label: 'T', value: turnDetails },
    { key: 'river', label: 'R', value: riverDetails },
  ] as const;

  const getCurrentValue = () => {
    switch (activeTab) {
      case 'preflop': return preflopDetails;
      case 'flop': return flopDetails;
      case 'turn': return turnDetails;
      case 'river': return riverDetails;
      default: return '';
    }
  };

  const handleTabPress = (stage: HandStage) => {
    setActiveTab(stage);
    onStageChange?.(stage);
    setTimeout(() => {
      currentInputRef.current?.focus();
    }, 100);
  };

  const handleTextChange = (text: string) => {
    if (!readOnly) {
      onDetailsChange(activeTab, text);
    }
  };

  const getTabStyle = (stage: HandStage) => [
    styles.tab,
    activeTab === stage && styles.activeTab,
  ];

  const getTabTextStyle = (stage: HandStage) => [
    styles.tabText,
    activeTab === stage && styles.activeTabText,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {tabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={getTabStyle(key)}
            onPress={() => handleTabPress(key)}
          >
            <Text style={getTabTextStyle(key)}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TextInput
        ref={currentInputRef}
        style={styles.textInput}
        value={getCurrentValue()}
        onChangeText={handleTextChange}
        onSelectionChange={(event) => {
          const selection = event.nativeEvent.selection;
          onSelectionChange?.(selection);
        }}
        placeholder={readOnly ? (getCurrentValue() ? '' : 'No details provided') : `Enter ${activeTab} details...`}
        placeholderTextColor={theme.colors.gray}
        multiline={true}
        numberOfLines={8}
        textAlignVertical="top"
        showSoftInputOnFocus={readOnly ? false : showSoftInputOnFocus}
        onPressIn={readOnly ? undefined : onPressIn}
        onFocus={readOnly ? undefined : onFocus}
        editable={!readOnly}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.button,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    padding: theme.spacing.xs,
    fontSize: 21,
    color: theme.colors.text,
    minHeight: 100,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
  },
});