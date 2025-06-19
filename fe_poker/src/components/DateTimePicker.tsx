import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme';

interface CustomDateTimePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  title?: string;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onValueChange,
  title,
}) => {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [currentDate, setCurrentDate] = useState(new Date());

  const parseValue = (dateString: string): Date => {
    if (!dateString) return new Date();
    const [datePart, timePart] = dateString.split(' ');
    if (!datePart || !timePart) return new Date();
    const [year, month, day] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    if ([year, month, day, hours, minutes].some(isNaN)) return new Date();
    return new Date(year, month - 1, day, hours, minutes);
  };
  
  const formatDate = (dateToFormat: Date): string => {
    const year = dateToFormat.getFullYear();
    const month = String(dateToFormat.getMonth() + 1).padStart(2, '0');
    const day = String(dateToFormat.getDate()).padStart(2, '0');
    const hours = String(dateToFormat.getHours()).padStart(2, '0');
    const minutes = String(dateToFormat.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const openPicker = () => {
    console.log('🔍 Opening picker with value:', value);
    console.log('🔍 Value type:', typeof value);
    console.log('🔍 Value length:', value?.length);
    const initialDate = parseValue(value);
    console.log('📅 Parsed initial date:', initialDate);
    setCurrentDate(initialDate);
    setMode('date');
    setShow(true);
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    console.log('🎡 onPickerChange called:', selectedDate);
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  };
  
  const onConfirm = () => {
    console.log('✅ onConfirm called, mode:', mode, 'currentDate:', currentDate);
    if (mode === 'date') {
      console.log('📅 Date confirmed, switching to time mode');
      setMode('time');
    } else {
      const formattedResult = formatDate(currentDate);
      console.log('⏰ Time confirmed, final result:', formattedResult);
      Alert.alert('Final Value', `Setting: ${formattedResult}`);
      onValueChange(formattedResult);
      setShow(false);
    }
  };
  
  const onCancel = () => {
    setShow(false);
  };

  const PickerComponent = () => (
    <TouchableOpacity 
      style={styles.picker} 
      onPress={openPicker}
      activeOpacity={0.7}
    >
      <Text style={[styles.pickerText, !value && styles.placeholderText]}>
        {value || `Select ${title}`}
      </Text>
      <Text style={styles.arrow}>▼</Text>
    </TouchableOpacity>
  );

  const IOSPicker = () => (
    <Modal
        transparent
        animationType="slide"
        visible={show}
        onRequestClose={onCancel}
    >
        <View style={styles.overlay}>
            <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Select {mode === 'date' ? 'Date' : 'Time'}</Text>
                  <TouchableOpacity onPress={onConfirm}>
                    <Text style={styles.confirmButtonText}>{mode === 'date' ? 'Next' : 'Done'}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                    testID="dateTimePicker"
                    value={currentDate}
                    mode={mode}
                    is24Hour={true}
                    display="spinner"
                    onChange={onPickerChange}
                    style={styles.iosPicker}
                />
            </View>
        </View>
    </Modal>
  );

  if (title) {
    return (
      <View>
        <View style={styles.horizontalContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <View style={styles.pickerInputContainer}>
            <PickerComponent />
          </View>
        </View>
        {/* 調試用 - 顯示當前值 */}
        <Text style={{fontSize: 12, color: 'red', marginTop: 4}}>
          Debug: Current value = "{value}" (length: {value?.length || 0})
        </Text>
        {Platform.OS === 'ios' ? <IOSPicker /> : (
            show && <DateTimePicker
                testID="dateTimePicker"
                value={currentDate}
                mode={mode}
                display="default"
                onChange={onPickerChange}
            />
        )}
      </View>
    );
  }

  return (
    <View>
      <PickerComponent />
       {Platform.OS === 'ios' ? <IOSPicker /> : (
            show && <DateTimePicker
                testID="dateTimePicker"
                value={currentDate}
                mode={mode}
                display="default"
                onChange={onPickerChange}
            />
        )}
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
  pickerInputContainer: {
    flex: 0.65,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'red', // 暫時改為紅色來測試可見性
    borderWidth: 2,
    borderColor: 'blue', // 暫時改為藍色邊框
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
    zIndex: 999, // 確保在最上層
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
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'yellow', // 暫時改為黃色來測試
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30, // Safe area for bottom
    minHeight: 300, // 確保足夠高度
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cancelButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
  },
  confirmButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
  }
}); 