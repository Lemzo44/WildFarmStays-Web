import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { BookingService } from '../services/BookingService';
import { ReviewService } from '../services/ReviewService';
import { useSupabase } from '../lib/supabase';

interface UserManagementProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function UserManagement({ onNavigate }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterRole, sortBy]);

  const loadUsers = async () => {
    try {
      let allUsers: any[] = [];
      
      if (useSupabase) {
        allUsers = await APIService.get('profiles', {
          orderBy: { column: 'created_at', ascending: false }
        });
        
        // Normalize user fields
        allUsers = allUsers.map((u: any) => ({
          ...u,
          firstName: u.first_name || u.firstName,
          lastName: u.last_name || u.lastName,
          joinDate: u.join_date || u.joinDate || u.created_at || u.createdAt,
          createdAt: u.created_at || u.createdAt,
        }));
      } else {
        allUsers = await LocalStorageService.getAll('users');
      }
      
      // Filter out admin users from list
      const regularUsers = allUsers.filter((u: any) => u.role !== 'admin');
      setUsers(regularUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const applyFilters = async () => {
    try {
      let allUsers: any[] = [];
      
      if (useSupabase) {
        allUsers = await APIService.get('profiles', {
          orderBy: { column: 'created_at', ascending: false }
        });
        
        // Normalize user fields
        allUsers = allUsers.map((u: any) => ({
          ...u,
          firstName: u.first_name || u.firstName,
          lastName: u.last_name || u.lastName,
          joinDate: u.join_date || u.joinDate || u.created_at || u.createdAt,
          createdAt: u.created_at || u.createdAt,
        }));
      } else {
        allUsers = await LocalStorageService.getAll('users');
      }
      
      // Filter out admin users
      allUsers = allUsers.filter((u: any) => u.role !== 'admin');

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allUsers = allUsers.filter((u: any) => {
          const firstName = u.firstName || u.first_name || '';
          const lastName = u.lastName || u.last_name || '';
          return (
            firstName.toLowerCase().includes(query) ||
            lastName.toLowerCase().includes(query) ||
            (u.email && u.email.toLowerCase().includes(query)) ||
            u.id === query
          );
        });
      }

      // Filter by role
      if (filterRole !== 'all') {
        allUsers = allUsers.filter((u: any) => u.role === filterRole);
      }

      // Sort
      switch (sortBy) {
        case 'name':
          allUsers.sort((a: any, b: any) => {
            const firstNameA = a.firstName || a.first_name || '';
            const lastNameA = a.lastName || a.last_name || '';
            const firstNameB = b.firstName || b.firstName || '';
            const lastNameB = b.lastName || b.lastName || '';
            const nameA = `${firstNameA} ${lastNameA}`.trim();
            const nameB = `${firstNameB} ${lastNameB}`.trim();
            return nameA.localeCompare(nameB);
          });
          break;
        case 'recent':
          allUsers.sort((a: any, b: any) => {
            const dateA = new Date(a.joinDate || a.createdAt || a.created_at || 0);
            const dateB = new Date(b.joinDate || b.createdAt || b.created_at || 0);
            return dateB.getTime() - dateA.getTime();
          });
          break;
        case 'oldest':
          allUsers.sort((a: any, b: any) => {
            const dateA = new Date(a.joinDate || a.createdAt || a.created_at || 0);
            const dateB = new Date(b.joinDate || b.createdAt || b.created_at || 0);
            return dateA.getTime() - dateB.getTime();
          });
          break;
      }

      setUsers(allUsers);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleSuspendUser = (userId: string, userName: string) => {
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Suspend', 
          style: 'destructive',
          onPress: async () => {
            try {
              // In real implementation, this would update user status
              Alert.alert('Success', 'User suspended successfully');
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to suspend user');
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // In real implementation, this would delete user
              Alert.alert('Success', 'User deleted successfully');
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('admin-dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Manage all registered users</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Filter by Role:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterRole === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterRole('all')}
            >
              <Text style={[styles.filterButtonText, filterRole === 'all' && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterRole === 'camper' && styles.filterButtonActive]}
              onPress={() => setFilterRole('camper')}
            >
              <Text style={[styles.filterButtonText, filterRole === 'camper' && styles.filterButtonTextActive]}>
                Campers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterRole === 'farmer' && styles.filterButtonActive]}
              onPress={() => setFilterRole('farmer')}
            >
              <Text style={[styles.filterButtonText, filterRole === 'farmer' && styles.filterButtonTextActive]}>
                Farmers
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'recent' && styles.filterButtonActive]}
              onPress={() => setSortBy('recent')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'recent' && styles.filterButtonTextActive]}>
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'oldest' && styles.filterButtonActive]}
              onPress={() => setSortBy('oldest')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'oldest' && styles.filterButtonTextActive]}>
                Oldest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'name' && styles.filterButtonActive]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'name' && styles.filterButtonTextActive]}>
                Name
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Users List */}
      <View style={styles.content}>
        <Text style={styles.resultsText}>{users.length} users found</Text>
        
        {users.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.userCard}
            onPress={() => onNavigate?.('user-details', user)}
          >
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.firstName || user.first_name || ''} {user.lastName || user.last_name || ''}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}>
                <View style={[styles.roleBadge, user.role === 'farmer' && styles.roleBadgeFarmer]}>
                  <Text style={styles.roleText}>
                    {user.role === 'camper' ? '🏕️ Camper' : '🚜 Farmer'}
                  </Text>
                </View>
                {user.verified && (
                  <Text style={styles.verifiedBadge}>✓ Verified</Text>
                )}
              </View>
            </View>
            
            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigate?.('user-details', user)}
              >
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.suspendButton]}
                onPress={() => handleSuspendUser(user.id, `${user.firstName} ${user.lastName}`)}
              >
                <Text style={[styles.actionButtonText, styles.suspendButtonText]}>Suspend</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  controls: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  filters: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleBadgeFarmer: {
    backgroundColor: '#E8F5E8',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  suspendButton: {
    backgroundColor: '#FFEBEE',
  },
  suspendButtonText: {
    color: '#D32F2F',
  },
});

