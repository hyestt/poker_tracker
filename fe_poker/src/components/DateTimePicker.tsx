import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatePicker from 'react-native-date-picker';
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
  const [open, setOpen] = useState(false);

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

  const currentDate = parseValue(value);

  const PickerComponent = () => (
    <TouchableOpacity 
      style={styles.picker} 
      onPress={() => setOpen(true)}
      activeOpacity={0.7}
    >
      <Text style={[styles.pickerText, !value && styles.placeholderText]}>
        {value || `Select ${title}`}
      </Text>
      <Text style={styles.arrow}>▼</Text>
    </TouchableOpacity>
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
        <DatePicker
          modal
          open={open}
          date={currentDate}
          mode="datetime"
          onConfirm={(selectedDate) => {
            setOpen(false);
            const formattedResult = formatDate(selectedDate);
            onValueChange(formattedResult);
          }}
          onCancel={() => {
            setOpen(false);
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <PickerComponent />
      <DatePicker
        modal
        open={open}
        date={currentDate}
        mode="datetime"
        onConfirm={(selectedDate) => {
          setOpen(false);
          const formattedResult = formatDate(selectedDate);
          onValueChange(formattedResult);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
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
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
}); 