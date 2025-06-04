import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Grid,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { actionsApi, handsApi } from '../services/api';
import { Action, PokerHand } from '../models/types';
import { format } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CardSelector from '../components/CardSelector';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// 頁籤面板
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HandDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hand, setHand] = useState<PokerHand | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [newAction, setNewAction] = useState<Partial<Action>>({
    handId: Number(id),
    stage: 'preflop',
    actionType: 'bet',
    amount: 0,
    position: 'BB',
    cards: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        
        const handData = await handsApi.getById(Number(id));
        setHand(handData);
        
        const actionsData = await actionsApi.getByHandId(Number(id));
        setActions(actionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 處理刪除手牌
  const handleDelete = async () => {
    if (!hand || !hand.id) return;
    
    if (window.confirm('確定要刪除此記錄？')) {
      try {
        await handsApi.delete(hand.id);
        navigate('/');
      } catch (error) {
        console.error('Error deleting hand:', error);
      }
    }
  };

  // 處理頁籤切換
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 處理新增動作
  const handleAddAction = async () => {
    if (!id) return;
    
    try {
      const actionData = { ...newAction, handId: Number(id) };
      const response = await actionsApi.create(Number(id), actionData as Action);
      setActions([...actions, response]);
      
      // 重置表單
      setNewAction({
        handId: Number(id),
        stage: 'preflop',
        actionType: 'bet',
        amount: 0,
        position: 'BB',
        cards: '',
      });
    } catch (error) {
      console.error('Error adding action:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };

  // 獲取結果顏色
  const getResultColor = (result: number) => {
    return result >= 0 ? 'success.main' : 'error.main';
  };

  // 獲取動作顏色
  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'bet':
        return 'primary';
      case 'call':
        return 'success';
      case 'fold':
        return 'error';
      case 'check':
        return 'info';
      case 'raise':
        return 'warning';
      case 'all-in':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // 獲取階段名稱
  const getStageName = (stage: string) => {
    switch (stage) {
      case 'preflop':
        return '翻牌前';
      case 'flop':
        return '翻牌';
      case 'turn':
        return '轉牌';
      case 'river':
        return '河牌';
      default:
        return stage;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hand) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" color="error">手牌記錄不存在</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          返回首頁
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          手牌詳情
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={() => navigate(`/hands/${id}/edit`)} color="primary">
          <EditIcon />
        </IconButton>
        <IconButton onClick={handleDelete} color="error">
          <DeleteIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">{hand.location}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {formatDate(hand.startTime)} - {formatDate(hand.endTime)}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">買入金額</Typography>
              <Typography variant="h6">${hand.buyIn.toFixed(2)}</Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">取出金額</Typography>
              <Typography variant="h6">${hand.cashOut.toFixed(2)}</Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">結果</Typography>
              <Typography variant="h6" sx={{ color: getResultColor(hand.result) }}>
                ${hand.result.toFixed(2)}
              </Typography>
            </Grid>

            {hand.notes && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">備註</Typography>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                    <Typography variant="body1">{hand.notes}</Typography>
                  </Paper>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="hand details tabs">
          <Tab label="動作記錄" />
          <Tab label="新增動作" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {actions.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1" color="text.secondary">
                尚無動作記錄
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setTabValue(1)}
                sx={{ mt: 2 }}
              >
                記錄動作
              </Button>
            </Box>
          ) : (
            <Box>
              {['preflop', 'flop', 'turn', 'river'].map((stage) => {
                const stageActions = actions.filter(action => action.stage === stage);
                if (stageActions.length === 0) return null;

                return (
                  <Box key={stage} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {getStageName(stage)}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {stageActions.map((action, index) => (
                        <Box key={action.id} sx={{ mb: index < stageActions.length - 1 ? 2 : 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip
                              label={action.position}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={action.actionType}
                              size="small"
                              color={getActionTypeColor(action.actionType)}
                            />
                            {action.amount > 0 && (
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                ${action.amount}
                              </Typography>
                            )}
                          </Box>
                          {action.cards && (
                            <Typography variant="body2" color="text.secondary">
                              手牌: {action.cards}
                            </Typography>
                          )}
                          {index < stageActions.length - 1 && (
                            <Divider sx={{ my: 1 }} />
                          )}
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                );
              })}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box component="form">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <CardSelector
                  value={newAction.cards || ''}
                  onChange={(value) => setNewAction({ ...newAction, cards: value })}
                />
              </Grid>
              
              {/* 其他表單欄位可以根據需要添加 */}
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddAction}
                  startIcon={<AddIcon />}
                  fullWidth
                >
                  新增動作
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default HandDetailView; 