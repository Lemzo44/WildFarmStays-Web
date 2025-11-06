import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { APIService } from '../services/APIService';
import { LocalStorageService } from '../services/LocalStorageService';
import { useSupabase } from '../lib/supabase';

interface MyTicketDetailsScreenProps {
  ticket?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export default function MyTicketDetailsScreen({ ticket, onNavigate }: MyTicketDetailsScreenProps) {
  const [ticketData, setTicketData] = useState(ticket);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

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

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply message');
      return;
    }

    if (!ticketData) {
      Alert.alert('Error', 'Ticket data not available');
      return;
    }

    setIsSendingReply(true);

    try {
      if (useSupabase) {
        // Append the user reply to admin_notes
        const currentNotes = ticketData.admin_notes || '';
        const timestamp = new Date().toLocaleString();
        const newReply = currentNotes 
          ? `\n\n--- User Reply (${timestamp}) ---\n${replyText}`
          : `--- User Reply (${timestamp}) ---\n${replyText}`;
        
        const updatedNotes = currentNotes + newReply;
        
        await APIService.update('support_tickets', ticketData.id, { 
          admin_notes: updatedNotes,
          status: ticketData.status === 'resolved' || ticketData.status === 'closed' 
            ? 'in_progress' 
            : ticketData.status // Reopen if closed/resolved
        });
        
        // Reload ticket data
        const updated = await APIService.getById('support_tickets', ticketData.id);
        setTicketData({
          ...updated,
          userName: updated.name || updated.userName,
          userEmail: updated.email || updated.userEmail,
          userId: updated.user_id || updated.userId,
          createdAt: updated.created_at || updated.createdAt,
          updatedAt: updated.updated_at || updated.updatedAt,
        });
        
        Alert.alert('Success', 'Your reply has been sent');
        setReplyText('');
      } else {
        // Fallback to localStorage
        const updatedTicket = {
          ...ticketData,
          admin_notes: (ticketData.admin_notes || '') + `\n\nUser Reply: ${replyText}`,
        };
        await LocalStorageService.save('tickets', updatedTicket);
        setTicketData(updatedTicket);
        Alert.alert('Success', 'Your reply has been sent');
        setReplyText('');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!ticketData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No ticket data available</Text>
      </View>
    );
  }

  // Parse conversation from admin_notes - both admin responses and user replies
  const parseConversation = () => {
    if (!ticketData.admin_notes) return [];
    
    const conversation: Array<{ type: 'admin' | 'user'; timestamp: string | null; text: string }> = [];
    
    // Handle both formats:
    // 1. "Admin Response (timestamp):\ntext" (first response, no dashes)
    // 2. "--- Admin Response (timestamp) ---\ntext" (subsequent responses)
    // 3. "--- User Reply (timestamp) ---\ntext" (user replies)
    
    const notes = ticketData.admin_notes;
    
    // First, check if it starts with "Admin Response" (first format without dashes)
    if (notes.trim().startsWith('Admin Response')) {
      const firstMatch = notes.match(/^Admin Response\s*\(([^)]+)\)\s*:\s*(.+?)(?=\n\n---|$)/s);
      if (firstMatch) {
        conversation.push({
          type: 'admin',
          timestamp: firstMatch[1],
          text: firstMatch[2].trim()
        });
      }
    }
    
    // Then split by "--- Admin Response" or "--- User Reply" for subsequent messages
    const parts = notes.split(/--- (Admin Response|User Reply)/);
    
    for (let i = 1; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        const typeLabel = parts[i].trim(); // "Admin Response" or "User Reply"
        const content = parts[i + 1].trim();
        
        if (content) {
          const timestampMatch = content.match(/\(([^)]+)\)/);
          const timestamp = timestampMatch ? timestampMatch[1] : null;
          // Extract text after timestamp, handling both "---" separator and ":"
          let text = content.replace(/^[^)]*\)\s*[-:]*\s*/s, '').trim();
          // If no timestamp found, use the whole content as text
          if (!timestampMatch) {
            text = content.replace(/^[-:]*\s*/s, '').trim();
          }
          
          const type = typeLabel.includes('Admin Response') ? 'admin' : 'user';
          
          if (text) {
            conversation.push({ type, timestamp, text });
          }
        }
      }
    }
    
    return conversation;
  };

  const conversation = parseConversation();

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

        {/* Conversation Thread */}
        {conversation.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conversation</Text>
            {conversation.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.responseCard, 
                  item.type === 'user' && styles.userReplyCard
                ]}
              >
                <View style={styles.responseHeader}>
                  <Text style={styles.responseLabel}>
                    {item.type === 'admin' ? '👤 Admin' : '✉️ You'}
                  </Text>
                  {item.timestamp && (
                    <Text style={styles.responseTimestamp}>{item.timestamp}</Text>
                  )}
                </View>
                <Text style={styles.responseText}>{item.text}</Text>
              </View>
            ))}
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

        {/* Reply Input - Only show if ticket is not closed or resolved */}
        {ticketData.status !== 'closed' && ticketData.status !== 'resolved' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reply to Admin</Text>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply here..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity 
              style={[styles.sendReplyButton, isSendingReply && styles.sendReplyButtonDisabled]}
              onPress={handleSendReply}
              disabled={isSendingReply}
            >
              <Text style={styles.sendReplyButtonText}>
                {isSendingReply ? 'Sending...' : 'Send Reply'}
              </Text>
            </TouchableOpacity>
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
  userReplyCard: {
    backgroundColor: '#E8F5E8',
    borderLeftColor: '#2E7D32',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  responseTimestamp: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  replyInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
    marginBottom: 12,
    fontSize: 14,
  },
  sendReplyButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendReplyButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.6,
  },
  sendReplyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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

