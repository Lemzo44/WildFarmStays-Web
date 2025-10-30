import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MessageService } from '../services/MessageService';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';

export default function MessagesScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      // Mark messages as read when opening conversation
      if (currentUser) {
        MessageService.markMessagesAsRead(selectedConversation.id, currentUser.id).catch(console.error);
      }
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const conversationList = await MessageService.getUserConversations(currentUser.id);
      
      // Transform to UI format and fetch user names
      const formattedConversations = await Promise.all(
        conversationList.map(async (conv: any) => {
          const otherUserId = conv.participants.find((id: string) => id !== currentUser.id);
          if (!otherUserId) return null;
          
          // Fetch other user's profile
          let otherUser: any = null;
          try {
            if (useSupabase) {
              otherUser = await APIService.getById('profiles', otherUserId);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
          
          const firstName = otherUser?.first_name || otherUser?.firstName || 'User';
          const lastName = otherUser?.last_name || otherUser?.lastName || '';
          const userName = `${firstName} ${lastName}`.trim() || 'User';
          
          // Fetch listing if available (from first message)
          let listingTitle = 'Farm Listing';
          let listingId: string | undefined = undefined;
          try {
            const convMessages = await MessageService.getConversationMessages(conv.id);
            if (convMessages.length > 0) {
              listingId = convMessages[0].listingId;
              if (listingId) {
                const listing = useSupabase
                  ? await APIService.getById('listings', listingId)
                  : null;
                if (listing) {
                  listingTitle = listing.title || listingTitle;
                }
              }
            }
          } catch (error) {
            console.error('Error fetching listing:', error);
          }
          
          return {
            id: conv.id,
            otherUser: {
              id: otherUserId,
              name: userName,
              avatar: otherUser?.role === 'farmer' ? '🚜' : '🏕️'
            },
            listing: {
              id: listingId,
              title: listingTitle
            },
            lastMessage: {
              text: conv.lastMessage,
              timestamp: conv.lastMessageTime
            },
            unreadCount: conv.unreadCount
          };
        })
      );
      
      // Filter out nulls and set conversations
      setConversations(formattedConversations.filter((c: any) => c !== null));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation || !currentUser) return;
    
    try {
      setLoading(true);
      const conversationMessages = await MessageService.getConversationMessages(selectedConversation.id);
      
      // Transform to UI format
      const formattedMessages = conversationMessages.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId,
        text: msg.content,
        timestamp: msg.timestamp
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleConversationSelect = (conversation: any) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedConversation || !currentUser) return;

    try {
      const otherUserId = selectedConversation.otherUser.id;
      const senderName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'User';
      
      // Send message via MessageService
      const sentMessage = await MessageService.sendMessage({
        conversationId: selectedConversation.id,
        senderId: currentUser.id,
        senderName: senderName,
        receiverId: otherUserId,
        content: newMessage.trim(),
        listingId: selectedConversation.listing?.id,
      });
      
      // Add to local state for immediate UI update
      setMessages(prev => [...prev, {
        id: sentMessage.id,
        senderId: sentMessage.senderId,
        text: sentMessage.content,
        timestamp: sentMessage.timestamp
      }]);
      setNewMessage('');
      
      // Reload conversations to update last message
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => handleConversationSelect(item)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.otherUser.avatar || '👤'}</Text>
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationTitleRow}>
            <Text style={styles.conversationTitle}>{item.otherUser.name}</Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.lastMessage.timestamp)}
            </Text>
          </View>
          <Text style={styles.listingTitle}>{item.listing.title}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.text}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadChip}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }: { item: any }) => {
    // Convert both IDs to strings for reliable comparison
    const messageSenderId = String(item.senderId);
    const currentUserId = String(currentUser?.id || '');
    const isOwnMessage = messageSenderId === currentUserId;
    
    console.log('Rendering message:', {
      messageId: item.id,
      messageText: item.text,
      messageSenderId: messageSenderId,
      currentUserId: currentUserId,
      isOwnMessage: isOwnMessage,
      currentUser: currentUser
    });
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage 
            ? { backgroundColor: '#2E7D32' } // Green for own messages
            : { backgroundColor: '#E0E0E0' } // Gray for other messages
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? { color: 'white' } : { color: 'black' }
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: 'rgba(0,0,0,0.5)' }
          ]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  // Chat view
  if (selectedConversation) {
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatTitle}>{selectedConversation.otherUser.name}</Text>
            <Text style={styles.chatSubtitle}>{selectedConversation.listing.title}</Text>
          </View>
        </View>

        <View style={styles.messagesContainer}>
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            showsVerticalScrollIndicator={true}
          />
        </View>

        <View style={styles.messageInput}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, newMessage.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={newMessage.trim() === ''}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main conversations list
  console.log('Rendering MessagesScreen with conversations:', conversations.length);
  console.log('Current user debug:', {
    id: currentUser?.id,
    role: currentUser?.role,
    email: currentUser?.email
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>
          Stay connected with {currentUser?.role === 'farmer' ? 'campers' : 'farmers'}
        </Text>
      </View>

      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          style={styles.conversationsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No conversations found</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📧 Contact Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  conversationsList: {
    flex: 1,
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  listingTitle: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadChip: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
});