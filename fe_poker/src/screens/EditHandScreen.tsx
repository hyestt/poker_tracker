import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, SafeAreaView, Dimensions, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CustomPicker } from '../components/CustomPicker';
import { PokerKeyboardView } from '../components/PokerKeyboardView';
import { PokerQuickKeyboard } from '../components/PokerQuickKeyboard';
import { VillainInput } from '../components/VillainInput';
import { TagInput } from '../components/TagInput';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { UserPreferencesService } from '../services/UserPreferences';
import { Hand, Villain } from '../models';

export const EditHandScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  console.log('EditHandScreen route params:', route.params);
  const { handId } = route.params;
  console.log('EditHandScreen handId:', handId);
  const [holeCards, setHoleCards] = useState('');
  const [board, setBoard] = useState('');
  const [position, setPosition] = useState('');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [villains, setVillains] = useState<Villain[]>([]);
  const [showPokerKeyboard, setShowPokerKeyboard] = useState(false);
  const [showBoardKeyboard, setShowBoardKeyboard] = useState(false);
  const [showQuickKeyboard, setShowQuickKeyboard] = useState(false);
  const [showCustomKeyboard, setShowCustomKeyboard] = useState(false);
  const [useCustomKeyboard, setUseCustomKeyboard] = useState(false);
  const [selectedVillainIndex, setSelectedVillainIndex] = useState<number | null>(null);
  const detailsInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const resultInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleInputFocus = (inputRef: React.RefObject<TextInput | null>) => {
    setTimeout(() => {
      if (inputRef.current && scrollViewRef.current) {
        inputRef.current.measureInWindow((x, y, width, height) => {
          const screenHeight = Dimensions.get('window').height;
          const keyboardHeight = 250;
          const inputBottom = y + height;
          const availableHeight = screenHeight - keyboardHeight;

          if (inputBottom > availableHeight) {
            const scrollOffset = inputBottom - availableHeight + 50;
            scrollViewRef.current?.scrollTo({
              y: scrollOffset,
              animated: true,
            });
          }
        });
      }
    }, 100);
  };
  const { updateHand, getHand, fetchHands, fetchStats, getAllUsedTags } = useSessionStore();

  // Load poker keyboard preference on component mount
  useEffect(() => {
    const loadPokerKeyboardPreference = async () => {
      try {
        const preferences = await UserPreferencesService.getPreferences();
        setUseCustomKeyboard(preferences.pokerKeyboardEnabled);
      } catch (error) {
        console.error('Failed to load poker keyboard preference:', error);
      }
    };
    loadPokerKeyboardPreference();
  }, []);


  const positions = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'Unknown'];

  const handleHoleCardsSelect = () => {
    setSelectedVillainIndex(null);
    setShowPokerKeyboard(true);
  };

  const handleVillainCardsSelect = (villainIndex: number) => {
    console.log('Selecting villain cards for index:', villainIndex, 'villains length:', villains.length);
    setSelectedVillainIndex(villainIndex);
    setShowPokerKeyboard(true);
  };

  const handlePokerKeyboardClose = () => {
    setShowPokerKeyboard(false);
    setSelectedVillainIndex(null);
  };

  const handleCardSelect = useCallback((selectedCards: string[]) => {
    const cardsString = selectedCards.join(' ');
    console.log('handleCardSelect called with:', selectedCards, 'cardsString:', cardsString, 'selectedVillainIndex:', selectedVillainIndex);

    if (selectedVillainIndex !== null) {
      // Update villain cards using functional update to avoid dependency on villains
      setVillains(currentVillains => {
        console.log('Updating villain cards. Current villains:', currentVillains);
        if (selectedVillainIndex < currentVillains.length) {
          const updatedVillains = [...currentVillains];
          updatedVillains[selectedVillainIndex] = {
            ...updatedVillains[selectedVillainIndex],
            holeCards: cardsString,
          };
          console.log('Updated villains:', updatedVillains);
          return updatedVillains;
        }
        console.log('Invalid villain index:', selectedVillainIndex, 'length:', currentVillains.length);
        return currentVillains;
      });
    } else {
      // Update hero cards
      setHoleCards(cardsString);
    }
  }, [selectedVillainIndex]);

  const handleBoardSelect = () => {
    setShowBoardKeyboard(true);
  };

  const handleBoardKeyboardClose = () => {
    setShowBoardKeyboard(false);
  };

  const handleBoardCardSelect = useCallback((selectedCards: string[]) => {
    setBoard(selectedCards.join(' '));
  }, []);

  const handleQuickKeyboardOpen = () => {
    setShowQuickKeyboard(true);
  };

  const handleQuickKeyboardClose = () => {
    setShowQuickKeyboard(false);
  };

  const handleTextInsert = (text: string) => {
    // Get current cursor position
    const input = detailsInputRef.current;
    if (input) {
      // Insert text at cursor position
      const currentText = details;
      const selectionStart = input.props.selection?.start || currentText.length;
      const newText = currentText.slice(0, selectionStart) + text + currentText.slice(selectionStart);
      setDetails(newText);

      // Move cursor to after inserted text
      setTimeout(() => {
        input.setSelection?.(selectionStart + text.length, selectionStart + text.length);
      }, 10);
    }
  };

  const [lastInsertedText, setLastInsertedText] = useState<string>('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [deleteTimer, setDeleteTimer] = useState<NodeJS.Timeout | null>(null);
  const [note, setNote] = useState<string>('');
  const [favorite, setFavorite] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const detailsRef = useRef(details);
  const selectionRef = useRef(selection);

  // 更新 refs 當狀態改變時
  useEffect(() => {
    detailsRef.current = details;
  }, [details]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const handleQuickInsert = (text: string) => {
    const { start, end } = selection;
    const currentDetails = details || '';

    console.log('[DEBUG] handleQuickInsert called:', {
      text,
      start,
      end,
      currentDetailsLength: currentDetails.length,
      selectionState: selection,
      hasSelection: start !== end,
    });

    // 檢查是否需要在數字後自動添加空格（只在沒有選中文本時）
    let textToInsert = text;
    if (start === end && start > 0) {
      const previousChar = currentDetails.charAt(start - 1);
      const firstCharOfText = text.charAt(0);

      // 如果前一個字符是數字，且要插入的第一個字符不是數字、空格、標點符號，則自動添加空格
      if (/\d/.test(previousChar) &&
          !/[\d\s.,!?;:()\-+*/=]/.test(firstCharOfText)) {
        textToInsert = ' ' + text;
        console.log('[DEBUG] Added space before text:', textToInsert);
      }
    }

    // 在游標位置插入文字，或者替換選中的文本
    const newDetails = currentDetails.slice(0, start) + textToInsert + currentDetails.slice(end);
    const newPosition = start + textToInsert.length;

    if (start !== end) {
      console.log('[DEBUG] Replacing selected text:', {
        selectedText: currentDetails.slice(start, end),
        replacementText: textToInsert,
        oldText: currentDetails,
        newText: newDetails,
        newPosition,
      });
    } else {
      console.log('[DEBUG] Inserting text at cursor:', {
        oldText: currentDetails,
        newText: newDetails,
        insertPosition: start,
        newPosition,
        textToInsert,
      });
    }

    setDetails(newDetails);
    setLastInsertedText(textToInsert);

    // 保持TextInput的焦點並設置正確的游標位置
    if (detailsInputRef.current) {
      detailsInputRef.current.focus();
      // 先設置 TextInput 的實際游標位置
      console.log('[DEBUG] Setting cursor position via setSelection immediately:', newPosition);
      detailsInputRef.current.setSelection(newPosition, newPosition);

      // 然後更新 React state
      setTimeout(() => {
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    } else {
      setSelection({ start: newPosition, end: newPosition });
    }
  };

  const handleQuickDelete = useCallback(() => {
    const currentDetails = detailsRef.current;
    const currentSelection = selectionRef.current;
    const { start, end } = currentSelection;

    console.log('[DEBUG] handleQuickDelete called:', {
      start,
      end,
      currentDetailsLength: currentDetails.length,
      selectionState: currentSelection,
      hasSelection: start !== end,
    });

    if (currentDetails.length > 0) {
      let newDetails = '';
      let newPosition = 0;

      if (start !== end) {
        // 有文本被選中，刪除選中的文本
        newDetails = currentDetails.slice(0, start) + currentDetails.slice(end);
        newPosition = start;

        console.log('[DEBUG] Deleting selected text:', {
          selectedText: currentDetails.slice(start, end),
          oldText: currentDetails,
          newText: newDetails,
          newPosition,
        });
      } else if (start > 0) {
        // 沒有選中文本，刪除游標前的一個字符
        newDetails = currentDetails.slice(0, start - 1) + currentDetails.slice(start);
        newPosition = start - 1;

        console.log('[DEBUG] Deleting single character:', {
          deletedChar: currentDetails.charAt(start - 1),
          oldText: currentDetails,
          newText: newDetails,
          oldPosition: start,
          newPosition,
        });
      } else {
        // 游標在最前面，無法刪除
        return false;
      }

      setDetails(newDetails);

      // 只設置 TextInput 的實際游標位置，不更新 React state 以避免衝突
      if (detailsInputRef.current) {
        console.log('[DEBUG] Setting cursor position after delete (TextInput only):', newPosition);
        // 使用多重延遲確保設置成功
        detailsInputRef.current.setSelection(newPosition, newPosition);
        setTimeout(() => {
          if (detailsInputRef.current) {
            detailsInputRef.current.setSelection(newPosition, newPosition);
          }
        }, 10);
        setTimeout(() => {
          if (detailsInputRef.current) {
            detailsInputRef.current.setSelection(newPosition, newPosition);
          }
        }, 50);
      }

      return true; // 表示成功刪除
    }
    return false; // 表示無法刪除
  }, []);

  const handleDeletePressIn = () => {
    // 開始長按，設置定時器
    const timer = setTimeout(() => {
      const intervalTimer = setInterval(() => {
        const canDelete = handleQuickDelete();
        if (!canDelete) {
          // 沒有內容可刪除時停止
          clearInterval(intervalTimer);
          setDeleteTimer(null);
        }
      }, 150); // 每150毫秒刪除一個字符

      setDeleteTimer(intervalTimer);
    }, 500); // 長按500毫秒後開始快速刪除

    setDeleteTimer(timer);
  };

  const handleDeletePressOut = () => {
    // 停止長按，清除所有定時器
    if (deleteTimer) {
      clearTimeout(deleteTimer);
      clearInterval(deleteTimer);
      setDeleteTimer(null);
    }
  };

  const handleDeleteClick = () => {
    handleQuickDelete();
    setLastInsertedText(''); // 清除記錄
  };

  const handleDetailsInputFocus = () => {
    console.log('handleDetailsInputFocus called, current showCustomKeyboard:', showCustomKeyboard);
    if (useCustomKeyboard) {
      setShowCustomKeyboard(true);
    }
    // Focus the TextInput to show cursor
    if (detailsInputRef.current) {
      detailsInputRef.current.focus();
    }
  };

  const handleDetailsInputPress = () => {
    console.log('handleDetailsInputPress called');
    if (useCustomKeyboard) {
      setShowCustomKeyboard(true);
    }
    // Focus the TextInput to show cursor
    if (detailsInputRef.current) {
      detailsInputRef.current.focus();
    }
  };

  const handleDetailsInputBlur = () => {
    // Don't hide keyboard on blur to allow button presses
  };

  const hideCustomKeyboard = () => {
    console.log('hideCustomKeyboard called');
    setShowCustomKeyboard(false);
  };

  useEffect(() => {
    console.log('Current villains state:', villains);
  }, [villains]);

  useEffect(() => {
    const loadHand = async () => {
      try {
        console.log('Loading hand with ID:', handId);
        const hand = await getHand(handId);
        console.log('Loaded hand data:', hand);
        console.log('Hand villains:', hand.villains);
        console.log('Villains type:', typeof hand.villains);
        console.log('Villains length:', hand.villains?.length);
        setHoleCards(hand.holeCards || '');
        setBoard(hand.board || '');
        setPosition(hand.position || '');
        setDetails(hand.details || '');
        setNote(hand.note || '');
        setResult(hand.result.toString());
        setSessionId(hand.sessionId);
        setVillains(hand.villains || []);
        setFavorite(hand.favorite || false);
        setTags(hand.tags || []);
        console.log('Set villains to:', hand.villains || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load hand:', error);
        setLoading(false);
      }
    };

    if (handId) {
      loadHand();
    } else {
      console.error('No handId provided');
      setLoading(false);
    }
  }, [handId, getHand]);

  const handleSave = useCallback(async () => {
    // 驗證 Hero 的 hole cards 和 position 都不為空白
    if (!holeCards || holeCards.trim() === '') {
      Alert.alert(
        'Cannot Save',
        'Please select Hero\'s hole cards to save hand record',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (!position || position.trim() === '') {
      Alert.alert(
        'Cannot Save',
        'Please select Hero\'s position to save hand record',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    const now = new Date().toISOString();
    const hand: Hand = {
      id: handId,
      sessionId,
      holeCards,
      board,
      position,
      details,
      note,
      result: parseFloat(result) || 0,
      date: now,
      updatedAt: now,
      villains: villains,
      favorite,
      tags,
    };
    console.log('Saving hand with villains:', villains);
    console.log('Complete hand object:', hand);

    try {
      await updateHand(hand);
      // fetchHands 和 fetchStats 已經在 updateHand 中被調用了
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update hand:', error);
      Alert.alert('Error', 'Failed to update hand');
    }
  }, [handId, sessionId, holeCards, board, position, details, note, result, villains, favorite, tags, updateHand, navigation]);

  const handleSaveRef = useRef(handleSave);

  // 更新 ref 中的 handleSave 函數
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => handleSaveRef.current()} style={styles.headerSaveButton}>
          <Text style={styles.headerSaveButtonText}>Update</Text>
        </TouchableOpacity>
      ),
    });
  }, []); // 只在組件掛載時執行一次

  const addVillain = () => {
    const newVillain: Villain = {
      id: `villain_${Date.now()}`,
      holeCards: '',
      position: '',
    };
    setVillains([...villains, newVillain]);
  };

  const updateVillain = (index: number, field: 'holeCards' | 'position', value: string) => {
    const updatedVillains = [...villains];
    updatedVillains[index] = {
      ...updatedVillains[index],
      [field]: value,
    };
    setVillains(updatedVillains);
  };

  const removeVillain = (index: number) => {
    const updatedVillains = villains.filter((_, i) => i !== index);
    setVillains(updatedVillains);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading hand data...</Text>
        <Text style={styles.loadingText}>Hand ID: {handId}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={'padding'}
        keyboardVerticalOffset={88}
        enabled={true}
      >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Hero Section - moved to top */}
        <View style={styles.heroSection}>
          <View style={styles.fullWidthField}>
            <Text style={styles.fieldLabel}>Hero</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroCardSection}>
                <TouchableOpacity style={styles.holeCardDisplay} onPress={handleHoleCardsSelect}>
                  {holeCards ? (
                    <View style={styles.selectedCardsContainer}>
                      {holeCards.split(' ').map((card, index) => {
                        const rank = card.slice(0, -1);
                        const suit = card.slice(-1);
                        const getSuitColor = (suit: string) => {
                          return suit === '♥' || suit === '♦' ? '#EF4444' : '#000000';
                        };
                        return (
                          <View key={index} style={styles.miniCard}>
                            <Text style={[styles.miniCardText, { color: getSuitColor(suit) }]}>
                              {rank}{suit}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>
                      Select hole cards
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.heroPositionSection}>
                <CustomPicker
                  options={positions}
                  value={position}
                  onValueChange={setPosition}
                  onOptionsChange={() => {}} // Position options are fixed
                  placeholder="Position"
                  allowCustom={false}
                  allowDelete={false}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tightSpacer} />

        {/* Board Section */}
        <View style={styles.boardSection}>
          <View style={styles.fullWidthField}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>Board</Text>
              <View style={styles.fieldInputContainer}>
                <TouchableOpacity style={styles.holeCardDisplay} onPress={handleBoardSelect}>
                  {board ? (
                    <View style={styles.selectedCardsContainer}>
                      {board.split(' ').map((card, index) => {
                        const rank = card.slice(0, -1);
                        const suit = card.slice(-1);
                        const getSuitColor = (suit: string) => {
                          return suit === '♥' || suit === '♦' ? '#EF4444' : '#000000';
                        };

                        return (
                          <View key={index} style={styles.boardCardWrapper}>
                            {/* Add label above second flop card for center alignment */}
                            {index === 1 && (
                              <Text style={styles.boardLabel}>Flop</Text>
                            )}
                            {/* Add label above turn card */}
                            {index === 3 && (
                              <Text style={styles.boardLabel}>Turn</Text>
                            )}
                            {/* Add label above river card */}
                            {index === 4 && (
                              <Text style={styles.boardLabel}>River</Text>
                            )}
                            {/* Add empty placeholder for alignment */}
                            {index !== 1 && index !== 3 && index !== 4 && (
                              <Text style={styles.boardLabelPlaceholder}> </Text>
                            )}

                            <View style={styles.miniCard}>
                              <Text style={[styles.miniCardText, { color: getSuitColor(suit) }]}>
                                {rank}{suit}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>Select board cards</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tightSpacer} />

        {/* Hand Details Section - moved to bottom */}
        <View style={styles.topSection}>
          <View style={styles.fieldColumn}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Hand Details</Text>
              <View style={styles.keyboardToggleContainer}>
                <Text style={styles.toggleLabel}>Poker Keyboard</Text>
                <Switch
                  value={useCustomKeyboard}
                  onValueChange={async (value) => {
                    setUseCustomKeyboard(value);
                    // Save preference immediately
                    await UserPreferencesService.updatePokerKeyboardPreference(value);
                    if (value) {
                      setShowCustomKeyboard(true); // 開啟Poker鍵盤時立即顯示它
                    } else {
                      setShowCustomKeyboard(false); // 關閉Poker鍵盤時隱藏它
                    }
                  }}
                  trackColor={{false: '#D1D5DB', true: theme.colors.primary}}
                  thumbColor={'#FFFFFF'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
            </View>
            <TextInput
              ref={detailsInputRef}
              style={[styles.detailsInput, styles.detailsInputWrapper]}
              value={details}
              onChangeText={setDetails}
              onSelectionChange={(event) => {
                const newSelection = event.nativeEvent.selection;
                console.log('[DEBUG] onSelectionChange:', {
                  oldSelection: selection,
                  newSelection,
                  textLength: details.length,
                });
                setSelection(newSelection);
              }}
              // selection={selection} // Removed to avoid conflicts with manual setSelection calls
              placeholder="Enter detailed hand description..."
              placeholderTextColor={theme.colors.gray}
              multiline={true}
              numberOfLines={8}
              textAlignVertical="top"
              showSoftInputOnFocus={!useCustomKeyboard}
              onPressIn={handleDetailsInputPress}
              onFocus={handleDetailsInputFocus}
              editable={true}
            />
          </View>

          {/* Poker Keyboard - 只在點擊Hand Details時顯示 */}
          {useCustomKeyboard && showCustomKeyboard && (
            <View style={styles.customKeyboardContainer}>
              <View style={styles.keyboardHeader}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={hideCustomKeyboard} style={styles.hideKeyboardButton}>
                  <Text style={styles.hideKeyboardButtonText}>Hide</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quickButtonsSection}>

            {/* Round Buttons */}
            <View style={styles.buttonCategory}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.quickButton, styles.roundButton]}
                  onPress={() => handleQuickInsert('Preflop: ')}
                >
                  <Text style={[styles.quickButtonText, styles.roundButtonText]}>PF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.roundButton]}
                  onPress={() => handleQuickInsert('Flop: ')}
                >
                  <Text style={[styles.quickButtonText, styles.roundButtonText]}>F</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.roundButton]}
                  onPress={() => handleQuickInsert('Turn: ')}
                >
                  <Text style={[styles.quickButtonText, styles.roundButtonText]}>T</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.roundButton]}
                  onPress={() => handleQuickInsert('River: ')}
                >
                  <Text style={[styles.quickButtonText, styles.roundButtonText]}>R</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.positionButton]}
                  onPress={() => handleQuickInsert('UTG1 ')}
                >
                  <Text style={styles.quickButtonText}>U1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.positionButton]}
                  onPress={() => handleQuickInsert('UTG2 ')}
                >
                  <Text style={styles.quickButtonText}>U2</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.positionButton]}
                  onPress={() => handleQuickInsert('Hero ')}
                >
                  <Text style={styles.quickButtonText}>H</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.positionButton]}
                  onPress={() => handleQuickInsert('Villain ')}
                >
                  <Text style={styles.quickButtonText}>V</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Position Buttons */}
            <View style={styles.buttonCategory}>
              <View style={styles.buttonRow}>
                {['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'].map((position) => (
                  <TouchableOpacity
                    key={position}
                    style={[styles.quickButton, styles.positionButton]}
                    onPress={() => handleQuickInsert(position + ' ')}
                  >
                    <Text style={styles.quickButtonText}>{position}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>



            {/* Action Buttons */}
            <View style={styles.buttonCategory}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.quickButton, styles.actionButton]}
                  onPress={() => handleQuickInsert('Raise ')}
                >
                  <Text style={[styles.quickButtonText, styles.actionButtonText]}>Raise</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.actionButton]}
                  onPress={() => handleQuickInsert('All-In ')}
                >
                  <Text style={[styles.quickButtonText, styles.actionButtonText]}>All-In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.actionButton]}
                  onPress={() => handleQuickInsert('Fold ')}
                >
                  <Text style={[styles.quickButtonText, styles.actionButtonText]}>Fold</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.actionButton]}
                  onPress={() => handleQuickInsert('Bet ')}
                >
                  <Text style={[styles.quickButtonText, styles.actionButtonText]}>Bet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.actionButton]}
                  onPress={() => handleQuickInsert('Call ')}
                >
                  <Text style={[styles.quickButtonText, styles.actionButtonText]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickButton, styles.actionButton]}
                  onPress={() => handleQuickInsert('Check ')}
                >
                  <Text style={[styles.quickButtonText, styles.actionButtonText]}>Check</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Percentage Buttons */}
            <View style={styles.buttonCategory}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickInsert('straddle ')}
                >
                  <Text style={styles.quickButtonText}>str</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickInsert('Limp ')}
                >
                  <Text style={styles.quickButtonText}>L</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickInsert('$')}
                >
                  <Text style={styles.quickButtonText}>$</Text>
                </TouchableOpacity>
                {['1', '2', '3'].map((number) => (
                  <TouchableOpacity
                    key={number}
                    style={[styles.quickButton, styles.numberButton]}
                    onPress={() => handleQuickInsert(number)}
                  >
                    <Text style={[styles.quickButtonText, styles.numberButtonText]}>{number}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.quickButton, styles.numberButton]}
                  onPress={() => handleQuickInsert('0')}
                >
                  <Text style={[styles.quickButtonText, styles.numberButtonText]}>0</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Number Buttons */}
            <View style={styles.buttonCategory}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickInsert('Pot: ')}
                >
                  <Text style={styles.quickButtonText}>Pot</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickInsert('/')}
                >
                  <Text style={styles.quickButtonText}>/</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickInsert('x')}
                >
                  <Text style={styles.quickButtonText}>x</Text>
                </TouchableOpacity>
                {['4', '5', '6'].map((number) => (
                  <TouchableOpacity
                    key={number}
                    style={[styles.quickButton, styles.numberButton]}
                    onPress={() => handleQuickInsert(number)}
                  >
                    <Text style={[styles.quickButtonText, styles.numberButtonText]}>{number}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.quickButton, styles.deleteButton]}
                  onPress={handleDeleteClick}
                  onPressIn={handleDeletePressIn}
                  onPressOut={handleDeletePressOut}
                >
                  <Text style={[styles.quickButtonText, styles.deleteButtonText]}>←</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.buttonRow}>
                {[',', ' '].map((symbol) => (
                  <TouchableOpacity
                    key={symbol}
                    style={styles.quickButton}
                    onPress={() => handleQuickInsert(symbol)}
                  >
                    <Text style={styles.quickButtonText}>
                      {symbol === ' ' ? '␣' : symbol}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleQuickInsert('.')}
                >
                  <Text style={styles.quickButtonText}>.</Text>
                </TouchableOpacity>
                {['7', '8', '9'].map((number) => (
                  <TouchableOpacity
                    key={number}
                    style={[styles.quickButton, styles.numberButton]}
                    onPress={() => handleQuickInsert(number)}
                  >
                    <Text style={[styles.quickButtonText, styles.numberButtonText]}>{number}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.quickButton, styles.wideButton, styles.enterButton]}
                  onPress={() => handleQuickInsert('\n')}
                >
                  <Text style={[styles.quickButtonText, styles.enterButtonText]}>↵</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
            </View>
          )}
        </View>

        {/* Hand Details Section */}
        <View style={styles.bottomSection}>
          {/* Note Section */}
          <View style={styles.fullWidthField}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>Note</Text>
              <View style={styles.fieldInputContainer}>
                <TextInput
                  ref={noteInputRef}
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  onFocus={() => handleInputFocus(noteInputRef)}
                  placeholder="Add a note..."
                  placeholderTextColor={theme.colors.gray}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  scrollEnabled={false}
                />
              </View>
            </View>
          </View>

          {/* Tags Section */}
          <View style={styles.fullWidthField}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>Tags</Text>
              <View style={styles.fieldInputContainer}>
                <TagInput
                  tags={tags}
                  onTagsChange={setTags}
                  placeholder="Add hand tags..."
                  availableTags={getAllUsedTags()}
                />
              </View>
            </View>
          </View>

          {/* Villain Section */}
          <View style={styles.fullWidthField}>
            <View style={styles.villainHeaderRow}>
              <Text style={styles.fieldLabel}>Villain</Text>
              <TouchableOpacity onPress={addVillain} style={styles.addVillainButton}>
                <Text style={styles.addVillainButtonText}>+ Add Villain</Text>
              </TouchableOpacity>
            </View>
            {villains.map((villain, index) => (
              <VillainInput
                key={villain.id}
                villain={villain}
                index={index}
                onUpdate={updateVillain}
                onRemove={removeVillain}
                onHoleCardsPress={handleVillainCardsSelect}
                positions={positions}
              />
            ))}
          </View>

          {/* Result Section */}
          <View style={styles.fullWidthField}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>Result ($)</Text>
              <View style={styles.fieldInputContainer}>
                <TextInput
                  ref={resultInputRef}
                  value={result}
                  onChangeText={setResult}
                  onFocus={() => handleInputFocus(resultInputRef)}
                  placeholder="+150, -75"
                  keyboardType="numbers-and-punctuation"
                  style={styles.compactInput}
                />
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Poker Keyboard Modal */}
      <Modal
        visible={showPokerKeyboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePokerKeyboardClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handlePokerKeyboardClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Cards</Text>
            <TouchableOpacity onPress={handlePokerKeyboardClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <PokerKeyboardView
            onCardSelect={handleCardSelect}
            initialAction="hole"
            initialCards={selectedVillainIndex !== null && selectedVillainIndex < villains.length ?
              (villains[selectedVillainIndex]?.holeCards ? villains[selectedVillainIndex].holeCards!.split(' ') : []) :
              (holeCards ? holeCards.split(' ') : [])
            }
            onDone={handlePokerKeyboardClose}
          />
        </SafeAreaView>
      </Modal>

      {/* Board Keyboard Modal */}
      <Modal
        visible={showBoardKeyboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleBoardKeyboardClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleBoardKeyboardClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Board Cards</Text>
            <TouchableOpacity onPress={handleBoardKeyboardClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <PokerKeyboardView
            onCardSelect={handleBoardCardSelect}
            initialAction="hole"
            initialCards={board ? board.split(' ') : []}
            onDone={handleBoardKeyboardClose}
          />
        </SafeAreaView>
      </Modal>

      {/* Quick Keyboard Modal */}
      <Modal
        visible={showQuickKeyboard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleQuickKeyboardClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <PokerQuickKeyboard
            onTextInsert={handleTextInsert}
            onClose={handleQuickKeyboardClose}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xs,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 300,
  },
  topSection: {
    // 移除 flex: 1 讓內容自然流動
  },
  resultSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldColumn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  keyboardIcon: {
    padding: theme.spacing.xs,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
  },
  keyboardIconText: {
    fontSize: 16,
  },
  detailsInputWrapper: {
    flex: 1,
  },
  detailsInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    padding: theme.spacing.xs,
    fontSize: 21, // 放大字體從 18 到 21
    color: theme.colors.text,
    minHeight: 200,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
  },
  noteInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    padding: theme.spacing.sm,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
  },
  spacer: {
    flex: 1,
    minHeight: theme.spacing.sm,
  },
  bottomSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultInput: {
    marginBottom: theme.spacing.xs,
  },
  headerSaveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaveButtonText: {
    color: '#FFFFFF',
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  fieldLabel: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 0.3,
  },
  holeCardDisplay: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCardsContainer: {
    flexDirection: 'row',
    gap: 6,  // 從 4 增加到 6，給更大的卡片更多間距
  },
  miniCard: {
    backgroundColor: 'white',
    borderRadius: 6,        // 從 4 增加到 6
    paddingHorizontal: 10,  // 從 6 增加到 10
    paddingVertical: 4,     // 從 2 增加到 4
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  miniCardText: {
    fontSize: 16,   // 從 12 增加到 16
    fontWeight: '600',
  },
  placeholderText: {
    color: theme.colors.gray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  closeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  closeButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '700',
    color: theme.colors.text,
  },
  doneButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  doneButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  horizontalRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  halfField: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fullWidthField: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thirdField: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs / 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactInput: {
    fontSize: theme.font.size.small,
    paddingVertical: theme.spacing.xs,
    color: theme.colors.text,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.sm,
  },
  customKeyboardContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    marginTop: theme.spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  keyboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E7EB',
  },
  keyboardTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  hideKeyboardButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'transparent',
    borderRadius: theme.radius.button,
  },
  hideKeyboardButtonText: {
    fontSize: theme.font.size.small,
    color: '#FFFFFF',
    fontWeight: '700',  // 更粗的字體
  },
  quickButtonsSection: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.card,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickButtonsTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  buttonCategory: {
    marginBottom: theme.spacing.xs,
  },
  categoryTitle: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Math.max(theme.spacing.xs, 6), // 調整gap間距到適中程度
  },
  quickButton: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.button,
    paddingHorizontal: 0, // 完全移除水平padding
    paddingVertical: 0, // 完全移除垂直padding
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
    flex: 1,
    minWidth: Math.max(Dimensions.get('window').width * 0.09, 36), // 響應式最小寬度：調整到9%，最低36px
    maxWidth: Dimensions.get('window').width * 0.16, // 增加最大寬度到16%
    height: 32, // 進一步減少高度到32px
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2, // 添加小間距
  },
  quickButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  roundButton: {
    backgroundColor: theme.colors.profit,
    borderColor: theme.colors.profit,
    minWidth: Math.max(Dimensions.get('window').width * 0.07, 28), // 減少最小寬度：從原本更大，調整到7%，最低28px
    maxWidth: Dimensions.get('window').width * 0.10, // 最大寬度也相應調整到10%
    paddingHorizontal: 0, // 完全移除水平padding
    height: 32, // 與一般按鈕保持一致的高度
  },
  compactButton: {
    minWidth: Math.max(Dimensions.get('window').width * 0.11, 44), // 調整為適中大小：11%，最低44px
    paddingHorizontal: theme.spacing.xs,
  },
  roundButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 18,
  },
  deleteButton: {
    backgroundColor: theme.colors.loss,
    borderColor: theme.colors.loss,
  },
  deleteButtonText: {
    color: '#000000',
    fontWeight: '700',
  },
  enterButton: {
    backgroundColor: '#BFDBFE', // 淡藍色
    borderColor: '#93C5FD',
  },
  enterButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 18,
  },
  wideButton: {
    minWidth: Math.max(Dimensions.get('window').width * 0.09, 36), // 與一般按鈕相同大小
    paddingHorizontal: 0,
  },
  heroRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  heroCardSection: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  heroPositionSection: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  villainHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  addVillainButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
  },
  addVillainButtonText: {
    color: '#FFFFFF',
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  fieldInputContainer: {
    flex: 0.8,
  },
  boardLabel: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  boardCardWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  boardLabelPlaceholder: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  keyboardToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  toggleLabel: {
    fontSize: theme.font.size.small,
    fontWeight: '500',
    color: theme.colors.text,
  },
  numberButton: {
    backgroundColor: '#A7F3D0', // 淡綠色
    borderColor: '#6EE7B7',
  },
  numberButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  positionButton: {
    backgroundColor: theme.colors.positionButton,
  },
  heroSection: {
    marginBottom: theme.spacing.xs,
  },
  boardSection: {
    marginBottom: theme.spacing.xs,
  },
  tightSpacer: {
    minHeight: theme.spacing.xs / 2,
  },
});
