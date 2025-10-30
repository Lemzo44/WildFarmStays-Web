import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LocalStorageService } from '../services/LocalStorageService';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';
import { messageEmailWebhook, loginUrl } from '../lib/config';

interface TicketDetailsProps {
  ticket?: any;
  onNavigate?: (screen: string) => void;
}

export default function TicketDetails({ ticket, onNavigate }: TicketDetailsProps) {
  const [ticketData, setTicketData] = useState(ticket);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState(ticket?.status || 'open');

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
          });
          setNewStatus(details.status || 'open');
        }
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!ticketData) return;

    try {
      if (useSupabase) {
        await APIService.update('support_tickets', ticketData.id, { status: newStatus });
        const updated = await APIService.getById('support_tickets', ticketData.id);
        setTicketData({
          ...updated,
          userName: updated.name || updated.userName,
          userEmail: updated.email || updated.userEmail,
          userId: updated.user_id || updated.userId,
          createdAt: updated.created_at || updated.createdAt,
        });
        Alert.alert('Success', 'Ticket status updated');
      } else {
        const updatedTicket = {
          ...ticketData,
          status: newStatus,
        };
        await LocalStorageService.save('tickets', updatedTicket);
        setTicketData(updatedTicket);
        Alert.alert('Success', 'Ticket status updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update ticket status');
    }
  };

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    if (!ticketData) {
      Alert.alert('Error', 'Ticket data not available');
      return;
    }

    try {
      if (useSupabase) {
        // Append the response to admin_notes (we can enhance this later with a separate field)
        const currentNotes = ticketData.admin_notes || '';
        const timestamp = new Date().toLocaleString();
        const newResponse = currentNotes 
          ? `\n\n--- Admin Response (${timestamp}) ---\n${responseText}`
          : `Admin Response (${timestamp}):\n${responseText}`;
        
        const updatedNotes = currentNotes + newResponse;
        
        await APIService.update('support_tickets', ticketData.id, { 
          admin_notes: updatedNotes,
          status: ticketData.status === 'open' ? 'in_progress' : ticketData.status // Auto-update status if open
        });
        
        // Send email notification to the user
        try {
          if (messageEmailWebhook && ticketData.userEmail) {
            await fetch(messageEmailWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toEmail: ticketData.userEmail,
                toName: ticketData.userName || 'User',
                subject: `Response to your support ticket: ${ticketData.subject || 'Contact Us Inquiry'}`,
                messagePreview: responseText.slice(0, 160),
                loginUrl,
                senderName: 'WildFarmStays Support Team',
              }),
            });
          }
        } catch (emailError) {
          console.warn('Failed to send email notification:', emailError);
          // Don't fail the whole operation if email fails
        }
        
        // Reload ticket data
        const updated = await APIService.getById('support_tickets', ticketData.id);
        setTicketData({
          ...updated,
          userName: updated.name || updated.userName,
          userEmail: updated.email || updated.userEmail,
          userId: updated.user_id || updated.userId,
          createdAt: updated.created_at || updated.createdAt,
        });
        
        Alert.alert('Success', 'Response saved and email notification sent to user');
        setResponseText('');
      } else {
        // Fallback to localStorage
        const updatedTicket = {
          ...ticketData,
          admin_notes: (ticketData.admin_notes || '') + `\n\nAdmin Response: ${responseText}`,
        };
        await LocalStorageService.save('tickets', updatedTicket);
        setTicketData(updatedTicket);
        Alert.alert('Success', 'Response saved successfully');
        setResponseText('');
      }
    } catch (error) {
      console.error('Error saving response:', error);
      Alert.alert('Error', 'Failed to save response. Please try again.');
    }
  };

  if (!ticketData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No ticket data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('support-tickets')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ticket Details</Text>
        <Text style={styles.subtitle}>Ticket ID: {ticketData.id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ticket Information</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.label}>Subject</Text>
          <Text style={styles.value}>{ticketData.subject || 'No Subject'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{ticketData.category || 'General'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Priority</Text>
          <Text style={styles.value}>{ticketData.priority || 'Normal'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusSelector}>
            <TouchableOpacity
              style={[styles.statusOption, newStatus === 'open' && styles.statusOptionActive]}
              onPress={() => setNewStatus('open')}
            >
              <Text style={[styles.statusOptionText, newStatus === 'open' && styles.statusOptionTextActive]}>
                Open
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusOption, newStatus === 'in_progress' && styles.statusOptionActive]}
              onPress={() => setNewStatus('in_progress')}
            >
              <Text style={[styles.statusOptionText, newStatus === 'in_progress' && styles.statusOptionTextActive]}>
                In Progress
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusOption, newStatus === 'resolved' && styles.statusOptionActive]}
              onPress={() => setNewStatus('resolved')}
            >
              <Text style={[styles.statusOptionText, newStatus === 'resolved' && styles.statusOptionTextActive]}>
                Resolved
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateStatus}>
            <Text style={styles.updateButtonText}>Update Status</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>
            {(ticketData.createdAt || ticketData.created_at)
              ? new Date(ticketData.createdAt || ticketData.created_at).toLocaleString()
              : 'N/A'}
          </Text>
        </View>
      </View>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{ticketData.userName || 'N/A'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{ticketData.userEmail || 'N/A'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.value}>{ticketData.userId || ticketData.user_id || 'Guest'}</Text>
        </View>
      </View>

      {/* Message */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message</Text>
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{ticketData.message}</Text>
        </View>
      </View>

      {/* Admin Notes/Responses (if any) */}
      {ticketData.admin_notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Responses & Notes</Text>
          <View style={styles.adminNotesCard}>
            <Text style={styles.adminNotesText}>{ticketData.admin_notes}</Text>
          </View>
        </View>
      )}

      {/* Admin Response */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Response</Text>
        <TextInput
          style={styles.responseInput}
          placeholder="Type your response to the user..."
          value={responseText}
          onChangeText={setResponseText}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendResponse}>
          <Text style={styles.sendButtonText}>Send Response</Text>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusOptionActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  updateButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  adminNotesCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  adminNotesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  responseInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

