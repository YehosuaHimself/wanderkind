import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  PanResponder,
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
const SWIPE_THRESHOLD = 50;

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
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentStory = stories[currentIndex];

  // Use refs for handlers so PanResponder always calls the latest version
  const handleNextRef = useRef<() => void>(() => {});
  const handlePreviousRef = useRef<() => void>(() => {});
  const onCloseRef = useRef(onClose);
  const onNextGroupRef = useRef(onNextGroup);
  const onPreviousGroupRef = useRef(onPreviousGroup);

  // Reset index when stories change (new group)
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [stories, initialIndex]);

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

  // Handle next story — advance within group, then to next group
  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (onNextGroup) {
      onNextGroup();
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose, onNextGroup]);

  // Handle previous story — go back within group, then to previous group
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (onPreviousGroup) {
      onPreviousGroup();
    }
  }, [currentIndex, onPreviousGroup]);

  // Keep refs updated so PanResponder always has fresh handlers
  handleNextRef.current = handleNext;
  handlePreviousRef.current = handlePrevious;
  onCloseRef.current = onClose;
  onNextGroupRef.current = onNextGroup;
  onPreviousGroupRef.current = onPreviousGroup;

  // Progress bar animation — include handleNext in deps
  useEffect(() => {
    if (!visible || !currentStory) return;

    progressAnim.setValue(0);

    const animation = Animated.timing(progressAnim, {
      toValue: 100,
      duration: STORY_DURATION_MS,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleNextRef.current();
      }
    });

    return () => {
      animation.stop();
    };
  }, [currentIndex, visible, stories.length, progressAnim]);

  // PanResponder — uses refs so it never captures stale closures
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Vertical swipe down = close
        if (dy > 100 && absDy > absDx) {
          onCloseRef.current();
          return;
        }

        // Horizontal swipe — advance stories (not just groups)
        if (absDx > SWIPE_THRESHOLD && absDx > absDy) {
          if (dx < 0) {
            handleNextRef.current();
          } else {
            handlePreviousRef.current();
          }
          return;
        }

        // Tap — use location to determine left/right zone
        const { locationX } = evt.nativeEvent;
        const tapZone = locationX / SCREEN_WIDTH;

        if (tapZone < 0.35) {
          handlePreviousRef.current();
        } else {
          handleNextRef.current();
        }
      },
    }),
  []);

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
            <View style={[styles.progressSegment, { backgroundColor: '#FFFFFF' }]} />
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
            <View style={[styles.progressSegment, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
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

        {/* Story image + gesture area */}
        <View style={styles.imageContainer} {...panResponder.panHandlers}>
          <Image
            source={{ uri: currentStory.photo_url }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        </View>

        {/* Top header: avatar + author + time — tappable for profile */}
        <TouchableOpacity
          style={styles.header}
          onPress={handleProfilePress}
          activeOpacity={0.8}
          disabled={!authorId}
        >
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
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
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Bottom caption and location */}
        {(currentStory.caption || currentStory.location_name) && (
          <View style={styles.captionContainer} pointerEvents="none">
            {currentStory.caption && (
              <Text style={styles.caption}>{currentStory.caption}</Text>
            )}
            {currentStory.location_name && (
              <Text style={styles.location}>{currentStory.location_name}</Text>
            )}
          </View>
        )}

        {/* Navigation hint arrows */}
        <View style={styles.navHints} pointerEvents="none">
          {(currentIndex > 0 || onPreviousGroup) && (
            <View style={styles.navHintLeft}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          {(currentIndex < stories.length - 1 || onNextGroup) && (
            <View style={styles.navHintRight}>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
            </View>
          )}
        </View>
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
  navHints: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 4,
  },
  navHintLeft: {
    padding: 8,
    opacity: 0.5,
  },
  navHintRight: {
    padding: 8,
    opacity: 0.5,
  },
};
