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
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import type { StoryRow } from '../../types/database';

type StoryViewerProps = {
  stories: StoryRow[];
  authorName: string;
  authorAvatar?: string | null;
  authorId?: string;
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
  onPreviousGroup?: () => void;
  onNextGroup?: () => void;
};

const STORY_DURATION_MS = 11 * 60 * 1000 + 11 * 1000; // 11 minutes 11 seconds
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export const StoryViewer = ({
  stories,
  authorName,
  authorAvatar,
  authorId,
  initialIndex = 0,
  visible,
  onClose,
  onPreviousGroup,
  onNextGroup,
}: StoryViewerProps) => {
  const router = useRouter();
  const handleProfilePress = useCallback(() => {
    if (authorId) {
      onClose();
      setTimeout(() => {
        router.push(`/(tabs)/me/profile/${authorId}` as any);
      }, 300);
    }
  }, [authorId, onClose, router]);

  // Display full name (personal, not @handle)
  const displayName = authorName.replace(/^@/, '');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const swipeStartX = useRef(0);

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

  // Handle next story - auto-advance to next group when at end
  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (currentIndex === stories.length - 1) {
      // At end of current group - jump to next group
      if (onNextGroup) {
        onNextGroup();
      } else {
        onClose();
      }
    }
  }, [currentIndex, stories.length, onClose, onNextGroup]);

  // Handle previous story - jump to previous group when at start
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentIndex === 0 && onPreviousGroup) {
      // At start of current group - jump to previous group
      onPreviousGroup();
    }
  }, [currentIndex, onPreviousGroup]);

  // Handle screen tap - left/right zones for story navigation
  const handleScreenTap = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX } = event.nativeEvent;
      const tapZone = locationX / SCREEN_WIDTH;

      if (tapZone < 0.3) {
        // Left 30% - previous story
        handlePrevious();
      } else if (tapZone > 0.7) {
        // Right 30% - next story
        handleNext();
      }
      // Middle 40% - do nothing (allows pausing if needed)
    },
    [handleNext, handlePrevious]
  );

  // Handle swipe gestures - left/right swipes navigate between groups
  const handleSwipeStart = useCallback((event: GestureResponderEvent) => {
    swipeStartX.current = event.nativeEvent.pageX;
  }, []);

  const handleSwipeEnd = useCallback(
    (event: GestureResponderEvent) => {
      const swipeEndX = event.nativeEvent.pageX;
      const swipeDistance = swipeStartX.current - swipeEndX;
      const minSwipeDistance = 50; // Minimum distance to register as swipe

      if (Math.abs(swipeDistance) < minSwipeDistance) {
        return; // Not a significant swipe
      }

      if (swipeDistance > 0) {
        // Swiped left - go to next group
        if (onNextGroup) {
          onNextGroup();
        }
      } else {
        // Swiped right - go to previous group
        if (onPreviousGroup) {
          onPreviousGroup();
        }
      }
    },
    [onNextGroup, onPreviousGroup]
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

        {/* Story image - tap for navigation, swipe for group navigation */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleScreenTap}
          onPressIn={handleSwipeStart}
          onPressOut={handleSwipeEnd}
          style={styles.imageContainer}
        >
          <Image
            source={{ uri: currentStory.photo_url }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Top header: avatar + author + time — tappable for profile */}
        <TouchableOpacity
          style={styles.header}
          onPress={handleProfilePress}
          activeOpacity={0.8}
          disabled={!authorId}
        >
          {authorAvatar ? (
            <Image
              source={{ uri: authorAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{displayName}</Text>
            <Text style={styles.timeAgo}>
              {getTimeAgo(currentStory.created_at)}
            </Text>
          </View>
          {authorId && (
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
          )}
        </TouchableOpacity>

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
    flex: 1,
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
