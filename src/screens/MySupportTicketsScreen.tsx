import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { APIService } from '../services/APIService';
import { LocalStorageService } from '../services/LocalStorageService';
import { useSupabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MySupportTicketsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function MySupportTicketsScreen({ onNavigate }: MySupportTicketsScreenProps) {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTickets();
  }, [currentUser?.id]);

  const loadMyTickets = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let allTickets: any[] = [];
      
      if (useSupabase) {
        // Fetch tickets where user_id matches current user
        allTickets = await APIService.get('support_tickets', {
          filter: { column: 'user_id', operator: 'eq', value: currentUser.id },
          orderBy: { column: 'created_at', ascending: false }
        });
        
        // Normalize ticket fields
        allTickets = allTickets.map((t: any) => ({
          ...t,
          userName: t.name || t.userName,
          userEmail: t.email || t.userEmail,
          userId: t.user_id || t.userId,
          createdAt: t.created_at || t.createdAt,
          updatedAt: t.updated_at || t.updatedAt,
        }));
      } else {
        const all = await LocalStorageService.getAll('tickets') || [];
        allTickets = all.filter((t: any) => t.userId === currentUser.id);
      }
      
      setTickets(allTickets);
    } catch (error) {
      console.error('Error loading my tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#FF5722';
      case 'in_progress':
        return '#2196F3';
      case 'resolved':
        return '#4CAF50';
      case 'closed':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('profile')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Support Tickets</Text>
        <Text style={styles.subtitle}>View your support requests and responses</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading your tickets...</Text>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No Support Tickets</Text>
            <Text style={styles.emptyText}>
              You haven't submitted any support tickets yet.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => onNavigate?.('contact')}
            >
              <Text style={styles.createButtonText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() => onNavigate?.('my-ticket-details', ticket)}
            >
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject}>{ticket.subject || 'No Subject'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status || 'open') + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(ticket.status || 'open') }]}>
                    {formatStatus(ticket.status || 'open')}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.ticketMessage} numberOfLines={2}>
                {ticket.message || 'No message'}
              </Text>
              
              {ticket.admin_notes && (
                <View style={styles.responseIndicator}>
                  <Text style={styles.responseIndicatorText}>✓ Admin Response Available</Text>
                </View>
              )}
              
              <View style={styles.ticketFooter}>
                <Text style={styles.ticketDate}>
                  Submitted: {formatDate(ticket.createdAt || ticket.created_at)}
                </Text>
                {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                  <Text style={styles.ticketDate}>
                    Updated: {formatDate(ticket.updatedAt || ticket.updated_at)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.newTicketButton}
          onPress={() => onNavigate?.('contact')}
        >
          <Text style={styles.newTicketButtonText}>+ Create New Ticket</Text>
        </TouchableOpacity>
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
  content: {
    padding: 16,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 12,
  },
  ticketSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  responseIndicator: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  responseIndicatorText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  ticketFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  ticketDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  newTicketButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  newTicketButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});




