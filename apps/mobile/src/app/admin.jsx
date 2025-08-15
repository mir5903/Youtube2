import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  ArrowLeft, 
  Users, 
  Video, 
  Settings, 
  Plus,
  Edit2,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const [selectedUser, setSelectedUser] = useState(1);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showShortsUploadModal, setShowShortsUploadModal] = useState(false);
  const [showVideoUploadModal, setShowVideoUploadModal] = useState(false);
  
  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [channelName, setChannelName] = useState('');

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
    Roboto_700Bold,
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // Fetch videos for selected user
  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/videos?user_id=${selectedUser}&limit=50`);
      const data = await response.json();
      if (data.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewUserAvatar(result.assets[0]);
    }
  };

  // Add new user
  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      Alert.alert('Error', 'Please enter a user name');
      return;
    }

    try {
      setLoading(true);
      
      // Create user data
      const userData = {
        name: newUserName.trim(),
        avatar_url: newUserAvatar ? newUserAvatar.uri : `https://via.placeholder.com/40x40/FF6B6B/FFFFFF?text=${newUserName.charAt(0).toUpperCase()}`,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setShowAddUserModal(false);
        setNewUserName('');
        setNewUserAvatar(null);
        fetchUsers();
        Alert.alert('Success', 'User added successfully');
      } else {
        throw new Error('Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  // Edit user
  const handleEditUser = async () => {
    if (!editingUser || !editingUser.name.trim()) {
      Alert.alert('Error', 'Please enter a user name');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        name: editingUser.name.trim(),
        avatar_url: newUserAvatar ? newUserAvatar.uri : editingUser.avatar_url,
      };

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setShowEditUserModal(false);
        setEditingUser(null);
        setNewUserAvatar(null);
        fetchUsers();
        Alert.alert('Success', 'User updated successfully');
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteUserModal(false);
        setDeletingUser(null);
        fetchUsers();
        
        // If we deleted the selected user, switch to first user
        if (deletingUser.id === selectedUser && users.length > 1) {
          setSelectedUser(users.find(u => u.id !== deletingUser.id)?.id || 1);
        }
        
        Alert.alert('Success', 'User deleted successfully');
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Upload YouTube Short
  const handleShortsUpload = async () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL');
      return;
    }

    try {
      setLoading(true);

      // Extract video ID from YouTube URL
      const videoId = extractYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      const isShort = youtubeUrl.includes('/shorts/');
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      const title = isShort ? `YouTube Short ${videoId}` : `YouTube Video ${videoId}`;

      const videoData = {
        title,
        description: `YouTube Short: ${youtubeUrl}`,
        video_url: embedUrl,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        youtube_url: youtubeUrl,
        duration: 60,
        video_type: 'short',
        category: 'General',
      };

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoData),
      });

      if (response.ok) {
        setShowShortsUploadModal(false);
        setYoutubeUrl('');
        fetchVideos();
        Alert.alert('Success', 'Short uploaded successfully');
      } else {
        throw new Error('Failed to upload short');
      }
    } catch (error) {
      console.error('Error uploading short:', error);
      Alert.alert('Error', error.message || 'Failed to upload short');
    } finally {
      setLoading(false);
    }
  };

  // Upload Long Video
  const handleVideoUpload = async () => {
    if (!videoTitle.trim() || !videoUrl.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const videoData = {
        title: videoTitle.trim(),
        description: channelName.trim() ? `By ${channelName.trim()}` : '',
        video_url: videoUrl.trim(),
        thumbnail_url: `https://via.placeholder.com/320x180/45B7D1/FFFFFF?text=${encodeURIComponent(videoTitle.trim())}`,
        duration: 1800, // 30 minutes default
        video_type: 'long',
        category: 'Educational',
      };

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoData),
      });

      if (response.ok) {
        setShowVideoUploadModal(false);
        setVideoTitle('');
        setVideoUrl('');
        setChannelName('');
        fetchVideos();
        Alert.alert('Success', 'Video uploaded successfully');
      } else {
        throw new Error('Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  // Extract YouTube video ID
  const extractYouTubeVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/v\/)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Target User Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target User</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userScroll}>
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  selectedUser === user.id && styles.userCardSelected,
                ]}
                onPress={() => setSelectedUser(user.id)}
              >
                <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
                <Text style={[
                  styles.userName,
                  selectedUser === user.id && styles.userNameSelected,
                ]}>
                  {user.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowShortsUploadModal(true)}
            >
              <Video size={32} color="#FF6B6B" />
              <Text style={styles.actionTitle}>Upload Short</Text>
              <Text style={styles.actionSubtitle}>Add YouTube Shorts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowVideoUploadModal(true)}
            >
              <Upload size={32} color="#4ECDC4" />
              <Text style={styles.actionTitle}>Upload Video</Text>
              <Text style={styles.actionSubtitle}>Add long videos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Management</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddUserModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add User</Text>
            </TouchableOpacity>
          </View>

          {users.map((user) => (
            <View key={user.id} style={styles.userManagementCard}>
              <Image source={{ uri: user.avatar_url }} style={styles.managementAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.managementUserName}>{user.name}</Text>
                <Text style={styles.managementUserMeta}>
                  ID: {user.id} • Created: {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditingUser(user);
                    setShowEditUserModal(true);
                  }}
                >
                  <Edit2 size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setDeletingUser(user);
                    setShowDeleteUserModal(true);
                  }}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Videos for Selected User */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recent Videos ({users.find(u => u.id === selectedUser)?.name || 'User'})
          </Text>
          {videos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No videos found</Text>
              <Text style={styles.emptyStateSubtext}>Upload some videos to get started</Text>
            </View>
          ) : (
            videos.slice(0, 10).map((video) => (
              <View key={video.id} style={styles.videoCard}>
                <Image source={{ uri: video.thumbnail_url }} style={styles.videoThumbnail} />
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={styles.videoMeta}>
                    {video.video_type === 'short' ? 'Short' : 'Video'} • {video.category} • {video.view_count || 0} views
                  </Text>
                  <Text style={styles.videoDate}>
                    {new Date(video.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={showAddUserModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity onPress={() => setShowAddUserModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
                {newUserAvatar ? (
                  <Image source={{ uri: newUserAvatar.uri }} style={styles.avatarPreview} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={32} color="#9CA3AF" />
                    <Text style={styles.avatarText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.modalInput}
                value={newUserName}
                onChangeText={setNewUserName}
                placeholder="Enter user name"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                onPress={handleAddUser}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Adding...' : 'Add User'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={showEditUserModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => setShowEditUserModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
                {newUserAvatar ? (
                  <Image source={{ uri: newUserAvatar.uri }} style={styles.avatarPreview} />
                ) : editingUser ? (
                  <Image source={{ uri: editingUser.avatar_url }} style={styles.avatarPreview} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={32} color="#9CA3AF" />
                    <Text style={styles.avatarText}>Tap to change photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.modalInput}
                value={editingUser?.name || ''}
                onChangeText={(text) => setEditingUser({ ...editingUser, name: text })}
                placeholder="Enter user name"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                onPress={handleEditUser}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Updating...' : 'Update User'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete User Modal */}
      <Modal visible={showDeleteUserModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <Text style={styles.alertTitle}>Delete User</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to delete "{deletingUser?.name}" and all their data? This action cannot be undone.
            </Text>
            
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertButtonCancel}
                onPress={() => setShowDeleteUserModal(false)}
              >
                <Text style={styles.alertButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.alertButtonDelete, loading && styles.modalButtonDisabled]}
                onPress={handleDeleteUser}
                disabled={loading}
              >
                <Text style={styles.alertButtonDeleteText}>
                  {loading ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shorts Upload Modal */}
      <Modal visible={showShortsUploadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload YouTube Short</Text>
              <TouchableOpacity onPress={() => setShowShortsUploadModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TextInput
                style={styles.modalInput}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                placeholder="https://youtube.com/shorts/..."
                placeholderTextColor="#9CA3AF"
                multiline
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                onPress={handleShortsUpload}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Uploading...' : 'Upload Short'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Upload Modal */}
      <Modal visible={showVideoUploadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Long Video</Text>
              <TouchableOpacity onPress={() => setShowVideoUploadModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TextInput
                style={styles.modalInput}
                value={videoTitle}
                onChangeText={setVideoTitle}
                placeholder="Video Title *"
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                style={styles.modalInput}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="Video URL *"
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                style={styles.modalInput}
                value={channelName}
                onChangeText={setChannelName}
                placeholder="Channel Name (optional)"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                onPress={handleVideoUpload}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Uploading...' : 'Upload Video'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_600SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userScroll: {
    flexGrow: 0,
  },
  userCard: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F9FAFB',
  },
  userCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#6B7280',
  },
  userNameSelected: {
    color: '#3B82F6',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 0.48,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_600SemiBold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    marginLeft: 4,
  },
  userManagementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  managementAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  managementUserName: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#1F2937',
  },
  managementUserMeta: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  videoCard: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#1F2937',
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  videoDate: {
    fontSize: 11,
    fontFamily: 'Roboto_400Regular',
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_600SemiBold',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    marginBottom: 16,
    minHeight: 48,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto_600SemiBold',
  },
  avatarPicker: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  avatarText: {
    fontSize: 10,
    fontFamily: 'Roboto_400Regular',
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  alertModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: '80%',
  },
  alertTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_600SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  alertButtonCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  alertButtonCancelText: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#6B7280',
  },
  alertButtonDelete: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  alertButtonDeleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto_600SemiBold',
  },
});