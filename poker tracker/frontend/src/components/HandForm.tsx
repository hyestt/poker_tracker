import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  InputAdornment,
} from '@mui/material';
import { PokerHand } from '../models/types';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface HandFormProps {
  initialData?: Partial<PokerHand>;
  onSubmit: (data: Partial<PokerHand>) => void;
  isLoading?: boolean;
  title?: string;
}

const HandForm: React.FC<HandFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  title = '新增手牌記錄',
}) => {
  const [formData, setFormData] = useState<Partial<PokerHand>>({
    location: '',
    buyIn: 0,
    cashOut: 0,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    notes: '',
    ...initialData,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'buyIn' || name === 'cashOut' ? parseFloat(value) : value,
    }));
  };

  const handleStartTimeChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        startTime: date.toISOString(),
      }));
    }
  };

  const handleEndTimeChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        endTime: date.toISOString(),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // 計算預計結果
  const result = (formData.cashOut || 0) - (formData.buyIn || 0);

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="地點"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="輸入遊戲地點"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="買入金額"
                name="buyIn"
                type="number"
                value={formData.buyIn || ''}
                onChange={handleChange}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="取出金額"
                name="cashOut"
                type="number"
                value={formData.cashOut || ''}
                onChange={handleChange}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: result >= 0 ? 'success.light' : 'error.light',
                  color: 'white',
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  結果: ${result.toFixed(2)} ({result >= 0 ? '贏' : '輸'})
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="開始時間"
                  value={formData.startTime ? new Date(formData.startTime) : null}
                  onChange={handleStartTimeChange}
                  slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="結束時間"
                  value={formData.endTime ? new Date(formData.endTime) : null}
                  onChange={handleEndTimeChange}
                  slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備註"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                multiline
                rows={4}
                variant="outlined"
                placeholder="輸入任何備註..."
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{ py: 1.5 }}
              >
                {isLoading ? '處理中...' : '儲存'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HandForm; 