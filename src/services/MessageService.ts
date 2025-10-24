import { LocalStorageService } from './LocalStorageService';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
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
      const message: Message = {
        ...messageData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };

      await LocalStorageService.save('messages', message);
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get conversations for a user
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const allMessages = await LocalStorageService.getAll('messages');
      const userMessages = allMessages.filter((message: Message) => 
        message.senderId === userId || message.receiverId === userId
      );

      // Group messages by conversation
      const conversationMap = new Map<string, Message[]>();
      
      userMessages.forEach((message: Message) => {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        const conversationId = [userId, otherUserId].sort().join('-');
        
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

      // Sort by last message time
      return conversations.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
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
      const allMessages = await LocalStorageService.getAll('messages');
      const [userId1, userId2] = conversationId.split('-');
      
      return allMessages.filter((message: Message) => 
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
      const messages = await this.getConversationMessages(conversationId);
      const unreadMessages = messages.filter(m => m.receiverId === userId && !m.read);
      
      for (const message of unreadMessages) {
        message.read = true;
        await LocalStorageService.save('messages', message);
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
      const allMessages = await LocalStorageService.getAll('messages');
      return allMessages.filter((message: Message) => 
        message.receiverId === userId && !message.read
      ).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Create or get conversation between two users
   */
  static async createOrGetConversation(userId1: string, userId2: string, listingId?: string): Promise<{success: boolean, conversation?: any, message?: string}> {
    try {
      const conversationId = [userId1, userId2].sort().join('-');
      
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

      // Create new conversation by sending an initial message
      const initialMessage = {
        conversationId,
        senderId: userId1,
        senderName: 'User',
        receiverId: userId2,
        content: 'Hello! I\'m interested in your farm listing.',
      };

      await this.sendMessage(initialMessage);
      
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
