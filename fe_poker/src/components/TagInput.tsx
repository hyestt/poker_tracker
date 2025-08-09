import React, { useState, useMemo } from 'react';
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
  const [selectedPopularTags, setSelectedPopularTags] = useState<string[]>([]);

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
    if (tagToAdd) {
      // 直接添加指定的tag (用于建议tags)
      const trimmedValue = tagToAdd.trim();
      if (trimmedValue && !tags.includes(trimmedValue) && !isAtMaxTags) {
        onTagsChange([...tags, trimmedValue]);
        setInputValue('');
        setShowSuggestions(false);
      }
    } else {
      // 添加输入框中的tag和所有选中的popular tags
      const tagsToAdd = [];

      // 添加输入框中的tag
      const trimmedInput = inputValue.trim();
      if (trimmedInput && !tags.includes(trimmedInput)) {
        tagsToAdd.push(trimmedInput);
      }

      // 添加选中的popular tags
      selectedPopularTags.forEach(tag => {
        if (!tags.includes(tag) && !tagsToAdd.includes(tag)) {
          tagsToAdd.push(tag);
        }
      });

      // 检查是否超过最大标签数量
      const newTags = [...tags, ...tagsToAdd].slice(0, maxTags);
      if (newTags.length > tags.length) {
        onTagsChange(newTags);
        setInputValue('');
        setSelectedPopularTags([]);
        setShowSuggestions(false);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInputSubmit = () => {
    addTag();
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // 延遲隱藏建議，讓用戶有時間點擊建議
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const togglePopularTag = (tag: string) => {
    if (tags.includes(tag)) {
      // 如果tag已经在最终tags中，不做任何操作
      return;
    }

    if (selectedPopularTags.includes(tag)) {
      // 如果已选中，则取消选中
      setSelectedPopularTags(prev => prev.filter(t => t !== tag));
    } else {
      // 如果未选中，则添加到选中列表
      setSelectedPopularTags(prev => [...prev, tag]);
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
            { opacity: ((inputValue.trim() || selectedPopularTags.length > 0) && !isAtMaxTags) ? 1 : 0.5 },
          ]}
          disabled={(!inputValue.trim() && selectedPopularTags.length === 0) || isAtMaxTags}
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.suggestionsRow}>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionTag}
                      onPress={() => addTag(suggestion)}
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.suggestionsRow}>
                  {popularTags.map((tag, index) => {
                    const isDisabled = tags.length >= maxTags;
                    const isSelected = selectedPopularTags.includes(tag);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.suggestionTag,
                          isSelected && styles.selectedPopularTag,
                          isDisabled && styles.popularTagDisabled,
                        ]}
                        onPress={() => !isDisabled && togglePopularTag(tag)}
                        disabled={isDisabled}
                      >
                        <Text style={[
                          styles.suggestionTagText,
                          isSelected && styles.selectedPopularTagText,
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
  selectedPopularTag: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectedPopularTagText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
