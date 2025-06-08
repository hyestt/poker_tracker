import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme';

interface DateTimePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  title?: string;
}

export const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onValueChange,
  title,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const parseValue = (dateString: string): Date => {
    if (!dateString) return new Date();
    
    // Parse format: "2024/01/15 19:30"
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hour, minute] = (timePart || '00:00').split(':').map(Number);
    
    return new Date(year, month - 1, day, hour, minute);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hour}:${minute}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsVisible(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android' || mode === 'time') {
        onValueChange(formatDate(selectedDate));
      }
    }
  };

  const handleConfirm = () => {
    onValueChange(formatDate(tempDate));
    setIsVisible(false);
  };

  const handleCancel = () => {
    setTempDate(parseValue(value));
    setIsVisible(false);
  };

  const openPicker = () => {
    setTempDate(parseValue(value));
    setMode('date');
    setIsVisible(true);
  };

  const PickerComponent = () => (
    <TouchableOpacity style={styles.picker} onPress={openPicker}>
      <Text style={[styles.pickerText, !value && styles.placeholderText]}>
        {value || '選擇日期和時間'}
      </Text>
      <Text style={styles.arrow}>📅</Text>
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

        {isVisible && (
          <Modal
            transparent
            animationType="fade"
            visible={isVisible}
            onRequestClose={handleCancel}
          >
            <View style={styles.overlay}>
              <View style={styles.modal}>
                <Text style={styles.modalTitle}>選擇 {title}</Text>
                
                <View style={styles.modeButtons}>
                  <TouchableOpacity
                    style={[styles.modeButton, mode === 'date' && styles.activeModeButton]}
                    onPress={() => setMode('date')}
                  >
                    <Text style={[styles.modeButtonText, mode === 'date' && styles.activeModeButtonText]}>
                      日期
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeButton, mode === 'time' && styles.activeModeButton]}
                    onPress={() => setMode('time')}
                  >
                    <Text style={[styles.modeButtonText, mode === 'time' && styles.activeModeButtonText]}>
                      時間
                    </Text>
                  </TouchableOpacity>
                </View>

                <DateTimePicker
                  value={tempDate}
                  mode={mode}
                  display="spinner"
                  onChange={handleDateChange}
                  style={styles.dateTimePicker}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.button} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>確認</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  return (
    <View>
      <PickerComponent />

      {isVisible && (
        <Modal
          transparent
          animationType="fade"
          visible={isVisible}
          onRequestClose={handleCancel}
        >
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>選擇日期和時間</Text>
              
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'date' && styles.activeModeButton]}
                  onPress={() => setMode('date')}
                >
                  <Text style={[styles.modeButtonText, mode === 'date' && styles.activeModeButtonText]}>
                    日期
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'time' && styles.activeModeButton]}
                  onPress={() => setMode('time')}
                >
                  <Text style={[styles.modeButtonText, mode === 'time' && styles.activeModeButtonText]}>
                    時間
                  </Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                onChange={handleDateChange}
                style={styles.dateTimePicker}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
                  <Text style={styles.confirmButtonText}>確認</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    fontSize: 16,
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
    minWidth: '80%',
  },
  modalTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.text,
  },
  modeButtons: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.button,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.radius.button - 2,
  },
  activeModeButton: {
    backgroundColor: theme.colors.primary,
  },
  modeButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  activeModeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dateTimePicker: {
    width: '100%',
    height: 200,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.gray,
    fontSize: theme.font.size.body,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
}); 