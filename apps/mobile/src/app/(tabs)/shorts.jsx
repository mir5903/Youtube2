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

// Check if URL is a YouTube URL (including Shorts)
const isYouTubeVideo = (url) => {
  if (!url) return false;
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("youtube.com/shorts")
  );
};

// Convert any YouTube URL to embed format
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;

  // Extract video ID from various YouTube URL formats
  let videoId = null;
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#\/]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#\/]+)/,
    /(?:https?:\/\/)?(?:www\.)?m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      videoId = match[1];
      break;
    }
  }

  if (videoId) {
    // Return embed URL with autoplay enabled and sound unmuted for immediate playback
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&loop=1&playlist=${videoId}`;
  }

  // If it's already an embed URL, just add parameters
  if (url.includes("youtube.com/embed/")) {
    const baseUrl = url.split("?")[0];
    const videoIdMatch = baseUrl.match(/embed\/([^\/]+)/);
    const vid = videoIdMatch ? videoIdMatch[1] : "";
    return `${baseUrl}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&loop=1&playlist=${vid}`;
  }

  return url;
};

// Video Item Component
function VideoItem({ item, isActive, onSave, savedVideos, insets, onShare }) {
  const isYouTube = isYouTubeVideo(item.video_url);
  const isSaved = savedVideos.has(item.id);
  const webViewRef = useRef(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  // Get the proper embed URL
  const embedUrl = isYouTube
    ? getYouTubeEmbedUrl(item.video_url)
    : item.video_url;

  // Always create video player (hooks must be called unconditionally)
  const player = useVideoPlayer(
    !isYouTube && item.video_url
      ? item.video_url
      : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    (player) => {
      if (!isYouTube) {
        player.loop = true;
        // Start unmuted and ready to play - will be controlled by isActive
        player.muted = false;
        if (isActive) {
          player.play();
        } else {
          player.pause();
        }
      }
    },
  );

  useEffect(() => {
    if (!isYouTube && player) {
      if (isActive) {
        // Ensure unmuted and play immediately when active
        player.muted = false;
        player.play();
      } else {
        // Pause and reset when not active, but don't mute (for faster restart)
        player.pause();
        player.currentTime = 0;
      }
    }
  }, [isActive, player, isYouTube]);

  // Handle YouTube video control via WebView
  useEffect(() => {
    if (isYouTube && webViewRef.current && webViewLoaded) {
      if (isActive) {
        // Play with sound immediately when active
        const playScript = `
          try {
            var iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              // Unmute first, then play
              iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
              iframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
              iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            }
          } catch(e) {
            console.log('Error playing YouTube video:', e);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(playScript);
      } else {
        // Stop and mute when not active
        const stopScript = `
          try {
            var iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              // Stop video and mute
              iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
              iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
            }
          } catch(e) {
            console.log('Error stopping YouTube video:', e);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(stopScript);
      }
    }
  }, [isActive, isYouTube, webViewLoaded]);

  // Initial playback setup when WebView loads
  useEffect(() => {
    if (isYouTube && webViewRef.current && webViewLoaded && isActive) {
      // Small delay to ensure iframe is ready, then play with sound
      const timer = setTimeout(() => {
        const initialPlayScript = `
          try {
            var iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
              iframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
              iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            }
          } catch(e) {
            console.log('Error initial play YouTube video:', e);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(initialPlayScript);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [webViewLoaded, isActive, isYouTube]);

  const handleOpenYouTube = useCallback(() => {
    if (item.youtube_url || item.video_url) {
      Linking.openURL(item.youtube_url || item.video_url);
    }
  }, [item.youtube_url, item.video_url]);

  const handleWebViewLoad = useCallback(() => {
    setWebViewLoaded(true);
  }, []);

  // Debug logging
  useEffect(() => {
    if (isActive) {
      console.log("Active video:", {
        id: item.id,
        title: item.title,
        isYouTube,
        video_url: item.video_url,
        embedUrl,
      });
    }
  }, [isActive, item, isYouTube, embedUrl]);

  return (
    <View style={[styles.videoContainer, { height: screenHeight }]}>
      {isYouTube && embedUrl ? (
        // YouTube WebView with enhanced controls
        <WebView
          ref={webViewRef}
          source={{ uri: embedUrl }}
          style={styles.video}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          originWhitelist={["*"]}
          allowsProtectedMedia={true}
          onLoad={handleWebViewLoad}
          onError={(error) => {
            console.error("WebView error:", error);
          }}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
        />
      ) : !isYouTube && item.video_url ? (
        // Regular video player
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          allowsFullscreen={false}
          contentFit="cover"
        />
      ) : (
        // Fallback for missing video
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Video unavailable</Text>
          <Text style={styles.errorSubtext}>{item.title}</Text>
        </View>
      )}

      {/* Video overlay */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Video info at bottom left */}
        <View
          style={[styles.bottomInfo, { paddingBottom: insets.bottom + 90 }]}
        >
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title || "Untitled"}
          </Text>
          <Text style={styles.channelName}>
            {item.channel_name || "Unknown Channel"}
          </Text>
        </View>

        {/* Right side - Actions */}
        <View style={[styles.rightSide, { paddingBottom: insets.bottom + 90 }]}>
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

          {/* YouTube link if available */}
          {isYouTube && (item.youtube_url || item.video_url) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenYouTube}
            >
              <ExternalLink size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>YouTube</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ShortsTab() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedVideos, setSavedVideos] = useState(new Set());
  const flatListRef = useRef(null);

  // Default to User 1 for save functionality
  const currentUserId = user?.id || 1;

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_600SemiBold,
  });

  // Fetch videos from API
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching shorts for user:", currentUserId);

      // Fetch shorts ordered by creation date (latest first)
      const response = await fetch(
        `/api/videos?type=short&limit=20&userId=${currentUserId}`,
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched shorts data:", data);
      console.log("Number of shorts:", data.videos ? data.videos.length : 0);

      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos); // Show in chronological order, latest first
        console.log("Videos set successfully:", data.videos.length);
      } else {
        console.log("No videos found in response");
        setVideos([]);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      Alert.alert("Error", `Failed to load videos: ${error.message}`);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Fetch saved videos (watch later for shorts)
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

  // Add to watch history when video is viewed
  const addToWatchHistory = useCallback(
    async (videoId) => {
      try {
        await fetch(`/api/users/${currentUserId}/watch-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
        });
      } catch (error) {
        console.error("Error adding to watch history:", error);
      }
    },
    [currentUserId],
  );

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
          addToWatchHistory(currentVideo.id);
        }
      }
    },
    [videos, addToWatchHistory],
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  // Handle save video (to watch later)
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
        message: `Check out this video: ${video.title}`,
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
        getItemLayout={(data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
      />
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
  bottomInfo: {
    position: "absolute",
    left: 20,
    bottom: 0,
    maxWidth: "70%",
  },
  videoTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Roboto_600SemiBold",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  channelName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Roboto_600SemiBold",
    marginBottom: 8,
  },
  errorSubtext: {
    color: "#CCCCCC",
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
});
