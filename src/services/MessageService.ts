import { LocalStorageService } from './LocalStorageService';
import { APIService } from './APIService';
import { useSupabase } from '../lib/supabase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  listingId?: string; // Optional listing reference
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export class MessageService {
  /**
   * Send a message
   */
  static async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<Message> {
    try {
      if (useSupabase) {
        // Generate conversation_id from participants (consistent with existing logic)
        const conversationId = messageData.conversationId || 
          [messageData.senderId, messageData.receiverId].sort().join('-');
        
        // Map to Supabase schema
        const supabaseMessageData = {
          conversation_id: conversationId, // Store as string for now (schema expects UUID, but we use string format)
          sender_id: messageData.senderId,
          receiver_id: messageData.receiverId,
          listing_id: messageData.listingId || null,
          message_text: messageData.content || '',
          read: false,
        };

        const created = await APIService.create('messages', supabaseMessageData);
        
        return {
          id: created.id,
          conversationId: created.conversation_id || conversationId,
          senderId: created.sender_id || created.senderId,
          senderName: messageData.senderName, // Keep from input
          receiverId: created.receiver_id || created.receiverId,
          content: created.message_text || created.content || '',
          timestamp: created.created_at || created.timestamp || new Date().toISOString(),
          read: created.read || false,
          listingId: created.listing_id || created.listingId,
        };
      } else {
        // Fallback to localStorage
        const message: Message = {
          ...messageData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
        };

        await LocalStorageService.save('messages', message);
        return message;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Generate a consistent conversation ID from two user IDs
   */
  private static generateConversationId(userId1: string, userId2: string): string {
    // Sort IDs and join to create consistent conversation ID
    return [userId1, userId2].sort().join('-');
  }

  /**
   * Get conversations for a user
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      if (useSupabase) {
        // Fetch all messages where user is sender or receiver
        const sentMessages = await APIService.get('messages', {
          filter: { column: 'sender_id', operator: 'eq', value: userId },
          orderBy: { column: 'created_at', ascending: false }
        });
        
        const receivedMessages = await APIService.get('messages', {
          filter: { column: 'receiver_id', operator: 'eq', value: userId },
          orderBy: { column: 'created_at', ascending: false }
        });

        // Combine and normalize
        const allMessages: Message[] = [
          ...sentMessages.map((m: any) => ({
            id: m.id,
            conversationId: m.conversation_id || this.generateConversationId(m.sender_id, m.receiver_id),
            senderId: m.sender_id || m.senderId,
            senderName: 'User', // TODO: Fetch from profiles
            receiverId: m.receiver_id || m.receiverId,
            content: m.message_text || m.content || '',
            timestamp: m.created_at || m.timestamp || '',
            read: m.read || false,
            listingId: m.listing_id || m.listingId,
          })),
          ...receivedMessages.map((m: any) => ({
            id: m.id,
            conversationId: m.conversation_id || this.generateConversationId(m.sender_id, m.receiver_id),
            senderId: m.sender_id || m.senderId,
            senderName: 'User',
            receiverId: m.receiver_id || m.receiverId,
            content: m.message_text || m.content || '',
            timestamp: m.created_at || m.timestamp || '',
            read: m.read || false,
            listingId: m.listing_id || m.listingId,
          }))
        ];

        // Group by conversation
        const conversationMap = new Map<string, Message[]>();
        
        allMessages.forEach((message: Message) => {
          const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
          const conversationId = this.generateConversationId(userId, otherUserId);
          
          if (!conversationMap.has(conversationId)) {
            conversationMap.set(conversationId, []);
          }
          conversationMap.get(conversationId)!.push(message);
        });

        // Convert to conversation objects
        const conversations: Conversation[] = [];
        
        conversationMap.forEach((messages, conversationId) => {
          const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          const lastMessage = sortedMessages[sortedMessages.length - 1];
          const unreadCount = messages.filter(m => 
            m.receiverId === userId && !m.read
          ).length;

          conversations.push({
            id: conversationId,
            participants: [userId, lastMessage.senderId === userId ? lastMessage.receiverId : lastMessage.senderId],
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.timestamp,
            unreadCount
          });
        });

        return conversations.sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
      } else {
        const allMessages = await LocalStorageService.getAll('messages');
        const userMessages = allMessages.filter((message: Message) => 
          message.senderId === userId || message.receiverId === userId
        );

        // Group messages by conversation
        const conversationMap = new Map<string, Message[]>();
        
        userMessages.forEach((message: Message) => {
          const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
          const conversationId = this.generateConversationId(userId, otherUserId);
          
          if (!conversationMap.has(conversationId)) {
            conversationMap.set(conversationId, []);
          }
          conversationMap.get(conversationId)!.push(message);
        });

        // Convert to conversation objects
        const conversations: Conversation[] = [];
        
        conversationMap.forEach((messages, conversationId) => {
          const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          const lastMessage = sortedMessages[sortedMessages.length - 1];
          const unreadCount = messages.filter(m => 
            m.receiverId === userId && !m.read
          ).length;

          conversations.push({
            id: conversationId,
            participants: [userId, lastMessage.senderId === userId ? lastMessage.receiverId : lastMessage.senderId],
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.timestamp,
            unreadCount
          });
        });

        return conversations.sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
      }
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new Error('Failed to get user conversations');
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      if (useSupabase) {
        // Fetch messages where conversation_id matches
        // Note: conversation_id in DB might be UUID or string - try to find by participants
        const [userId1, userId2] = conversationId.split('-');
        
        // Get messages between these two users
        const allMessages = await APIService.get('messages', {
          orderBy: { column: 'created_at', ascending: true }
        });
        
        // Filter messages between these two users
        const conversationMessages = allMessages.filter((m: any) => {
          const sender = m.sender_id || m.senderId;
          const receiver = m.receiver_id || m.receiverId;
          return (
            (sender === userId1 && receiver === userId2) ||
            (sender === userId2 && receiver === userId1) ||
            m.conversation_id === conversationId
          );
        });
        
        return conversationMessages.map((m: any) => ({
          id: m.id,
          conversationId: m.conversation_id || conversationId,
          senderId: m.sender_id || m.senderId,
          senderName: 'User', // TODO: Fetch from profiles
          receiverId: m.receiver_id || m.receiverId,
          content: m.message_text || m.content || '',
          timestamp: m.created_at || m.timestamp || '',
          read: m.read || false,
          listingId: m.listing_id || m.listingId,
        }));
      } else {
        const allMessages = await LocalStorageService.getAll('messages');
        const [userId1, userId2] = conversationId.split('-');
        
        return allMessages.filter((message: Message) => 
          (message.senderId === userId1 && message.receiverId === userId2) ||
          (message.senderId === userId2 && message.receiverId === userId1)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw new Error('Failed to get conversation messages');
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      if (useSupabase) {
        const messages = await this.getConversationMessages(conversationId);
        const unreadMessages = messages.filter(m => (m.receiverId || m.receiver_id) === userId && !m.read);
        
        // Update each unread message
        for (const message of unreadMessages) {
          await APIService.update('messages', message.id, { read: true });
        }
      } else {
        const messages = await this.getConversationMessages(conversationId);
        const unreadMessages = messages.filter(m => m.receiverId === userId && !m.read);
        
        for (const message of unreadMessages) {
          message.read = true;
          await LocalStorageService.save('messages', message);
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      if (useSupabase) {
        const messages = await APIService.get('messages', {
          filter: { column: 'receiver_id', operator: 'eq', value: userId }
        });
        
        return messages.filter((m: any) => !m.read).length;
      } else {
        const allMessages = await LocalStorageService.getAll('messages');
        return allMessages.filter((message: Message) => 
          message.receiverId === userId && !message.read
        ).length;
      }
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get messages for a conversation (alias method for consistency)
   */
  static async getMessagesForConversation(conversationId: string): Promise<Message[]> {
    return this.getConversationMessages(conversationId);
  }

  /**
   * Create or get conversation between two users
   */
  static async createOrGetConversation(userId1: string, userId2: string, listingId?: string): Promise<{success: boolean, conversation?: any, message?: string}> {
    try {
      const conversationId = this.generateConversationId(userId1, userId2);
      
      // Check if conversation already exists
      const existingMessages = await this.getConversationMessages(conversationId);
      
      if (existingMessages.length > 0) {
        return { 
          success: true, 
          conversation: { 
            id: conversationId, 
            participants: [userId1, userId2],
            listingId 
          } 
        };
      }

      // Create new conversation by sending an initial message (optional - can be skipped)
      // For now, just return the conversation ID
      return { 
        success: true, 
        conversation: { 
          id: conversationId, 
          participants: [userId1, userId2],
          listingId 
        } 
      };
    } catch (error) {
      console.error('Error creating or getting conversation:', error);
      return { success: false, message: 'Failed to create conversation' };
    }
  }
}
