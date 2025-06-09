import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { theme } from '../theme';

interface ColorTag {
  id: string;
  name: string;
  color: string;
}

interface ColorTagPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  title?: string;
}

const defaultColorTags: ColorTag[] = [
  { id: '', name: 'None', color: 'transparent' },
  { id: 'red', name: 'Red', color: '#FF6B6B' },
  { id: 'blue', name: 'Blue', color: '#4ECDC4' },
  { id: 'green', name: 'Green', color: '#45B7D1' },
  { id: 'yellow', name: 'Yellow', color: '#FFA726' },
  { id: 'purple', name: 'Purple', color: '#AB47BC' },
  { id: 'orange', name: 'Orange', color: '#FF7043' },
  { id: 'pink', name: 'Pink', color: '#EC407A' },
  { id: 'teal', name: 'Teal', color: '#26A69A' },
];

export const ColorTagPicker: React.FC<ColorTagPickerProps> = ({
  value,
  onValueChange,
  title,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedTag = defaultColorTags.find(tag => tag.id === value) || defaultColorTags[0];

  const handleSelectTag = (tagId: string) => {
    onValueChange(tagId);
    setIsVisible(false);
  };

  const renderColorTag = ({ item }: { item: ColorTag }) => (
    <TouchableOpacity
      style={[
        styles.colorOption,
        value === item.id && styles.selectedColorOption
      ]}
      onPress={() => handleSelectTag(item.id)}
    >
      <View style={[
        styles.colorCircle,
        { backgroundColor: item.color },
        item.id === '' && styles.noneCircle
      ]} />
      <Text style={[
        styles.colorName,
        value === item.id && styles.selectedColorName
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const TagDisplayComponent = () => (
    <TouchableOpacity 
      style={[styles.tagDisplay, !title && styles.fullWidthDisplay]} 
      onPress={() => setIsVisible(true)}
    >
      <View style={[
        styles.displayCircle,
        { backgroundColor: selectedTag.color },
        selectedTag.id === '' && styles.noneDisplayCircle
      ]} />
      <Text style={styles.displayText}>
        {selectedTag.name}
      </Text>
      <Text style={styles.arrow}>▼</Text>
    </TouchableOpacity>
  );

  if (title) {
    return (
      <View>
        <View style={styles.horizontalContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <View style={styles.pickerContainer}>
            <TagDisplayComponent />
          </View>
        </View>

        <Modal
          visible={isVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsVisible(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setIsVisible(false)}
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Select {title || 'Tag'} Color</Text>
              
              <FlatList
                data={defaultColorTags}
                renderItem={renderColorTag}
                keyExtractor={(item) => item.id}
                style={styles.colorList}
                showsVerticalScrollIndicator={false}
                numColumns={3}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <TagDisplayComponent />

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select {title || 'Tag'} Color</Text>
            
            <FlatList
              data={defaultColorTags}
              renderItem={renderColorTag}
              keyExtractor={(item) => item.id}
              style={styles.colorList}
              showsVerticalScrollIndicator={false}
              numColumns={3}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 0.3,
  },
  pickerContainer: {
    flex: 0.65,
  },
  tagDisplay: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    minHeight: 40,
  },
  fullWidthDisplay: {
    flex: 1,
  },
  displayCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.spacing.xs,
  },
  noneDisplayCircle: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderStyle: 'dashed',
  },
  displayText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    flex: 1,
  },
  arrow: {
    fontSize: 12,
    color: theme.colors.gray,
    marginLeft: theme.spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    minWidth: '80%',
  },
  modalTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.text,
  },
  colorList: {
    maxHeight: 300,
  },
  colorOption: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.sm,
    margin: theme.spacing.xs,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBg,
  },
  selectedColorOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: theme.spacing.xs,
  },
  noneCircle: {
    borderWidth: 2,
    borderColor: theme.colors.gray,
    borderStyle: 'dashed',
  },
  colorName: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    textAlign: 'center',
  },
  selectedColorName: {
    color: 'white',
    fontWeight: '600',
  },
}); 