import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, SafeAreaView, Switch, Alert } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CustomPicker } from '../components/CustomPicker';
import { PokerKeyboardView } from '../components/PokerKeyboardView';
import { PokerQuickKeyboard } from '../components/PokerQuickKeyboard';
import { VillainInput } from '../components/VillainInput';
import { theme } from '../theme';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Hand, Villain } from '../models';


export const RecordHandScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [holeCards, setHoleCards] = useState('');
  const [board, setBoard] = useState('');
  const [position, setPosition] = useState('');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const [villains, setVillains] = useState<Villain[]>([]);
  const [showPokerKeyboard, setShowPokerKeyboard] = useState(false);
  const [showBoardKeyboard, setShowBoardKeyboard] = useState(false);
  const [showQuickKeyboard, setShowQuickKeyboard] = useState(false);
  const [showCustomKeyboard, setShowCustomKeyboard] = useState(false);
  const [useCustomKeyboard, setUseCustomKeyboard] = useState(true);
  const [selectedVillainIndex, setSelectedVillainIndex] = useState<number | null>(null);
  const detailsInputRef = useRef<TextInput>(null);
  const { addHand, fetchHands, fetchStats } = useSessionStore();

  const positions = ['UTG', 'UTG1', 'UTG2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

  const handleHoleCardsSelect = () => {
    setSelectedVillainIndex(null);
    setShowPokerKeyboard(true);
  };

  const handleVillainCardsSelect = (villainIndex: number) => {
    setSelectedVillainIndex(villainIndex);
    setShowPokerKeyboard(true);
  };

  const handlePokerKeyboardClose = () => {
    setShowPokerKeyboard(false);
    setSelectedVillainIndex(null);
  };

  const handleCardSelect = (selectedCards: string[]) => {
    const cardsString = selectedCards.join(' ');
    if (selectedVillainIndex !== null && selectedVillainIndex < villains.length) {
      // Update villain cards
      const updatedVillains = [...villains];
      updatedVillains[selectedVillainIndex] = {
        ...updatedVillains[selectedVillainIndex],
        holeCards: cardsString
      };
      setVillains(updatedVillains);
    } else {
      // Update hero cards
      setHoleCards(cardsString);
    }
  };

  const addVillain = () => {
    const newVillain: Villain = {
      id: `villain_${Date.now()}`,
      holeCards: '',
      position: ''
    };
    setVillains([...villains, newVillain]);
  };

  const updateVillain = (index: number, field: 'holeCards' | 'position', value: string) => {
    const updatedVillains = [...villains];
    updatedVillains[index] = {
      ...updatedVillains[index],
      [field]: value
    };
    setVillains(updatedVillains);
  };

  const removeVillain = (index: number) => {
    const updatedVillains = villains.filter((_, i) => i !== index);
    setVillains(updatedVillains);
  };

  const handleBoardSelect = () => {
    setShowBoardKeyboard(true);
  };

  const handleBoardKeyboardClose = () => {
    setShowBoardKeyboard(false);
  };

  const handleBoardCardSelect = (selectedCards: string[]) => {
    setBoard(selectedCards.join(' '));
  };

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
  const detailsRef = useRef(details);
  const selectionRef = useRef(selection);

  // 更新 refs 當狀態改變時
  useEffect(() => {
    detailsRef.current = details;
  }, [details]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  // 新增：當useCustomKeyboard為true時，自動顯示鍵盤
  useEffect(() => {
    if (useCustomKeyboard) {
      setShowCustomKeyboard(true);
    }
  }, []);

  const handleQuickInsert = (text: string) => {
    const cursorPosition = selection.start;
    const currentDetails = details || '';
    
    // 在游標位置插入文字
    const newDetails = currentDetails.slice(0, cursorPosition) + text + currentDetails.slice(cursorPosition);
    setDetails(newDetails);
    
    // 更新游標位置到插入文字的右邊
    const newPosition = cursorPosition + text.length;
    setSelection({ start: newPosition, end: newPosition });
    
    setLastInsertedText(text);
    
    // 保持TextInput的焦點
    if (detailsInputRef.current) {
      detailsInputRef.current.focus();
    }
  };

  const handleQuickDelete = useCallback(() => {
    const currentDetails = detailsRef.current;
    const currentSelection = selectionRef.current;
    const cursorPosition = currentSelection.start;
    
    if (cursorPosition > 0 && currentDetails.length > 0) {
      // 在游標位置刪除一個字符
      const newDetails = currentDetails.slice(0, cursorPosition - 1) + currentDetails.slice(cursorPosition);
      setDetails(newDetails);
      
      // 更新游標位置
      const newPosition = cursorPosition - 1;
      setSelection({ start: newPosition, end: newPosition });
      
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
    console.log('useCustomKeyboard:', useCustomKeyboard);
    if (useCustomKeyboard) {
      console.log('Setting showCustomKeyboard to true');
      setShowCustomKeyboard(true);
    }
    // Focus the TextInput to show cursor
    if (detailsInputRef.current) {
      detailsInputRef.current.focus();
    }
  };

  const handleDetailsInputPress = () => {
    console.log('handleDetailsInputPress called, useCustomKeyboard:', useCustomKeyboard);
    console.log('current showCustomKeyboard:', showCustomKeyboard);
    if (useCustomKeyboard) {
      console.log('Setting showCustomKeyboard to true from Press');
      setShowCustomKeyboard(true);
    }
    // Focus the TextInput to show cursor
    if (detailsInputRef.current) {
      detailsInputRef.current.focus();
    }
  };

  const handleDetailsInputBlur = () => {
    // Don't hide custom keyboard on blur to maintain visibility during typing
  };

  const hideCustomKeyboard = () => {
    setShowCustomKeyboard(false);
  };

  const handleSave = async () => {
    // 驗證 Hero 的 hole cards 和 position 都不為空白
    if (!holeCards || holeCards.trim() === '') {
      Alert.alert(
        '無法保存',
        '請選擇 Hero 的底牌才能保存手牌記錄',
        [{ text: '確定', style: 'default' }]
      );
      return;
    }

    if (!position || position.trim() === '') {
      Alert.alert(
        '無法保存',
        '請選擇 Hero 的位置才能保存手牌記錄',
        [{ text: '確定', style: 'default' }]
      );
      return;
    }

    const hand: Hand = {
      id: Date.now().toString(),
      sessionId,
      holeCards,
      board,
      position,
      details,
      note,
      result: parseInt(result) || 0,
      date: new Date().toISOString(),
      villains,
      favorite: false,
    };
    await addHand(hand);
    await fetchHands();
    await fetchStats();
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.headerSaveButton}>
          <Text style={styles.headerSaveButtonText}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSave]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSection}>
          <View style={styles.fieldColumn}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Hand Details</Text>
              <View style={styles.keyboardToggleContainer}>
                <Switch
                  value={useCustomKeyboard}
                  onValueChange={(value) => {
                    setUseCustomKeyboard(value);
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
              style={styles.detailsInput}
              value={details}
              onChangeText={setDetails}
              onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
              selection={selection}
              placeholder="Enter detailed hand description..."
              placeholderTextColor={theme.colors.gray}
              multiline={true}
              numberOfLines={8}
              textAlignVertical="top"
              showSoftInputOnFocus={!useCustomKeyboard}
              onFocus={handleDetailsInputFocus}
              onPressIn={handleDetailsInputPress}
              onBlur={handleDetailsInputBlur}
            />
          </View>


        </View>
        
        <View style={styles.spacer} />
        
        <View style={styles.bottomSection}>
          {/* Board Row */}
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
                          return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000';
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
                    <Text style={styles.placeholderText}>
                      Select board cards
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Hole Cards and Position Row */}
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
                          return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000';
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

          {/* Note Section */}
          <View style={styles.fullWidthField}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>Note</Text>
              <View style={styles.fieldInputContainer}>
                <TextInput
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note..."
                  placeholderTextColor={theme.colors.gray}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Result Section */}
          <View style={styles.fullWidthField}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>Result ($)</Text>
              <View style={styles.fieldInputContainer}>
                <Input 
                  value={result} 
                  onChangeText={setResult} 
                  placeholder="+150, -75" 
                  keyboardType="numeric" 
                  style={styles.compactInput}
                />
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

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

      {/* Direct Custom Keyboard */}
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
              onPress={() => handleQuickInsert('Preflop: \n')}
            >
              <Text style={[styles.quickButtonText, styles.roundButtonText]}>PF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, styles.roundButton]}
              onPress={() => handleQuickInsert('Flop: \n')}
            >
              <Text style={[styles.quickButtonText, styles.roundButtonText]}>F</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, styles.roundButton]}
              onPress={() => handleQuickInsert('Turn: \n')}
            >
              <Text style={[styles.quickButtonText, styles.roundButtonText]}>T</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, styles.roundButton]}
              onPress={() => handleQuickInsert('River: \n')}
            >
              <Text style={[styles.quickButtonText, styles.roundButtonText]}>R</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, styles.compactButton]}
              onPress={() => handleQuickInsert('UTG1 ')}
            >
              <Text style={styles.quickButtonText}>UTG1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, styles.compactButton]}
              onPress={() => handleQuickInsert('UTG2 ')}
            >
              <Text style={styles.quickButtonText}>UTG2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleQuickInsert('Hero ')}
            >
              <Text style={styles.quickButtonText}>H</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleQuickInsert('Villain ')}
            >
              <Text style={styles.quickButtonText}>V</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Position Buttons */}
        <View style={styles.buttonCategory}>
          <View style={styles.buttonRow}>
                            {['UTG', 'UTG1', 'UTG2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'].map((position) => (
              <TouchableOpacity
                key={position}
                style={styles.quickButton}
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
              onPress={() => handleQuickInsert('All-IN ')}
            >
              <Text style={[styles.quickButtonText, styles.actionButtonText]}>ALL-IN</Text>
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
              <Text style={styles.quickButtonText}>Limp</Text>
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
                style={styles.quickButton}
                onPress={() => handleQuickInsert(number)}
              >
                <Text style={styles.quickButtonText}>{number}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleQuickInsert('0')}
            >
              <Text style={styles.quickButtonText}>0</Text>
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
                style={styles.quickButton}
                onPress={() => handleQuickInsert(number)}
              >
                <Text style={styles.quickButtonText}>{number}</Text>
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
                style={styles.quickButton}
                onPress={() => handleQuickInsert(number)}
              >
                <Text style={styles.quickButtonText}>{number}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
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
  detailsInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    padding: theme.spacing.xs,
    fontSize: 18, // 放大字體從 theme.font.size.body (通常是16) 到 18
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
    paddingTop: theme.spacing.sm,
  },
  resultInput: {
    marginBottom: theme.spacing.md,
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
  holeCardText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.gray,
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
  fieldLabel: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 0.3,
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
  },
  quickButtonsSection: {
    backgroundColor: theme.colors.card,
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
    gap: theme.spacing.xs,
  },
  quickButton: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonText: {
    fontSize: theme.font.size.small,
    color: '#000000',
    fontWeight: '700',
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
    minWidth: 35,
    paddingHorizontal: theme.spacing.xs / 2,
  },
  compactButton: {
    minWidth: 40,
    paddingHorizontal: theme.spacing.xs / 2,
  },
  roundButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: theme.colors.loss,
    borderColor: theme.colors.loss,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  enterButton: {
    backgroundColor: '#A7F3D0', // 淡綠色背景
    borderColor: '#6EE7B7',
  },
  enterButtonText: {
    color: '#065F46', // 深綠色文字配合淡綠色背景
    fontWeight: '700',
    fontSize: theme.font.size.body, // 稍大的字體
  },
  wideButton: {
    minWidth: 45, // 進一步縮小按鈕寬度
    paddingHorizontal: theme.spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  heroCardSection: {
    flex: 1,
  },
  heroPositionSection: {
    flex: 1,
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
    color: theme.colors.text,
    fontWeight: '500',
  },
  customKeyboardContainer: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    maxHeight: 300,
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  hideKeyboardButtonText: {
    fontSize: theme.font.size.small,
    color: '#FFFFFF',
    fontWeight: '700',
  },
}); 