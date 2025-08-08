import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { CustomPicker } from './CustomPicker';
import { CustomDateTimePicker } from './DateTimePicker';
import { ColorTagPicker } from './ColorTagPicker';
import { theme } from '../theme';
import { Session } from '../models';
import { UserPreferencesService, UserPreferences } from '../services/UserPreferences';

interface SessionFormProps {
  initialSession?: Session;
  onSubmit: (session: Session) => void;
  submitButtonTitle: string;
  isLoading?: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  initialSession,
  onSubmit,
  submitButtonTitle,
  isLoading = false
}) => {
  // 使用單一狀態對象管理表單數據
  const [formData, setFormData] = useState({
    location: '',
    date: '',
    blinds: '',
    currency: '',
    effectiveStack: '',
    tableSize: '',
    tag: ''
  });
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 更新表單數據的函數
  const updateFormData = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 專門處理數字輸入的函數
  const updateNumericField = useCallback((field: string, value: string) => {
    // 只允許數字和小數點
    const numericValue = value.replace(/[^0-9.]/g, '');
    // 確保只有一個小數點
    const parts = numericValue.split('.');
    const validValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    
    setFormData(prev => ({
      ...prev,
      [field]: validValue
    }));
  }, []);

  useEffect(() => {
    loadPreferencesAndInitialize();
  }, []);

  const loadPreferencesAndInitialize = async () => {
    const prefs = await UserPreferencesService.getPreferences();
    setPreferences(prefs);
    
    if (initialSession) {
      // 編輯模式 - 載入現有 session 資料
      setFormData({
        location: initialSession.location || '',
        date: initialSession.date || '',
        blinds: `${initialSession.smallBlind || 0}/${initialSession.bigBlind || 0}`,
        currency: initialSession.currency || '',
        effectiveStack: initialSession.effectiveStack?.toString() || '',
        tableSize: initialSession.tableSize?.toString() || '',
        tag: initialSession.tag || ''
      });
    } else {
      // 新建模式 - 設定預設值
      const now = new Date();
      const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setFormData({
        location: prefs.lastLocation || '',
        date: formattedDate,
        blinds: prefs.lastBlinds || '1/2',
        currency: prefs.lastCurrency || '🇺🇸 USD ($)',
        effectiveStack: '100',
        tableSize: prefs.lastTableSize || '6',
        tag: ''
      });
    }
  };

  const handleSubmit = async () => {
    // 防止重複提交
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 驗證必填欄位
      if (!formData.location.trim()) {
        Alert.alert('Location Required', 'Please enter a casino or venue name to continue.');
        setIsSubmitting(false);
        return;
      }

      const [smallBlindStr, bigBlindStr] = formData.blinds.split('/');
      const smallBlindValue = parseFloat(smallBlindStr) || 0;
      const bigBlindValue = parseFloat(bigBlindStr) || 0;

      const session: Session = {
        id: initialSession?.id || Date.now().toString(),
        location: formData.location,
        date: formData.date,
        smallBlind: smallBlindValue,
        bigBlind: bigBlindValue,
        currency: formData.currency,
        effectiveStack: parseInt(formData.effectiveStack) || 0,
        tableSize: parseInt(formData.tableSize) || 6,
        tag: formData.tag,
      };

      // 儲存使用者偏好
      if (preferences) {
        await UserPreferencesService.updateLastChoices({
          location: formData.location,
          currency: formData.currency,
          tableSize: formData.tableSize,
          blinds: formData.blinds,
        });
      }

      await onSubmit(session);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLocationOptions = async (newOptions: string[]) => {
    if (preferences) {
      const updated = { ...preferences, customLocations: newOptions };
      setPreferences(updated);
      await UserPreferencesService.savePreferences(updated);
    }
  };

  const updateCurrencyOptions = async (newOptions: string[]) => {
    if (preferences) {
      const updated = { ...preferences, customCurrencies: newOptions };
      setPreferences(updated);
      await UserPreferencesService.savePreferences(updated);
    }
  };

  const updateTableSizeOptions = async (newOptions: string[]) => {
    if (preferences) {
      const updated = { ...preferences, customTableSizes: newOptions };
      setPreferences(updated);
      await UserPreferencesService.savePreferences(updated);
    }
  };

  const updateBlindsOptions = async (newOptions: string[]) => {
    if (preferences) {
      const updated = { ...preferences, customBlinds: newOptions };
      setPreferences(updated);
      await UserPreferencesService.savePreferences(updated);
    }
  };

  if (!preferences) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.section}>
        <CustomPicker
          title="Location"
          options={preferences.customLocations}
          value={formData.location}
          onValueChange={(value) => updateFormData('location', value)}
          onOptionsChange={updateLocationOptions}
          placeholder="Enter casino/venue name (required)"
        />
      </Card>

      <Card style={styles.section}>
        <CustomDateTimePicker
          title="Date & Time"
          value={formData.date}
          onValueChange={(value) => updateFormData('date', value)}
        />
      </Card>

      <Card style={styles.section}>
        <CustomPicker
          title="Blinds"
          options={preferences.customBlinds}
          value={formData.blinds}
          onValueChange={(value) => updateFormData('blinds', value)}
          onOptionsChange={updateBlindsOptions}
          placeholder="Select blinds (e.g. 1/2)"
        />
      </Card>

      <Card style={styles.section}>
        <CustomPicker
          title="Currency"
          options={preferences.customCurrencies}
          value={formData.currency}
          onValueChange={(value) => updateFormData('currency', value)}
          onOptionsChange={updateCurrencyOptions}
          placeholder="Select currency"
          allowCustom={false}
          allowDelete={false}
        />
      </Card>

      <Card style={styles.section}>
        <CustomPicker
          title="Table Size"
          options={preferences.customTableSizes.map(size => `${size} Players`)}
          value={formData.tableSize ? `${formData.tableSize} Players` : ''}
          onValueChange={(value) => {
            const sizeOnly = value.replace(' Players', '');
            updateFormData('tableSize', sizeOnly);
          }}
          onOptionsChange={(newOptions) => {
            const sizesOnly = newOptions.map(option => option.replace(' Players', ''));
            updateTableSizeOptions(sizesOnly);
          }}
          placeholder="Select table size"
        />
      </Card>

      <Card style={styles.section}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.fieldTitle}>Effective Stack</Text>
          <View style={styles.inputContainer}>
            <Input 
              value={formData.effectiveStack} 
              onChangeText={(value) => updateNumericField('effectiveStack', value)}
              placeholder="Starting stack amount" 
              keyboardType="numeric" 
            />
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <ColorTagPicker
          title="Session Color"
          value={formData.tag}
          onValueChange={(value) => updateFormData('tag', value)}
        />
      </Card>

      <View style={styles.buttonContainer}>
        <Button 
          title={submitButtonTitle} 
          onPress={handleSubmit}
          disabled={isLoading || isSubmitting}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  section: {
    marginBottom: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 0.3,
  },
  inputContainer: {
    flex: 0.65,
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
}); 