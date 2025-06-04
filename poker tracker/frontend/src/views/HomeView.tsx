import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { handsApi, statsApi } from '../services/api';
import { PokerHand, Statistic } from '../models/types';
import { useNavigate } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const HomeView: React.FC = () => {
  const [hands, setHands] = useState<PokerHand[]>([]);
  const [stats, setStats] = useState<Statistic | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [handsData, statsData] = await Promise.all([
          handsApi.getAll(),
          statsApi.get(),
        ]);
        setHands(handsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddHand = () => {
    navigate('/hands/new');
  };

  const handleEditHand = (id: number) => {
    navigate(`/hands/${id}/edit`);
  };

  const handleDeleteHand = async (id: number) => {
    if (window.confirm('確定要刪除此記錄？')) {
      try {
        await handsApi.delete(id);
        setHands(hands.filter((hand) => hand.id !== id));
        // 重新獲取統計資料
        const statsData = await statsApi.get();
        setStats(statsData);
      } catch (error) {
        console.error('Error deleting hand:', error);
      }
    }
  };

  const handleViewHand = (id: number) => {
    navigate(`/hands/${id}`);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  // 獲取顏色基於獲利狀況
  const getResultColor = (result: number) => {
    return result >= 0 ? 'success.main' : 'error.main';
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          撲克追蹤器
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddHand}
          size="large"
        >
          記錄新手牌
        </Button>
      </Box>

      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
              <CardContent>
                <Typography variant="subtitle1">總場次</Typography>
                <Typography variant="h4">{stats.totalHands}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: stats.totalProfit >= 0 ? 'success.light' : 'error.light', color: 'white' }}>
              <CardContent>
                <Typography variant="subtitle1">總獲利</Typography>
                <Typography variant="h4">${stats.totalProfit.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: stats.avgProfit >= 0 ? 'success.light' : 'error.light', color: 'white' }}>
              <CardContent>
                <Typography variant="subtitle1">平均獲利</Typography>
                <Typography variant="h4">${stats.avgProfit.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
              <CardContent>
                <Typography variant="subtitle1">勝率</Typography>
                <Typography variant="h4">{stats.winRate.toFixed(1)}%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Typography variant="h5" gutterBottom>
        近期場次
      </Typography>

      {hands.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" color="text.secondary">
            尚無手牌記錄
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddHand}
            sx={{ mt: 2 }}
          >
            記錄第一筆
          </Button>
        </Box>
      ) : (
        <Card>
          <List sx={{ width: '100%' }}>
            {hands.map((hand, index) => (
              <React.Fragment key={hand.id}>
                {index > 0 && <Divider />}
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" onClick={() => handleEditHand(hand.id!)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDeleteHand(hand.id!)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                  onClick={() => handleViewHand(hand.id!)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{hand.location}</Typography>
                        <Typography variant="subtitle1" sx={{ color: getResultColor(hand.result) }}>
                          ${hand.result.toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography component="span" variant="body2" color="text.primary">
                          買入: ${hand.buyIn} | 取出: ${hand.cashOut}
                        </Typography>
                        <Box sx={{ display: 'flex', mt: 1 }}>
                          <Chip
                            label={formatDate(hand.startTime)}
                            size="small"
                            sx={{ mr: 1, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}
    </Container>
  );
};

export default HomeView; 