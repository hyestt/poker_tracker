import React, { useState, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  availableTags?: string[]; // 可用的建議tags
  maxTags?: number; // 最大標籤數量
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = 'Add tag...',
  availableTags = [],
  maxTags = 3,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 檢查是否已達到標籤限制
  const isAtMaxTags = tags.length >= maxTags;

  // 定義不同順序標籤的顏色
  const getTagColor = (index: number) => {
    const colors = ['#FF69B4', '#4169E1', '#32CD32']; // 粉紅色、藍色、綠色
    return colors[index] || theme.colors.primary;
  };

  // 計算建議的tags (過濾已選中的和匹配輸入的)
  const suggestions = useMemo(() => {
    if (!inputValue.trim() || !availableTags.length) {return [];}

    const filtered = availableTags.filter(tag =>
      !tags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
    );

    return filtered.slice(0, 5); // 最多顯示5個建議
  }, [inputValue, tags, availableTags]);

  // 計算常用的tags (未選中的前5個)
  const popularTags = useMemo(() => {
    return availableTags.filter(tag => !tags.includes(tag)).slice(0, 8);
  }, [tags, availableTags]);

  const addTag = (tagToAdd?: string) => {
    // 清除隱藏timeout，防止建議在點擊時消失
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (tagToAdd) {
      // 直接添加指定的tag (用于建议tags)
      const trimmedValue = tagToAdd.trim();
      if (trimmedValue && !tags.includes(trimmedValue) && !isAtMaxTags) {
        onTagsChange([...tags, trimmedValue]);
        setInputValue('');
        // 不立即隱藏建議，讓用戶可以繼續選擇更多標籤
        // 只有在達到最大標籤數時才隱藏建議
        if (tags.length + 1 >= maxTags) {
          setShowSuggestions(false);
        }
      }
    } else {
      // 只添加输入框中的tag
      const trimmedInput = inputValue.trim();
      if (trimmedInput && !tags.includes(trimmedInput) && !isAtMaxTags) {
        onTagsChange([...tags, trimmedInput]);
        setInputValue('');
        setShowSuggestions(false);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
    // 移除標籤後，如果輸入框有焦點，重新顯示建議
    if (showSuggestions === false && !inputValue.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleInputSubmit = () => {
    addTag();
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // 延遲隱藏建議，讓用戶有時間點擊建議
    // 增加延遲時間以改善物理設備上的觸控體驗
    hideTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 500);
  };

  const togglePopularTag = (tag: string) => {
    console.log(`[TagInput] togglePopularTag called with tag: ${tag}`);
    console.log('[TagInput] Current tags:', tags);
    console.log(`[TagInput] isAtMaxTags: ${isAtMaxTags}`);

    // 清除隱藏timeout，防止建議在點擊時消失
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
      console.log('[TagInput] Cleared hide timeout');
    }

    if (tags.includes(tag)) {
      // 如果tag已经在最终tags中，不做任何操作
      console.log(`[TagInput] Tag ${tag} already exists, skipping`);
      return;
    }

    // 直接添加到最终tags中，不需要中间选择状态
    if (!isAtMaxTags) {
      console.log(`[TagInput] Adding tag ${tag} to tags`);
      const newTags = [...tags, tag];
      onTagsChange(newTags);
      console.log('[TagInput] New tags:', newTags);

      // 不立即隱藏建議，讓用戶可以繼續選擇更多標籤
      // 只有在達到最大標籤數時才隱藏建議
      if (tags.length + 1 >= maxTags) {
        console.log('[TagInput] Reached max tags, hiding suggestions');
        setShowSuggestions(false);
      }
    } else {
      console.log(`[TagInput] At max tags, cannot add ${tag}`);
    }
  };


  return (
    <View style={styles.container}>
      {/* Tags Display */}
      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsContainer}
          contentContainerStyle={styles.tagsContent}
        >
          {tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: getTagColor(index) }]}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity
                onPress={() => removeTag(tag)}
                style={styles.removeButton}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, isAtMaxTags && styles.inputDisabled]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={isAtMaxTags ? `Maximum ${maxTags} tags reached` : placeholder}
          placeholderTextColor={theme.colors.gray}
          onSubmitEditing={handleInputSubmit}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          returnKeyType="done"
          blurOnSubmit={false}
          editable={!isAtMaxTags}
        />
        <TouchableOpacity
          onPress={() => addTag()}
          style={[
            styles.addButton,
            { opacity: (inputValue.trim() && !isAtMaxTags) ? 1 : 0.5 },
          ]}
          disabled={!inputValue.trim() || isAtMaxTags}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>


      {/* Suggestions */}
      {showSuggestions && (suggestions.length > 0 || popularTags.length > 0) && (
        <View style={styles.suggestionsContainer}>
          {/* Search Suggestions */}
          {suggestions.length > 0 && !isAtMaxTags && (
            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionSectionTitle}>Suggestions</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
              >
                <View style={styles.suggestionsRow}>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionTag}
                      onPress={() => {
                        console.log(`Suggestion tag pressed: ${suggestion}`);
                        addTag(suggestion);
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                    >
                      <Text style={styles.suggestionTagText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Popular Tags */}
          {!inputValue.trim() && popularTags.length > 0 && (
            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionSectionTitle}>Popular Tags</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
              >
                <View style={styles.suggestionsRow}>
                  {popularTags.map((tag, index) => {
                    const isDisabled = tags.length >= maxTags;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.suggestionTag,
                          isDisabled && styles.popularTagDisabled,
                        ]}
                        onPress={() => {
                          console.log(`Popular tag pressed: ${tag}, disabled: ${isDisabled}`);
                          if (!isDisabled) {
                            togglePopularTag(tag);
                          }
                        }}
                        onPressIn={() => {
                          console.log(`Popular tag pressIn: ${tag}, disabled: ${isDisabled}`);
                        }}
                        disabled={isDisabled}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                        delayPressIn={0}
                        delayPressOut={0}
                      >
                        <Text style={[
                          styles.suggestionTagText,
                          isDisabled && styles.popularTagTextDisabled,
                        ]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
    padding: theme.spacing.sm,
  },
  tagsContainer: {
    marginBottom: theme.spacing.xs,
    maxHeight: 40,
  },
  tagsContent: {
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: theme.font.size.small,
    fontWeight: '500',
    marginRight: theme.spacing.xs,
  },
  removeButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 0,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.input,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border || theme.colors.gray,
  },
  suggestionSection: {
    marginBottom: theme.spacing.sm,
  },
  suggestionSectionTitle: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  suggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  suggestionTag: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    minHeight: 32, // 確保最小觸控目標高度
    minWidth: 44, // 確保最小觸控目標寬度
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTagText: {
    color: theme.colors.primary,
    fontSize: theme.font.size.small,
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: theme.colors.gray + '20',
    color: theme.colors.gray,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  counterText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    fontWeight: '500',
  },
  remainingText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
  },
  popularTagDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.gray + '10',
  },
  popularTagTextDisabled: {
    color: theme.colors.gray,
  },
});
