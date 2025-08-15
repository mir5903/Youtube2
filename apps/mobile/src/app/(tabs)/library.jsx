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
import { ChevronRight, Play, Clock, RotateCcw } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/utils/auth/useUser";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";

const { width: screenWidth } = Dimensions.get("window");

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
    </TouchableOpacity>
  );
}

function HorizontalVideoList({ title, videos, onViewMore, onVideoPress }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
          <Text style={styles.viewMoreText}>View More</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {videos.slice(0, 10).map((video) => (
          <VideoThumbnail
            key={video.id}
            video={video}
            onPress={() => onVideoPress(video)}
          />
        ))}

        {videos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No videos found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [watchHistory, setWatchHistory] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  // Single user app - no user switching needed
  const currentUserId = 1;

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Fetch watch history
  const fetchWatchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/watch-history`);
      if (response.ok) {
        const data = await response.json();
        setWatchHistory(data.watchHistory || []);
      }
    } catch (error) {
      console.error("Error fetching watch history:", error);
    }
  }, [currentUserId]);

  // Fetch watch later and saved videos
  const fetchWatchLater = useCallback(async () => {
    try {
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

      // Combine both types of saved content
      const allSavedContent = [...savedVideos, ...watchLaterVideos];
      setWatchLater(allSavedContent);
    } catch (error) {
      console.error("Error fetching saved content:", error);
    }
  }, [currentUserId]);

  // New reload function that refreshes both lists
  const handleReload = useCallback(async () => {
    setReloading(true);
    try {
      await Promise.all([fetchWatchHistory(), fetchWatchLater()]);
      Alert.alert("Success", "Library updated successfully!");
    } catch (error) {
      console.error("Error reloading library:", error);
      Alert.alert("Error", "Failed to reload library");
    } finally {
      setReloading(false);
    }
  }, [fetchWatchHistory, fetchWatchLater]);

  useEffect(() => {
    fetchWatchHistory();
    fetchWatchLater();
    setLoading(false);
  }, [fetchWatchHistory, fetchWatchLater]);

  const handleVideoPress = (video) => {
    if (video.video_type === "short") {
      router.push("/shorts");
    } else {
      // Go back to home and play the video there
      router.push("/(tabs)");
    }
  };

  const handleViewMoreHistory = () => {
    router.push("/history");
  };

  const handleViewMoreWatchLater = () => {
    router.push("/watch-later");
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

      {/* Header with reload button */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={handleReload}
          disabled={reloading}
        >
          <RotateCcw
            size={24}
            color={reloading ? "#CCCCCC" : "#606060"}
            style={reloading ? styles.reloadSpinning : null}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Watch History */}
        <HorizontalVideoList
          title="Watch History"
          videos={watchHistory}
          onViewMore={handleViewMoreHistory}
          onVideoPress={handleVideoPress}
        />

        {/* Watch Later */}
        <HorizontalVideoList
          title="Watch Later"
          videos={watchLater}
          onViewMore={handleViewMoreWatchLater}
          onVideoPress={handleVideoPress}
        />

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
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Roboto_700Bold",
    color: "#0F0F0F",
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Roboto_700Bold",
    color: "#0F0F0F",
  },
  viewMoreButton: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewMoreText: {
    fontSize: 14,
    fontFamily: "Roboto_500Medium",
    color: "#606060",
  },
  horizontalList: {
    paddingLeft: 16,
  },
  thumbnailCard: {
    marginRight: 12,
    width: 140,
  },
  thumbnailImage: {
    width: 140,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    marginBottom: 8,
  },
  thumbnailTitle: {
    fontSize: 14,
    fontFamily: "Roboto_500Medium",
    color: "#0F0F0F",
    lineHeight: 18,
    marginBottom: 4,
  },
  thumbnailMeta: {
    fontSize: 12,
    color: "#606060",
    fontFamily: "Roboto_400Regular",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999999",
    fontFamily: "Roboto_400Regular",
  },
});
