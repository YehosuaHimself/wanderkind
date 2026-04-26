import React from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

export interface StoryRingProps {
  imageUri?: string | null;
  name: string;
  size?: number;
  hasUnseenStories?: boolean;
  onPress?: () => void;
  isAdd?: boolean;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  imageUri,
  name,
  size = 64,
  hasUnseenStories = false,
  onPress,
  isAdd = false,
}) => {
  const ringWidth = 3;
  const iconSize = size * 0.4;
  const badgeSize = size * 0.28;
  const badgeIconSize = badgeSize * 0.6;

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    ringWrapper: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: hasUnseenStories ? ringWidth : 0,
      borderColor: hasUnseenStories ? colors.amber : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatar: {
      width: size - (hasUnseenStories ? ringWidth * 2 : 0),
      height: size - (hasUnseenStories ? ringWidth * 2 : 0),
      borderRadius: (size - (hasUnseenStories ? ringWidth * 2 : 0)) / 2,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: (size - (hasUnseenStories ? ringWidth * 2 : 0)) / 2,
    },
    badgeContainer: {
      position: 'absolute',
      bottom: hasUnseenStories ? -ringWidth : 0,
      right: hasUnseenStories ? -ringWidth : 0,
      width: badgeSize,
      height: badgeSize,
      borderRadius: badgeSize / 2,
      backgroundColor: colors.amber,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nameText: {
      fontSize: 11,
      color: colors.ink,
      marginTop: 4,
      maxWidth: size + 20,
      textAlign: 'center',
    },
  });

  // Show first name only (personal, not @handle)
  const displayName = name === 'Your story' ? name : name.split(' ')[0];
  const truncatedName = displayName.length > 10 ? `${displayName.substring(0, 10)}` : displayName;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.ringWrapper}>
        <View style={styles.avatar}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={iconSize} color={colors.ink3} />
          )}
        </View>
        {isAdd && (
          <View style={styles.badgeContainer}>
            <Ionicons name="add" size={badgeIconSize} color="white" />
          </View>
        )}
      </View>
      <Text style={styles.nameText} numberOfLines={1}>
        {truncatedName}
      </Text>
    </TouchableOpacity>
  );
};
