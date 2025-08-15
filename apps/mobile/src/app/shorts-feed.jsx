import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Share,
  Alert,
  FlatList,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { WebView } from "react-native-webview";
import {
  Share2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from "lucide-react-native";
import { useUser } from "@/utils/auth/useUser";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_600SemiBold,
} from "@expo-google-fonts/roboto";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Check if URL is a YouTube embed URL
const isYouTubeEmbed = (url) => {
  return url && url.includes("youtube.com/embed/");
};

// Convert YouTube embed URL to a format that works better in mobile
const getYouTubeEmbedUrl = (url) => {
  if (isYouTubeEmbed(url)) {
    return `${url}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1`;
  }
  return url;
};

// Video Item Component
function VideoItem({ item, isActive, onSave, savedVideos, insets, onShare }) {
  const isYouTube = isYouTubeEmbed(item.video_url);
  const isSaved = savedVideos.has(item.id);

  // Always create video player (hooks must be called unconditionally)
  const player = useVideoPlayer(
    !isYouTube
      ? item.video_url ||
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    (player) => {
      if (!isYouTube) {
        player.muted = false;
        player.loop = true;
        if (isActive) {
          player.play();
        }
      }
    },
  );

  useEffect(() => {
    if (!isYouTube && player) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, player, isYouTube]);

  const handleOpenYouTube = useCallback(() => {
    if (item.youtube_url) {
      Linking.openURL(item.youtube_url);
    }
  }, [item.youtube_url]);

  return (
    <View style={styles.videoContainer}>
      {isYouTube ? (
        // YouTube WebView
        <WebView
          source={{ uri: getYouTubeEmbedUrl(item.video_url) }}
          style={styles.video}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
        />
      ) : (
        // Regular video player
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          allowsFullscreen={false}
          contentFit="cover"
        />
      )}

      {/* Video overlay */}
      <View style={styles.overlay}>
        {/* Right side - Actions (only Share and Save) */}
        <View style={[styles.rightSide, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(item)}
          >
            <Share2 size={32} color="#FFFFFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSave(item.id)}
          >
            {isSaved ? (
              <BookmarkCheck size={32} color="#FFD700" fill="#FFD700" />
            ) : (
              <Bookmark size={32} color="#FFFFFF" />
            )}
            <Text style={styles.actionText}>{isSaved ? "Saved" : "Save"}</Text>
          </TouchableOpacity>
        </View>

        {/* YouTube link if available */}
        {isYouTube && item.youtube_url && (
          <View
            style={[styles.bottomLeft, { paddingBottom: insets.bottom + 20 }]}
          >
            <TouchableOpacity
              style={styles.youtubeButton}
              onPress={handleOpenYouTube}
            >
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={styles.youtubeButtonText}>Open in YouTube</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function VideoFeedScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedVideos, setSavedVideos] = useState(new Set());
  const flatListRef = useRef(null);

  // Single user app - always use user ID 1
  const currentUserId = 1;

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_600SemiBold,
  });

  // Get start video ID from route params if available
  const [startVideoId, setStartVideoId] = useState(null);

  // Fetch videos from API
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/videos?type=short&limit=50");
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      const data = await response.json();
      const fetchedVideos = data.videos || [];

      // Shuffle videos but if startVideoId is provided, put that video first
      let orderedVideos = [...fetchedVideos];
      if (startVideoId) {
        const startVideoIndex = orderedVideos.findIndex(
          (v) => v.id === startVideoId,
        );
        if (startVideoIndex > -1) {
          const startVideo = orderedVideos.splice(startVideoIndex, 1)[0];
          orderedVideos = [startVideo, ...orderedVideos];
          setCurrentIndex(0);
        }
      }

      setVideos(orderedVideos);

      // Scroll to start video if provided and list is ready
      if (startVideoId && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToIndex({ index: 0, animated: false });
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      Alert.alert("Error", "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [startVideoId]);

  // Fetch saved videos
  const fetchSavedVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/watch-later`);
      if (response.ok) {
        const data = await response.json();
        const savedIds = new Set(data.watchLaterVideos.map((v) => v.video_id));
        setSavedVideos(savedIds);
      }
    } catch (error) {
      console.error("Error fetching saved videos:", error);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    fetchSavedVideos();
  }, [fetchSavedVideos]);

  // Handle scroll and video change
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);

        // Add current video to watch history
        const currentVideo = videos[newIndex];
        if (currentVideo) {
          fetch(`/api/users/${currentUserId}/watch-history`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoId: currentVideo.id }),
          }).catch((error) =>
            console.error("Error adding to watch history:", error),
          );
        }
      }
    },
    [videos, currentUserId],
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  // Handle save video to watch later
  const handleSave = useCallback(
    async (videoId) => {
      try {
        const isSaved = savedVideos.has(videoId);
        const method = isSaved ? "DELETE" : "POST";

        const response = await fetch(
          `/api/users/${currentUserId}/watch-later`,
          {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoId }),
          },
        );

        if (response.ok) {
          setSavedVideos((prev) => {
            const newSet = new Set(prev);
            if (isSaved) {
              newSet.delete(videoId);
            } else {
              newSet.add(videoId);
            }
            return newSet;
          });
        }
      } catch (error) {
        console.error("Error saving video:", error);
        Alert.alert("Error", "Failed to save video");
      }
    },
    [currentUserId, savedVideos],
  );

  // Handle share video
  const handleShare = useCallback(async (video) => {
    try {
      const shareUrl = video.youtube_url || video.video_url;
      await Share.share({
        message: `Check out this short: ${video.title}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error("Error sharing video:", error);
    }
  }, []);

  const renderVideoItem = ({ item, index }) => {
    return (
      <VideoItem
        item={item}
        isActive={index === currentIndex}
        onSave={handleSave}
        onShare={handleShare}
        savedVideos={savedVideos}
        insets={insets}
      />
    );
  };

  // Handle scroll to index errors
  const onScrollToIndexFailed = (info) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: false,
      });
    });
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>No shorts available</Text>
        <Text style={styles.subText}>Add some shorts in the admin panel</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={onScrollToIndexFailed}
        getItemLayout={(data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
      />

      {/* Video progress indicator */}
      <View style={styles.progressContainer}>
        {videos.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Roboto_400Regular",
  },
  subText: {
    color: "#CCCCCC",
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    marginTop: 8,
  },
  videoContainer: {
    flex: 1,
    position: "relative",
  },
  video: {
    width: screenWidth,
    height: screenHeight,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  rightSide: {
    position: "absolute",
    right: 20,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 20,
    padding: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Roboto_400Regular",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    alignItems: "center",
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginVertical: 3,
  },
  progressDotActive: {
    backgroundColor: "#FFFFFF",
    height: 20,
  },
  bottomLeft: {
    position: "absolute",
    left: 20,
    bottom: 0,
  },
  youtubeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  youtubeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Roboto_400Regular",
    marginLeft: 4,
  },
});
