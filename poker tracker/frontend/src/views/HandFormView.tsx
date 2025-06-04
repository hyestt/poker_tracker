import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { handsApi } from '../services/api';
import { PokerHand } from '../models/types';
import HandForm from '../components/HandForm';

interface HandFormViewProps {
  isEdit?: boolean;
}

const HandFormView: React.FC<HandFormViewProps> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const [hand, setHand] = useState<PokerHand | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 編輯模式下，獲取手牌資料
    if (isEdit && id) {
      const fetchHand = async () => {
        try {
          const data = await handsApi.getById(Number(id));
          setHand(data);
        } catch (error) {
          console.error('Error fetching hand:', error);
          navigate('/');
        } finally {
          setLoading(false);
        }
      };

      fetchHand();
    }
  }, [isEdit, id, navigate]);

  // 處理表單提交
  const handleSubmit = async (data: Partial<PokerHand>) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        // 更新手牌
        await handsApi.update(Number(id), data as PokerHand);
      } else {
        // 創建新手牌
        await handsApi.create(data as PokerHand);
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving hand:', error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          {isEdit ? '編輯手牌記錄' : '新增手牌記錄'}
        </Typography>
      </Box>

      <HandForm
        initialData={hand || undefined}
        onSubmit={handleSubmit}
        isLoading={submitting}
        title={isEdit ? '編輯手牌記錄' : '新增手牌記錄'}
      />
    </Container>
  );
};

export default HandFormView; 