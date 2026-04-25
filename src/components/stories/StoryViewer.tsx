import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { colors } from '../../lib/theme';
import type { StoryRow } from '../../types/database';

type StoryViewerProps = {
  stories: StoryRow[];
  authorName: string;
  authorAvatar?: string | null;
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
};

const STORY_DURATION_MS = 11 * 60 * 1000 + 11 * 1000; // 11 minutes 11 seconds
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export const StoryViewer = ({
  stories,
  authorName,
  authorAvatar,
  initialIndex = 0,
  visible,
  onClose,
}: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];

  // Format time ago
  const getTimeAgo = useCallback((createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    return `${diffMinutes}m ago`;
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (!visible || paused || !currentStory) {
      return;
    }

    progressAnim.setValue(0);

    const animation = Animated.timing(progressAnim, {
      toValue: 100,
      duration: STORY_DURATION_MS,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished && currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (finished && currentIndex === stories.length - 1) {
        onClose();
      }
    });

    return () => {
      animation.stop();
    };
  }, [currentIndex, visible, paused, stories.length, progressAnim, onClose]);

  // Handle next story
  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  // Handle previous story
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Handle screen tap
  const handleScreenTap = useCallback(
    (event: any) => {
      const { locationX } = event.nativeEvent;
      const tapZone = locationX / SCREEN_WIDTH;

      if (tapZone < 0.3) {
        // Left 30%
        handlePrevious();
      } else {
        // Right 70%
        handleNext();
      }
    },
    [handleNext, handlePrevious]
  );

  if (!visible || stories.length === 0 || !currentStory) {
    return null;
  }

  // Render progress bar segments
  const ProgressBar = () => (
    <View style={styles.progressContainer}>
      {stories.map((_, index) => (
        <View key={index} style={styles.progressSegmentWrapper}>
          {index < currentIndex ? (
            // Completed segment
            <View
              style={[
                styles.progressSegment,
                { backgroundColor: '#FFFFFF' },
              ]}
            />
          ) : index === currentIndex ? (
            // Current segment with animation
            <Animated.View
              style={[
                styles.progressSegment,
                {
                  backgroundColor: '#FFFFFF',
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          ) : (
            // Upcoming segment
            <View
              style={[
                styles.progressSegment,
                { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaViewContext style={styles.container}>
        {/* Progress bar */}
        <ProgressBar />

        {/* Story image */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenTap}
          style={styles.imageContainer}
        >
          <Image
            source={{ uri: currentStory.photo_url }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Top header: avatar + author + time */}
        <View style={styles.header}>
          {authorAvatar ? (
            <Image
              source={{ uri: authorAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timeAgo}>
              {getTimeAgo(currentStory.created_at)}
            </Text>
          </View>
        </View>

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Bottom caption and location */}
        {(currentStory.caption || currentStory.location_name) && (
          <View style={styles.captionContainer}>
            {currentStory.caption && (
              <Text style={styles.caption}>{currentStory.caption}</Text>
            )}
            {currentStory.location_name && (
              <Text style={styles.location}>{currentStory.location_name}</Text>
            )}
          </View>
        )}

        {/* Tap zones for debugging/testing (invisible) */}
        <View style={styles.leftTapZone} />
        <View style={styles.rightTapZone} />
      </SafeAreaViewContext>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#000000',
  } as const,
  progressContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: 'row' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
    zIndex: 10,
  },
  progressSegmentWrapper: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
    overflow: 'hidden' as const,
  },
  progressSegment: {
    height: '100%',
    borderRadius: 1,
  },
  imageContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  header: {
    position: 'absolute' as const,
    top: 50,
    left: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    zIndex: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  authorInfo: {
    justifyContent: 'center' as const,
  },
  authorName: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 20,
  },
  closeButtonText: {
    color: colors.surface,
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '300' as const,
  },
  captionContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  caption: {
    color: colors.surface,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  location: {
    color: colors.amber,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  leftTapZone: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.3,
    height: SCREEN_HEIGHT,
  },
  rightTapZone: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT,
  },
};
