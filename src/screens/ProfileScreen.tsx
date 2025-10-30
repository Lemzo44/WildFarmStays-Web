import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FarmerRatingService } from '../services/FarmerRatingService';
import { supabase } from '../lib/supabase';

interface ProfileScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [ratingStats, setRatingStats] = useState({
    totalRatings: 0,
    averageRating: 0,
  });
  const [showRatings, setShowRatings] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRatingStats();
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setPhone(currentUser.phone || '');
      setFarmName(currentUser.farmName || '');
      setFarmAddress(currentUser.farmAddress || '');
      setPostcode(currentUser.postcode || '');
    }
  }, [currentUser]);

  const loadRatingStats = async () => {
    if (currentUser?.role === 'camper' && currentUser) {
      try {
        const stats = await FarmerRatingService.getCamperFarmerRatingStats(currentUser.id);
        setRatingStats(stats);
      } catch (error) {
        console.error('Error loading rating stats:', error);
      }
    }
  };

  const loadRatings = async () => {
    if (currentUser?.role === 'camper' && currentUser) {
      try {
        const rows = await FarmerRatingService.getCamperFarmerRatings(currentUser.id);
        setRatings(rows);
      } catch (error) {
        console.error('Error loading ratings:', error);
        setRatings([]);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={styles.star}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  const handleEditProfile = () => {
    setEditMode(true);
  };

  const handleSubscription = () => {
    console.log('Manage subscription');
  };

  const handleVerification = () => {
    console.log('Start verification');
  };

  const handleChangePassword = async () => {
    if (!currentUser?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
      });
      if (error) throw error;
      alert('Password reset email sent. Please check your inbox.');
    } catch (e) {
      console.error('Error sending password reset email:', e);
      alert('Failed to send password reset email.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Manage your account and preferences
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser?.firstName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {!editMode ? (
              <Text style={styles.profileName}>
                {currentUser?.firstName} {currentUser?.lastName}
              </Text>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </>
            )}
            <Text style={styles.profileEmail}>{currentUser?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {currentUser?.role === 'farmer' ? '🚜 Farmer' : '🏕️ Camper'}
              </Text>
            </View>
            {currentUser?.role === 'camper' && ratingStats.totalRatings > 0 && (
              <View style={styles.ratingDisplay}>
                {renderStars(Math.round(ratingStats.averageRating))}
                <Text style={styles.ratingText}>
                  {ratingStats.averageRating.toFixed(1)} ({ratingStats.totalRatings} rating{ratingStats.totalRatings !== 1 ? 's' : ''})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Phone and Farmer fields */}
        {editMode ? (
          <View style={{ marginTop: 12 }}>
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
            />
            {currentUser?.role === 'farmer' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Farm Name"
                  value={farmName}
                  onChangeText={setFarmName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Farm Address"
                  value={farmAddress}
                  onChangeText={setFarmAddress}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Postcode"
                  value={postcode}
                  onChangeText={setPostcode}
                />
              </>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{currentUser?.phone || 'Not provided'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {currentUser?.joinDate ? new Date(currentUser.joinDate).toLocaleDateString() : '—'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, styles.verifiedText]}>
            {currentUser?.verified ? '✅ Verified' : '❌ Unverified'}
          </Text>
        </View>

        {currentUser?.role === 'camper' && (currentUser?.subscriptionStatus || currentUser?.subscriptionRenewalDate) && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription</Text>
            <Text style={[
              styles.infoValue, 
              currentUser?.subscriptionStatus === 'active' ? styles.activeText : styles.expiredText
            ]}>
              {currentUser?.subscriptionStatus === 'active' ? '✅ Active' : (currentUser?.subscriptionStatus ? '⚠️ Expired' : '—')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verification Status</Text>
        <View style={styles.verificationRow}>
          <Text style={styles.verificationLabel}>ID Verified</Text>
          <View style={[
            styles.statusChip,
            currentUser?.verified 
              ? { backgroundColor: '#4CAF50' }
              : { backgroundColor: '#FF9800' }
          ]}>
            <Text style={styles.statusText}>
              {currentUser?.verified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
        {!currentUser?.verified && (
          <TouchableOpacity style={styles.actionButton} onPress={handleVerification}>
            <Text style={styles.actionButtonText}>Start Verification</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentUser?.role === 'camper' && (currentUser?.subscriptionStatus || currentUser?.subscriptionRenewalDate) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Subscription</Text>
          <View style={styles.subscriptionRow}>
            <Text style={styles.subscriptionLabel}>Annual Subscription</Text>
            <View style={[styles.statusChip, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.statusText}>{currentUser?.subscriptionStatus || '—'}</Text>
            </View>
          </View>
          <View style={styles.subscriptionRow}>
            <Text style={styles.subscriptionLabel}>Renewal Date</Text>
            <Text style={styles.renewalDate}>
              {currentUser?.subscriptionRenewalDate
                ? new Date(currentUser.subscriptionRenewalDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            </Text>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={handleSubscription}>
            <Text style={styles.actionButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#2E7D32' }}
            thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {currentUser?.role === 'camper' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Ratings</Text>
          <Text style={styles.ratingsDescription}>
            See what farmers are saying about your stays
          </Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={async () => {
              if (!showRatings) {
                await loadRatings();
              }
              setShowRatings(!showRatings);
            }}
          >
            <Text style={styles.actionButtonText}>⭐ View Your Ratings</Text>
          </TouchableOpacity>

          {showRatings && ratings.length > 0 && (
            <View style={{ marginTop: 12 }}>
              {ratings.map((r: any) => (
                <View key={r.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
                  <Text style={{ fontWeight: '600', color: '#333' }}>Rating: {r.rating} / 5</Text>
                  {r.comment ? (
                    <Text style={{ color: '#555', marginTop: 4 }}>{r.comment}</Text>
                  ) : null}
                  <Text style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {new Date(r.createdAt || r.created_at || '').toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {showRatings && ratings.length === 0 && (
            <Text style={{ marginTop: 12, color: '#666' }}>No ratings yet.</Text>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        {!editMode ? (
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Text style={styles.actionButtonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={async () => {
                if (!currentUser) return;
                try {
                  setSaving(true);
                  const payload: any = {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    phone: phone.trim() || null,
                  };
                  if (currentUser.role === 'farmer') {
                    payload.farm_name = farmName.trim() || null;
                    payload.farm_address = farmAddress.trim() || null;
                    payload.postcode = postcode.trim() || null;
                  }
                  await APIService.update('profiles', currentUser.id, payload);
                  alert('Profile updated successfully.');
                  setEditMode(false);
                } catch (e) {
                  console.error('Error updating profile:', e);
                  alert('Failed to update profile.');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditMode(false);
                if (currentUser) {
                  setFirstName(currentUser.firstName || '');
                  setLastName(currentUser.lastName || '');
                  setPhone(currentUser.phone || '');
                  setFarmName(currentUser.farmName || '');
                  setFarmAddress(currentUser.farmAddress || '');
                  setPostcode(currentUser.postcode || '');
                }
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
          <Text style={styles.actionButtonText}>🔒 Change Password</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => onNavigate?.('contact')}>
          <Text style={styles.actionButtonText}>❓ Help & Support</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Actions</Text>
        
        <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.dangerButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    color: '#666',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  verifiedText: {
    color: '#2E7D32',
  },
  activeText: {
    color: '#2E7D32',
  },
  expiredText: {
    color: '#FF9800',
  },
  actionButton: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  ratingDisplay: {
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationLabel: {
    fontSize: 14,
    color: '#333',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#333',
  },
  renewalDate: {
    fontSize: 14,
    color: '#666',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#333',
  },
  ratingsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
});
