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
import { ArrowLeft, History, Trash2 } from "lucide-react-native";
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

  const formatWatchedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
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
          <Text style={styles.watchedDate}>
            Watched {formatWatchedDate(video.watched_at)}
          </Text>
        </View>

        {/* Remove button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(video.video_id)}
        >
          <Trash2 size={18} color="#606060" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single user app - always use user ID 1
  const currentUserId = 1;

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Fetch watch history
  const fetchWatchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${currentUserId}/watch-history`);
      if (response.ok) {
        const data = await response.json();
        setWatchHistory(data.watchHistory || []);
      }
    } catch (error) {
      console.error("Error fetching watch history:", error);
      Alert.alert("Error", "Failed to load watch history");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchWatchHistory();
  }, [fetchWatchHistory]);

  // Remove from watch history
  const handleRemove = useCallback(
    async (videoId) => {
      try {
        const response = await fetch(
          `/api/users/${currentUserId}/watch-history`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoId }),
          },
        );

        if (response.ok) {
          setWatchHistory((prev) => prev.filter((v) => v.video_id !== videoId));
        } else {
          Alert.alert("Error", "Failed to remove video from history");
        }
      } catch (error) {
        console.error("Error removing video:", error);
        Alert.alert("Error", "Failed to remove video from history");
      }
    },
    [currentUserId],
  );

  // Clear all history
  const handleClearAll = useCallback(async () => {
    Alert.alert(
      "Clear Watch History",
      "Are you sure you want to clear your entire watch history?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all watch history for user
              const response = await fetch(
                `/api/users/${currentUserId}/watch-history/clear`,
                {
                  method: "DELETE",
                },
              );

              if (response.ok) {
                setWatchHistory([]);
              } else {
                Alert.alert("Error", "Failed to clear watch history");
              }
            } catch (error) {
              console.error("Error clearing history:", error);
              Alert.alert("Error", "Failed to clear watch history");
            }
          },
        },
      ],
    );
  }, [currentUserId]);

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch History</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearAll}
          disabled={watchHistory.length === 0}
        >
          <Text
            style={[
              styles.clearButtonText,
              { opacity: watchHistory.length === 0 ? 0.5 : 1 },
            ]}
          >
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {watchHistory.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {watchHistory.length} video{watchHistory.length !== 1 ? "s" : ""}{" "}
              watched
            </Text>

            {watchHistory.map((video) => (
              <VideoCard
                key={`${video.video_id}-${video.watched_at}`}
                video={video}
                onRemove={handleRemove}
                onPress={handleVideoPress}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <History size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No watch history</Text>
            <Text style={styles.emptySubtitle}>
              Videos you watch will appear here
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Roboto_700Bold",
    color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  durationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  videoInfo: {
    flex: 1,
    marginLeft: 16,
  },
  videoTextInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
    color: "#1F2937",
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Roboto_400Regular",
    marginBottom: 4,
  },
  watchedDate: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Roboto_400Regular",
    marginTop: 4,
  },
  removeButton: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  clearButton: {
    marginLeft: 16,
  },
  clearButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Roboto_400Regular",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Roboto_500Medium",
    color: "#6B7280",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#9CA3AF",
    textAlign: "center",
  },
});
