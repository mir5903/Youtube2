import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Play,
  ArrowLeft,
} from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/utils/auth/useUser";
import { WebView } from "react-native-webview";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";

const { width: screenWidth } = Dimensions.get("window");

const YouTubeLogo = ({ size = 24 }) => (
  <View style={styles.logoContainer}>
    <View style={[styles.playButton, { width: size, height: size }]}>
      <View style={styles.playIcon} />
    </View>
    <Text style={styles.logoText}>YouTube</Text>
  </View>
);

function VideoCard({ video, onSave, isSaved, onPress }) {
  return (
    <TouchableOpacity style={styles.videoCard} onPress={() => onPress(video)}>
      {/* Large thumbnail on top */}
      <Image
        source={{
          uri:
            video.thumbnail_url ||
            "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        }}
        style={styles.largeThumbnail}
      />

      {/* Video info below thumbnail */}
      <View style={styles.videoInfoContainer}>
        <View style={styles.videoTextInfo}>
          {/* Video title */}
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>

          {/* Channel name */}
          <View style={styles.channelRow}>
            <Text style={styles.channelName}>
              {video.channel_name || "Unknown Channel"}
            </Text>

            {/* Save button on the right */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onSave(video.id, video.video_type)}
            >
              {isSaved ? (
                <BookmarkCheck size={20} color="#FF0000" />
              ) : (
                <Bookmark size={20} color="#606060" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ShortsCard({ video, onPress }) {
  return (
    <TouchableOpacity style={styles.shortsCard} onPress={onPress}>
      <Image
        source={{
          uri:
            video.thumbnail_url ||
            "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        }}
        style={styles.shortsThumbnail}
      />
      <Text style={styles.shortsTitle} numberOfLines={2}>
        {video.title}
      </Text>
    </TouchableOpacity>
  );
}

function ShortsSection({ shorts }) {
  const handleShortsPress = (shortVideo) => {
    router.push("/shorts");
  };

  return (
    <View style={styles.shortsSection}>
      <View style={styles.shortsSectionHeader}>
        <View style={styles.shortsHeaderLeft}>
          <View style={styles.shortsIconContainer}>
            <Play size={16} color="#FF0000" />
          </View>
          <Text style={styles.shortsSectionTitle}>Shorts</Text>
        </View>
      </View>

      <View style={styles.shortsContainer}>
        {shorts.slice(0, 2).map((short, index) => (
          <ShortsCard
            key={short.id}
            video={short}
            onPress={() => handleShortsPress(short)}
          />
        ))}
      </View>
    </View>
  );
}

function VideoPlayer({ video, onBack, recommendedVideos, onVideoSelect }) {
  const getYouTubeEmbedUrl = (url) => {
    let videoId = null;
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#\/]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#\/]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }

    if (videoId) {
      // Enable all YouTube settings and features
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&fs=1&cc_load_policy=1&iv_load_policy=3&showinfo=1&controls=1&playsinline=0&enablejsapi=1`;
    }
    return url;
  };

  return (
    <ScrollView
      style={styles.playerContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Larger Video Player */}
      <View style={styles.playerWrapper}>
        <WebView
          source={{
            uri: getYouTubeEmbedUrl(video.video_url || video.youtube_url),
          }}
          style={styles.videoPlayer}
          allowsInlineMediaPlayback={true}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
          allowsLinkPreview={false}
          allowsBackForwardNavigationGestures={false}
          // Enable all iframe features for YouTube player
          originWhitelist={["*"]}
          // Allow rotation for fullscreen
          allowsProtectedMedia={true}
        />
      </View>

      {/* Video Info */}
      <View style={styles.playerVideoInfo}>
        <Text style={styles.playerVideoTitle}>{video.title}</Text>
        <Text style={styles.playerVideoChannel}>
          {video.channel_name || "Unknown Channel"}
        </Text>
      </View>

      {/* Recommended Videos */}
      <View style={styles.recommendedSection}>
        <Text style={styles.recommendedTitle}>Recommended</Text>
        {recommendedVideos.map((recVideo) => (
          <VideoCard
            key={recVideo.id}
            video={recVideo}
            onSave={() => {}}
            isSaved={false}
            onPress={onVideoSelect}
          />
        ))}
      </View>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [savedVideos, setSavedVideos] = useState(new Set());
  const [watchLaterVideos, setWatchLaterVideos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [recommendedVideos, setRecommendedVideos] = useState([]);

  // Single user app - always use user ID 1
  const currentUserId = 1;

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Shuffle array function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchVideos = useCallback(async () => {
    try {
      // Fetch all long videos ordered by creation date (latest first)
      const longVideosResponse = await fetch(
        `/api/videos?type=long&limit=50&orderBy=created_at&order=DESC`,
      );
      if (longVideosResponse.ok) {
        const longVideosData = await longVideosResponse.json();
        const fetchedVideos = longVideosData.videos || [];
        setVideos(fetchedVideos); // Show in chronological order, latest first
      }

      // Fetch all shorts ordered by creation date (latest first)
      const shortsResponse = await fetch(
        `/api/videos?type=short&limit=10&orderBy=created_at&order=DESC`,
      );
      if (shortsResponse.ok) {
        const shortsData = await shortsResponse.json();
        const fetchedShorts = shortsData.videos || [];
        setShorts(fetchedShorts); // Show in chronological order, latest first
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      Alert.alert("Error", "Failed to load videos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSavedVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/saved-videos`);
      if (response.ok) {
        const data = await response.json();
        const savedIds = new Set(data.savedVideos.map((v) => v.video_id));
        setSavedVideos(savedIds);
      }
    } catch (error) {
      console.error("Error fetching saved videos:", error);
    }
  }, [currentUserId]);

  const fetchWatchLaterVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/watch-later`);
      if (response.ok) {
        const data = await response.json();
        const watchLaterIds = new Set(
          data.watchLaterVideos.map((v) => v.video_id),
        );
        setWatchLaterVideos(watchLaterIds);
      }
    } catch (error) {
      console.error("Error fetching watch later videos:", error);
    }
  }, [currentUserId]);

  // Add to watch history immediately when video is clicked
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
    fetchWatchLaterVideos();
  }, [fetchSavedVideos, fetchWatchLaterVideos]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchVideos(), fetchSavedVideos(), fetchWatchLaterVideos()]);
  }, [fetchVideos, fetchSavedVideos, fetchWatchLaterVideos]);

  const handleSaveVideo = useCallback(
    async (videoId, videoType) => {
      try {
        // All videos go to watch later regardless of type
        const isInWatchLater = watchLaterVideos.has(videoId);
        const method = isInWatchLater ? "DELETE" : "POST";

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
          setWatchLaterVideos((prev) => {
            const newSet = new Set(prev);
            if (isInWatchLater) {
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
    [currentUserId, watchLaterVideos],
  );

  const handleVideoPress = useCallback(
    (video) => {
      // Add to watch history immediately
      addToWatchHistory(video.id);

      setSelectedVideo(video);
      // Get 5 random recommended videos
      const otherVideos = videos.filter((v) => v.id !== video.id);
      const recommended = shuffleArray(otherVideos).slice(0, 5);
      setRecommendedVideos(recommended);
    },
    [videos, addToWatchHistory],
  );

  const handleVideoSelect = useCallback(
    (video) => {
      // Add to watch history immediately
      addToWatchHistory(video.id);

      setSelectedVideo(video);
      // Get 5 random recommended videos
      const otherVideos = videos.filter((v) => v.id !== video.id);
      const recommended = shuffleArray(otherVideos).slice(0, 5);
      setRecommendedVideos(recommended);
    },
    [videos, addToWatchHistory],
  );

  const handleSearch = () => {
    router.push("/search");
  };

  const handleBack = () => {
    setSelectedVideo(null);
    setRecommendedVideos([]);
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (selectedVideo) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        {/* Video Player Header - Hide YouTube logo */}
        <View style={[styles.playerHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <View style={styles.placeholder} />
          <View style={styles.placeholder} />
        </View>

        <VideoPlayer
          video={selectedVideo}
          onBack={handleBack}
          recommendedVideos={recommendedVideos}
          onVideoSelect={handleVideoSelect}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <YouTubeLogo size={28} />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Search size={24} color="#606060" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {videos.map((video, index) => (
          <React.Fragment key={video.id}>
            <VideoCard
              video={video}
              onSave={handleSaveVideo}
              isSaved={watchLaterVideos.has(video.id)}
              onPress={handleVideoPress}
            />

            {/* Insert Shorts section after 6th video */}
            {index === 5 && shorts.length > 0 && (
              <ShortsSection shorts={shorts} />
            )}
          </React.Fragment>
        ))}

        {/* Loading state */}
        {loading && (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Loading videos...</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No videos available</Text>
            <Text style={styles.emptySubtext}>
              Add some videos in the admin panel
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function VideoThumbnail({ video, onPress }) {
  return (
    <TouchableOpacity style={styles.thumbnailCard} onPress={onPress}>
      <Image
        source={{
          uri:
            video.thumbnail_url ||
            "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        }}
        style={styles.thumbnailImage}
      />
      <Text style={styles.thumbnailTitle} numberOfLines={2}>
        {video.title}
      </Text>
      {/* Removed view count display as requested */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    fontFamily: "Roboto_400Regular",
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Roboto_500Medium",
    color: "#666666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#999999",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "#FF0000",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "#FFFFFF",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    marginLeft: 2,
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Roboto_700Bold",
    color: "#000000",
  },
  searchButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  // New video card design - large thumbnail on top
  videoCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  largeThumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    marginBottom: 12,
  },
  videoInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  videoTextInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
    color: "#0F0F0F",
    lineHeight: 20,
    marginBottom: 8,
  },
  channelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  channelName: {
    fontSize: 14,
    color: "#606060",
    fontFamily: "Roboto_400Regular",
    flex: 1,
  },
  saveButton: {
    padding: 8,
    marginLeft: 8,
  },
  shortsSection: {
    paddingVertical: 16,
    backgroundColor: "#F8F8F8",
    marginVertical: 8,
  },
  shortsSectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  shortsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  shortsIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  shortsSectionTitle: {
    fontSize: 18,
    fontFamily: "Roboto_700Bold",
    color: "#0F0F0F",
  },
  shortsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  shortsCard: {
    width: "48%",
  },
  shortsThumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    marginBottom: 8,
  },
  shortsTitle: {
    fontSize: 14,
    fontFamily: "Roboto_500Medium",
    color: "#0F0F0F",
    lineHeight: 18,
  },
  playerContainer: {
    flex: 1,
  },
  playerWrapper: {
    height: 280, // Larger iframe player
    backgroundColor: "#000000",
  },
  videoPlayer: {
    flex: 1,
  },
  playerVideoInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  playerVideoTitle: {
    fontSize: 18,
    fontFamily: "Roboto_500Medium",
    color: "#0F0F0F",
    marginBottom: 8,
  },
  playerVideoChannel: {
    fontSize: 14,
    color: "#606060",
    fontFamily: "Roboto_400Regular",
  },
  recommendedSection: {
    paddingTop: 16,
  },
  recommendedTitle: {
    fontSize: 18,
    fontFamily: "Roboto_700Bold",
    color: "#0F0F0F",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recentToggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  recentToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20, // Pill shape
    borderWidth: 1,
    borderColor: "#FF0000", // Red outline
    backgroundColor: "transparent",
  },
  recentToggleText: {
    fontSize: 14,
    color: "#FF0000", // Red text
    fontFamily: "Roboto_500Medium",
  },
  closeX: {
    color: "#FF0000",
    fontFamily: "Roboto_500Medium",
  },
  thumbnailCard: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    marginBottom: 12,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  thumbnailTitle: {
    fontSize: 14,
    fontFamily: "Roboto_500Medium",
    color: "#0F0F0F",
    lineHeight: 18,
    marginBottom: 8,
  },
});
