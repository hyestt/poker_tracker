import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Alert, TextInput } from 'react-native';
import { theme } from '../theme';

interface CustomPickerProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  onOptionsChange: (options: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  allowDelete?: boolean;
  title?: string;
}

export const CustomPicker: React.FC<CustomPickerProps> = ({
  options,
  value,
  onValueChange,
  onOptionsChange,
  placeholder = "Select an option",
  allowCustom = true,
  allowDelete = true,
  title,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectOption = (option: string) => {
    onValueChange(option);
    setIsVisible(false);
  };

  const handleDeleteOption = (optionToDelete: string) => {
    Alert.alert(
      'Delete Option',
      `Are you sure you want to delete "${optionToDelete}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newOptions = options.filter(option => option !== optionToDelete);
            onOptionsChange(newOptions);
            // If current value was deleted, clear it
            if (value === optionToDelete) {
              onValueChange('');
            }
          },
        },
      ]
    );
  };

  const handleAddCustom = () => {
    if (customValue.trim() && !options.includes(customValue.trim())) {
      const newOptions = [...options, customValue.trim()];
      onOptionsChange(newOptions);
      onValueChange(customValue.trim());
      setCustomValue('');
      setShowCustomInput(false);
      setIsVisible(false);
    } else if (options.includes(customValue.trim())) {
      Alert.alert('Error', 'This option already exists');
    } else {
      Alert.alert('Error', 'Please enter a valid option');
    }
  };

  const renderOption = ({ item }: { item: string }) => (
    <View style={styles.optionRow}>
      <TouchableOpacity
        style={[styles.option, value === item && styles.selectedOption]}
        onPress={() => handleSelectOption(item)}
      >
        <Text style={[styles.optionText, value === item && styles.selectedOptionText]}>
          {item}
        </Text>
      </TouchableOpacity>
      {allowDelete && options.length > 1 && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteOption(item)}
        >
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const PickerComponent = () => (
    <TouchableOpacity style={styles.picker} onPress={() => setIsVisible(true)}>
      <Text style={[styles.pickerText, !value && styles.placeholderText]}>
        {value || placeholder}
      </Text>
      <Text style={styles.arrow}>▼</Text>
    </TouchableOpacity>
  );

  if (title) {
    return (
      <View>
        <View style={styles.horizontalContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <View style={styles.pickerContainer}>
            <PickerComponent />
          </View>
        </View>

        <Modal
          visible={isVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsVisible(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setIsVisible(false)}
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Select {title}</Text>
              
              <FlatList
                data={options}
                renderItem={renderOption}
                keyExtractor={(item, index) => `${item}-${index}`}
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
              />

              {allowCustom && (
                <View style={styles.customSection}>
                  {!showCustomInput ? (
                    <TouchableOpacity
                      style={styles.addCustomButton}
                      onPress={() => setShowCustomInput(true)}
                    >
                      <Text style={styles.addCustomText}>+ Add Custom Option</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.customInputContainer}>
                      <TextInput
                        style={styles.customInput}
                        value={customValue}
                        onChangeText={setCustomValue}
                        placeholder="Enter custom option"
                        autoFocus
                      />
                      <View style={styles.customButtonsRow}>
                        <TouchableOpacity
                          style={styles.customButton}
                          onPress={() => {
                            setShowCustomInput(false);
                            setCustomValue('');
                          }}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.customButton, styles.addButton]}
                          onPress={handleAddCustom}
                        >
                          <Text style={styles.addText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <PickerComponent />

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select Option</Text>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item, index) => `${item}-${index}`}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />

            {allowCustom && (
              <View style={styles.customSection}>
                {!showCustomInput ? (
                  <TouchableOpacity
                    style={styles.addCustomButton}
                    onPress={() => setShowCustomInput(true)}
                  >
                    <Text style={styles.addCustomText}>+ Add Custom Option</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={styles.customInput}
                      value={customValue}
                      onChangeText={setCustomValue}
                      placeholder="Enter custom option"
                      autoFocus
                    />
                    <View style={styles.customButtonsRow}>
                      <TouchableOpacity
                        style={styles.customButton}
                        onPress={() => {
                          setShowCustomInput(false);
                          setCustomValue('');
                        }}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.customButton, styles.addButton]}
                        onPress={handleAddCustom}
                      >
                        <Text style={styles.addText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  titleText: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 0.3,
  },
  pickerContainer: {
    flex: 0.65,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  pickerText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.gray,
  },
  arrow: {
    fontSize: 16,
    color: theme.colors.gray,
    marginLeft: theme.spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    maxHeight: '70%',
    minWidth: '80%',
  },
  modalTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.text,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  option: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  deleteText: {
    fontSize: 16,
  },
  customSection: {
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  addCustomButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  addCustomText: {
    color: 'white',
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  customInputContainer: {
    gap: theme.spacing.xs,
  },
  customInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    fontSize: theme.font.size.small,
  },
  customButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  customButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cancelText: {
    color: theme.colors.gray,
    fontSize: theme.font.size.small,
  },
  addText: {
    color: 'white',
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
}); 