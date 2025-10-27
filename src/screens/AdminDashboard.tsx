import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboardProps {
  onNavigate?: (screen: string, data?: any) => void;
}

interface DashboardStats {
  totalUsers: number;
  totalCampers: number;
  totalFarmers: number;
  activeListings: number;
  pendingListings: number;
  openBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  newRegistrationsLast7Days: number;
  newRegistrationsLast30Days: number;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCampers: 0,
    totalFarmers: 0,
    activeListings: 0,
    pendingListings: 0,
    openBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0,
    newRegistrationsLast7Days: 0,
    newRegistrationsLast30Days: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Load users
      const users = await LocalStorageService.getAll('users');
      const campers = users.filter((u: any) => u.role === 'camper' && u.role !== 'admin');
      const farmers = users.filter((u: any) => u.role === 'farmer');
      
      // Load listings
      const listings = await LocalStorageService.getAll('listings');
      const activeListings = listings.filter((l: any) => l.availability === 'available');
      const pendingListings = listings.filter((l: any) => l.availability === 'pending');
      
      // Load bookings
      const bookings = await LocalStorageService.getAll('bookings');
      const openBookings = bookings.filter((b: any) => ['pending', 'confirmed', 'upcoming'].includes(b.status));
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
      
      // Calculate revenue (simplified)
      const today = new Date();
      const thisMonthBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate.getMonth() === today.getMonth() && 
               bookingDate.getFullYear() === today.getFullYear();
      });
      
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
      const thisMonthRevenue = thisMonthBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
      
      // Calculate new registrations
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newRegistrationsLast7Days = users.filter((u: any) => {
        const joinDate = new Date(u.joinDate || u.createdAt);
        return joinDate >= sevenDaysAgo;
      }).length;
      
      const newRegistrationsLast30Days = users.filter((u: any) => {
        const joinDate = new Date(u.joinDate || u.createdAt);
        return joinDate >= thirtyDaysAgo;
      }).length;

      setStats({
        totalUsers: users.length,
        totalCampers: campers.length,
        totalFarmers: farmers.length,
        activeListings: activeListings.length,
        pendingListings: pendingListings.length,
        openBookings: openBookings.length,
        pendingBookings: pendingBookings.length,
        totalRevenue: Math.round(totalRevenue),
        thisMonthRevenue: Math.round(thisMonthRevenue),
        newRegistrationsLast7Days,
        newRegistrationsLast30Days,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {currentUser?.firstName} {currentUser?.lastName}</Text>
      </View>

      {/* Overview Cards */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => onNavigate?.('user-management')}
        >
          <Text style={styles.cardIcon}>👥</Text>
          <Text style={styles.cardNumber}>{stats.totalUsers}</Text>
          <Text style={styles.cardLabel}>Total Users</Text>
          <Text style={styles.cardSubtext}>{stats.totalCampers} Campers • {stats.totalFarmers} Farmers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => onNavigate?.('listing-management')}
        >
          <Text style={styles.cardIcon}>🏕️</Text>
          <Text style={styles.cardNumber}>{stats.activeListings}</Text>
          <Text style={styles.cardLabel}>Active Listings</Text>
          <Text style={styles.cardSubtext}>{stats.pendingListings} Pending Approval</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => onNavigate?.('booking-management')}
        >
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardNumber}>{stats.openBookings}</Text>
          <Text style={styles.cardLabel}>Open Bookings</Text>
          <Text style={styles.cardSubtext}>{stats.pendingBookings} Require Attention</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardIcon}>💰</Text>
          <Text style={styles.cardNumber}>£{stats.totalRevenue}</Text>
          <Text style={styles.cardLabel}>Total Revenue</Text>
          <Text style={styles.cardSubtext}>£{stats.thisMonthRevenue} This Month</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate?.('listing-management', { filter: 'pending' })}
          >
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionText}>Approve Listings</Text>
            {stats.pendingListings > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingListings}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate?.('booking-management', { filter: 'pending' })}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Review Bookings</Text>
            {stats.pendingBookings > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingBookings}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate?.('user-management')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate?.('support-tickets')}
          >
            <Text style={styles.actionIcon}>🎫</Text>
            <Text style={styles.actionText}>Support Tickets</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>📊</Text>
            <Text style={styles.activityText}>
              <Text style={styles.activityNumber}>{stats.newRegistrationsLast7Days}</Text> new users registered this week
            </Text>
          </View>

          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>📈</Text>
            <Text style={styles.activityText}>
              <Text style={styles.activityNumber}>{stats.newRegistrationsLast30Days}</Text> new users this month
            </Text>
          </View>

          <View style={styles.activityItem}>
            <Text style={styles.activityIcon}>✅</Text>
            <Text style={styles.activityText}>
              <Text style={styles.activityNumber}>{stats.activeListings}</Text> active listings available
            </Text>
          </View>
        </View>
      </View>

      {/* Management Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.managementLinks}>
          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => onNavigate?.('user-management')}
          >
            <Text style={styles.linkIcon}>👥</Text>
            <Text style={styles.linkText}>User Management</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => onNavigate?.('listing-management')}
          >
            <Text style={styles.linkIcon}>🏕️</Text>
            <Text style={styles.linkText}>Listing Management</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => onNavigate?.('booking-management')}
          >
            <Text style={styles.linkIcon}>📅</Text>
            <Text style={styles.linkText}>Booking Management</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => onNavigate?.('support-tickets')}
          >
            <Text style={styles.linkIcon}>🎫</Text>
            <Text style={styles.linkText}>Support Tickets</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkCard}
            onPress={() => onNavigate?.('reviews-management')}
          >
            <Text style={styles.linkIcon}>⭐</Text>
            <Text style={styles.linkText}>Review Management</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>
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
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  cardNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minWidth: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  activityNumber: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  managementLinks: {
    gap: 12,
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  linkArrow: {
    fontSize: 20,
    color: '#2E7D32',
  },
});

