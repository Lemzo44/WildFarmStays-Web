import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';

interface SupportTicketsProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function SupportTickets({ onNavigate }: SupportTicketsProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterStatus, filterCategory]);

  const loadTickets = async () => {
    try {
      let allTickets: any[] = [];
      if (useSupabase) {
        allTickets = await APIService.get('support_tickets', {
          orderBy: { column: 'created_at', ascending: false }
        });
        // Normalize ticket fields
        allTickets = allTickets.map((t: any) => ({
          ...t,
          userName: t.name || t.userName,
          userEmail: t.email || t.userEmail,
          userId: t.user_id || t.userId,
          createdAt: t.created_at || t.createdAt,
        }));
      } else {
        allTickets = await LocalStorageService.getAll('tickets') || [];
      }
      setTickets(allTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const applyFilters = async () => {
    try {
      let allTickets: any[] = [];
      if (useSupabase) {
        allTickets = await APIService.get('support_tickets', {
          orderBy: { column: 'created_at', ascending: false }
        });
        // Normalize ticket fields
        allTickets = allTickets.map((t: any) => ({
          ...t,
          userName: t.name || t.userName,
          userEmail: t.email || t.userEmail,
          userId: t.user_id || t.userId,
          createdAt: t.created_at || t.createdAt,
        }));
      } else {
        allTickets = await LocalStorageService.getAll('tickets') || [];
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allTickets = allTickets.filter((t: any) =>
          t.subject?.toLowerCase().includes(query) ||
          t.id === query
        );
      }

      // Filter by status
      if (filterStatus !== 'all') {
        allTickets = allTickets.filter((t: any) => t.status === filterStatus);
      }

      // Filter by category
      if (filterCategory !== 'all') {
        allTickets = allTickets.filter((t: any) => t.category === filterCategory);
      }

      setTickets(allTickets);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      if (useSupabase) {
        await APIService.update('support_tickets', ticketId, { status: newStatus });
        loadTickets();
      } else {
        const ticket = await LocalStorageService.getById('tickets', ticketId);
        if (ticket) {
          ticket.status = newStatus;
          await LocalStorageService.save('tickets', ticket);
          loadTickets();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update ticket status');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('admin-dashboard')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Support Tickets</Text>
        <Text style={styles.subtitle}>Manage customer support requests</Text>
      </View>

      {/* Empty State */}
      {tickets.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyTitle}>No Support Tickets</Text>
          <Text style={styles.emptyText}>
            Support tickets will appear here when users submit them through the Contact Us page.
          </Text>
        </View>
      )}

      {tickets.length > 0 && (
        <>
          {/* Search and Filters */}
          <View style={styles.controls}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search tickets..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.filters}>
              <Text style={styles.filterLabel}>Filter by Status:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterStatus === 'open' && styles.filterButtonActive]}
                  onPress={() => setFilterStatus('open')}
                >
                  <Text style={[styles.filterButtonText, filterStatus === 'open' && styles.filterButtonTextActive]}>
                    Open
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterStatus === 'in_progress' && styles.filterButtonActive]}
                  onPress={() => setFilterStatus('in_progress')}
                >
                  <Text style={[styles.filterButtonText, filterStatus === 'in_progress' && styles.filterButtonTextActive]}>
                    In Progress
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterStatus === 'resolved' && styles.filterButtonActive]}
                  onPress={() => setFilterStatus('resolved')}
                >
                  <Text style={[styles.filterButtonText, filterStatus === 'resolved' && styles.filterButtonTextActive]}>
                    Resolved
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Category:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, filterCategory === 'all' && styles.filterButtonActive]}
                  onPress={() => setFilterCategory('all')}
                >
                  <Text style={[styles.filterButtonText, filterCategory === 'all' && styles.filterButtonTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {['Booking Issue', 'Payment Issue', 'Account Issue', 'Technical Issue'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterButton, filterCategory === cat && styles.filterButtonActive]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text style={[styles.filterButtonText, filterCategory === cat && styles.filterButtonTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Tickets List */}
          <View style={styles.content}>
            <Text style={styles.resultsText}>{tickets.length} tickets found</Text>
            
            {tickets.map((ticket) => {
              const isPublicContact = !ticket.userId && !ticket.user_id; // Public contact messages have NULL user_id
              return (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => onNavigate?.('ticket-details', ticket)}
                >
                  <View style={styles.ticketHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketSubject}>{ticket.subject || 'No Subject'}</Text>
                      {isPublicContact && (
                        <Text style={styles.publicContactLabel}>🌐 Public Contact Message</Text>
                      )}
                      {!isPublicContact && ticket.userName && (
                        <Text style={styles.userNameLabel}>From: {ticket.userName}</Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, ticket.status === 'open' && styles.statusOpen, ticket.status === 'resolved' && styles.statusResolved]}>
                      <Text style={[styles.statusText, ticket.status === 'open' && styles.statusTextOpen, ticket.status === 'resolved' && styles.statusTextResolved]}>
                        {ticket.status}
                      </Text>
                    </View>
                  </View>
                  {ticket.userEmail && (
                    <Text style={styles.ticketEmail}>📧 {ticket.userEmail}</Text>
                  )}
                  <Text style={styles.ticketCategory}>{ticket.category || (isPublicContact ? 'Public Contact' : 'General')}</Text>
                  <Text style={styles.ticketDate}>
                    Created: {(ticket.createdAt || ticket.created_at) ? new Date(ticket.createdAt || ticket.created_at).toLocaleDateString() : 'N/A'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
    flexWrap: 'wrap',
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
    fontSize: 12,
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
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#FFEBEE',
  },
  statusResolved: {
    backgroundColor: '#E8F5E8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    textTransform: 'capitalize',
  },
  statusTextOpen: {
    color: '#D32F2F',
  },
  statusTextResolved: {
    color: '#2E7D32',
  },
  ticketCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 12,
    color: '#999',
  },
  publicContactLabel: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 4,
  },
  userNameLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ticketEmail: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
  },
});


