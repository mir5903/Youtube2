import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Bookmark, BookmarkCheck } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/utils/auth/useUser";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";

const { width: screenWidth } = Dimensions.get("window");

function VideoCard({ video, onRemove, onPress }) {
  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <TouchableOpacity style={styles.videoCard} onPress={() => onPress(video)}>
      {/* Thumbnail */}
      <Image
        source={{
          uri:
            video.thumbnail_url ||
            "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        }}
        style={styles.thumbnail}
      />

      {/* Duration overlay */}
      {video.duration && (
        <View style={styles.durationOverlay}>
          <Text style={styles.durationText}>
            {formatDuration(video.duration)}
          </Text>
        </View>
      )}

      {/* Video info */}
      <View style={styles.videoInfo}>
        <View style={styles.videoTextInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.videoMeta}>
            {video.channel_name || "Unknown Channel"} •{" "}
            {formatViewCount(video.view_count || 0)}
          </Text>
        </View>

        {/* Remove button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(video.id, video.video_type)}
        >
          <BookmarkCheck size={20} color="#FF0000" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function WatchLaterScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [savedVideos, setSavedVideos] = useState([]);
  const [watchLaterVideos, setWatchLaterVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single user app - always use user ID 1
  const currentUserId = 1;

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Fetch saved videos and watch later
  const fetchSavedContent = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch both saved videos and watch later
      const [savedResponse, watchLaterResponse] = await Promise.all([
        fetch(`/api/users/${currentUserId}/saved-videos`),
        fetch(`/api/users/${currentUserId}/watch-later`),
      ]);

      const savedVideos = savedResponse.ok
        ? (await savedResponse.json()).savedVideos || []
        : [];
      const watchLaterVideos = watchLaterResponse.ok
        ? (await watchLaterResponse.json()).watchLaterVideos || []
        : [];

      setSavedVideos(savedVideos);
      setWatchLaterVideos(watchLaterVideos);
    } catch (error) {
      console.error("Error fetching saved content:", error);
      Alert.alert("Error", "Failed to load saved videos");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchSavedContent();
  }, [fetchSavedContent]);

  // Remove from saved/watch later
  const handleRemove = useCallback(
    async (videoId, videoType) => {
      try {
        if (videoType === "short") {
          // Remove from watch later
          const response = await fetch(
            `/api/users/${currentUserId}/watch-later`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ videoId }),
            },
          );

          if (response.ok) {
            setWatchLaterVideos((prev) => prev.filter((v) => v.id !== videoId));
          }
        } else {
          // Remove from saved videos
          const response = await fetch(
            `/api/users/${currentUserId}/saved-videos`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ videoId }),
            },
          );

          if (response.ok) {
            setSavedVideos((prev) => prev.filter((v) => v.id !== videoId));
          }
        }
      } catch (error) {
        console.error("Error removing video:", error);
        Alert.alert("Error", "Failed to remove video");
      }
    },
    [currentUserId],
  );

  const handleVideoPress = (video) => {
    if (video.video_type === "short") {
      router.push("/shorts");
    } else {
      router.back(); // Go back to home and let user click the video there
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const allSavedContent = [...savedVideos, ...watchLaterVideos];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch Later</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allSavedContent.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {allSavedContent.length} saved video
              {allSavedContent.length !== 1 ? "s" : ""}
            </Text>

            {allSavedContent.map((video) => (
              <VideoCard
                key={`${video.video_type}-${video.id}`}
                video={video}
                onRemove={handleRemove}
                onPress={handleVideoPress}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Bookmark size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No saved videos</Text>
            <Text style={styles.emptySubtitle}>
              Videos you save will appear here
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
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
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    fontFamily: "Roboto_400Regular",
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Roboto_700Bold",
    color: "#0F0F0F",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
    color: "#606060",
    marginBottom: 16,
  },
  videoCard: {
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
  },
  thumbnail: {
    width: 120,
    height: 68,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  durationOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Roboto_400Regular",
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  videoTextInfo: {
    flex: 1,
    marginRight: 8,
  },
  videoTitle: {
    fontSize: 14,
    fontFamily: "Roboto_500Medium",
    color: "#0F0F0F",
    lineHeight: 18,
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 12,
    color: "#606060",
    fontFamily: "Roboto_400Regular",
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Roboto_500Medium",
    color: "#666666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#999999",
    textAlign: "center",
  },
});
