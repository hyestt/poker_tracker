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
      '刪除選項',
      `確定要刪除「${optionToDelete}」嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
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
      Alert.alert('錯誤', '此選項已存在');
    } else {
      Alert.alert('錯誤', '請輸入有效的選項');
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
              <Text style={styles.modalTitle}>選擇 {title}</Text>
              
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
                      <Text style={styles.addCustomText}>+ 新增自訂選項</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.customInputContainer}>
                      <TextInput
                        style={styles.customInput}
                        value={customValue}
                        onChangeText={setCustomValue}
                        placeholder="輸入自訂選項"
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
                          <Text style={styles.cancelText}>取消</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.customButton, styles.addButton]}
                          onPress={handleAddCustom}
                        >
                          <Text style={styles.addText}>新增</Text>
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
            <Text style={styles.modalTitle}>選擇選項</Text>
            
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
                    <Text style={styles.addCustomText}>+ 新增自訂選項</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={styles.customInput}
                      value={customValue}
                      onChangeText={setCustomValue}
                      placeholder="輸入自訂選項"
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
                        <Text style={styles.cancelText}>取消</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.customButton, styles.addButton]}
                        onPress={handleAddCustom}
                      >
                        <Text style={styles.addText}>新增</Text>
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
    marginBottom: theme.spacing.sm,
  },
  titleText: {
    fontSize: theme.font.size.subtitle,
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
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
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
    fontSize: 12,
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
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    maxHeight: '70%',
    minWidth: '80%',
  },
  modalTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.text,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  option: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.button,
    flex: 1,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  deleteText: {
    fontSize: 16,
  },
  customSection: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray,
    paddingTop: theme.spacing.md,
  },
  addCustomButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  addCustomText: {
    color: theme.colors.primary,
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
  customInputContainer: {
    gap: theme.spacing.sm,
  },
  customInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  customButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  customButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cancelText: {
    color: theme.colors.gray,
    fontSize: theme.font.size.body,
  },
  addText: {
    color: 'white',
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
}); 