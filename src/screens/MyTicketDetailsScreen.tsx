import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { APIService } from '../services/APIService';
import { LocalStorageService } from '../services/LocalStorageService';
import { useSupabase } from '../lib/supabase';

interface MyTicketDetailsScreenProps {
  ticket?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export default function MyTicketDetailsScreen({ ticket, onNavigate }: MyTicketDetailsScreenProps) {
  const [ticketData, setTicketData] = useState(ticket);

  useEffect(() => {
    if (ticket?.id && !ticketData?.message) {
      loadTicketDetails();
    }
  }, [ticket?.id]);

  const loadTicketDetails = async () => {
    if (!ticket?.id) return;
    try {
      if (useSupabase) {
        const details = await APIService.getById('support_tickets', ticket.id);
        if (details) {
          setTicketData({
            ...details,
            userName: details.name || details.userName,
            userEmail: details.email || details.userEmail,
            userId: details.user_id || details.userId,
            createdAt: details.created_at || details.createdAt,
            updatedAt: details.updated_at || details.updatedAt,
          });
        }
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
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

  if (!ticketData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No ticket data available</Text>
      </View>
    );
  }

  // Parse admin responses from admin_notes
  const adminResponses = ticketData.admin_notes 
    ? ticketData.admin_notes.split('--- Admin Response').filter((part: string) => part.trim().length > 0)
    : [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('my-support-tickets')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ticket Details</Text>
        <Text style={styles.subtitle}>Ticket ID: {ticketData.id?.slice(0, 8)}...</Text>
      </View>

      <View style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <Text style={styles.label}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticketData.status || 'open') + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(ticketData.status || 'open') }]}>
              {formatStatus(ticketData.status || 'open')}
            </Text>
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>{ticketData.subject || 'No Subject'}</Text>
          </View>
        </View>

        {/* Your Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Message</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>{ticketData.message}</Text>
          </View>
          <Text style={styles.metaText}>
            Sent on {formatDate(ticketData.createdAt || ticketData.created_at)}
          </Text>
        </View>

        {/* Admin Responses */}
        {adminResponses.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Responses</Text>
            {adminResponses.map((response: string, index: number) => {
              // Extract timestamp if present
              const timestampMatch = response.match(/\(([^)]+)\)/);
              const timestamp = timestampMatch ? timestampMatch[1] : null;
              const responseText = response.replace(/^.*?\)/s, '').trim();
              
              return (
                <View key={index} style={styles.responseCard}>
                  {timestamp && (
                    <Text style={styles.responseTimestamp}>{timestamp}</Text>
                  )}
                  <Text style={styles.responseText}>{responseText}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Responses</Text>
            <View style={styles.noResponseCard}>
              <Text style={styles.noResponseText}>
                No response yet. We'll get back to you soon!
              </Text>
            </View>
          </View>
        )}

        {/* Create New Ticket */}
        <TouchableOpacity 
          style={styles.newTicketButton}
          onPress={() => onNavigate?.('contact')}
        >
          <Text style={styles.newTicketButtonText}>Create New Ticket</Text>
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
  statusSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  responseCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  responseTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  noResponseCard: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  noResponseText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  newTicketButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  newTicketButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

