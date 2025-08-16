import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Request } from 'express';
import { log } from './vite';
import { parse } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Chat message type
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  chatId: string;
  content: string;
  timestamp: Date;
}

// Live chat session
interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  preferredLanguage: string;
  isActive: boolean;
  startTime: Date;
  lastMessageTime: Date;
  messages: ChatMessage[];
  adminId?: string;
  adminName?: string;
}

// Connection type - either a user or an admin
interface Connection {
  ws: WebSocket;
  id: string;
  type: 'user' | 'admin';
  name: string;
  chatId?: string;
}

// Chat server to manage all connections and sessions
export class ChatServer {
  private wss: WebSocketServer;
  private connections: Map<string, Connection> = new Map();
  private sessions: Map<string, ChatSession> = new Map();
  private adminConnections: Set<string> = new Set();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ 
      noServer: true,
      path: '/api/chat' 
    });

    // Handle upgrade (initial WebSocket connection)
    server.on('upgrade', (request: Request, socket, head) => {
      const { pathname, query } = parse(request.url || '', true);
      
      if (pathname === '/api/chat') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, query);
        });
      }
    });

    // Handle new connections
    this.wss.on('connection', (ws: WebSocket, request: Request, query: any) => {
      const type = query.type as 'user' | 'admin';
      const id = type === 'admin' ? query.adminId : query.userId;
      const name = query.name || 'Anonymous';
      
      if (!id) {
        ws.close(1008, 'Missing ID');
        return;
      }

      const connectionId = uuidv4();
      const connection: Connection = { ws, id, type, name };
      this.connections.set(connectionId, connection);
      
      log(`New ${type} connection: ${name} (${id})`, 'chat');

      // Handle admin connection
      if (type === 'admin') {
        this.adminConnections.add(connectionId);
        // Send list of active sessions to admin
        this.sendActiveSessions(connectionId);
      }

      // Handle messages from clients
      ws.on('message', (messageData) => {
        try {
          const message = JSON.parse(messageData.toString());
          this.handleMessage(connectionId, message);
        } catch (error) {
          log(`Error parsing message: ${error}`, 'chat-error');
        }
      });

      // Handle disconnections
      ws.on('close', () => {
        this.handleDisconnect(connectionId);
      });

      // Send initial confirmation of connection
      this.sendToConnection(connectionId, {
        type: 'connection_established',
        connectionId
      });
    });
  }

  // Send active chat sessions to admin
  private sendActiveSessions(adminConnectionId: string) {
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => session.isActive)
      .map(session => ({
        id: session.id,
        userId: session.userId,
        userName: session.userName,
        userPhone: session.userPhone,
        preferredLanguage: session.preferredLanguage,
        startTime: session.startTime,
        lastMessageTime: session.lastMessageTime,
        hasAdmin: !!session.adminId,
        adminName: session.adminName,
        messageCount: session.messages.length
      }));
    
    this.sendToConnection(adminConnectionId, {
      type: 'active_sessions',
      sessions: activeSessions
    });
  }

  // Handle incoming messages
  private handleMessage(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'start_chat':
        this.handleStartChat(connectionId, message);
        break;
      
      case 'join_chat':
        this.handleJoinChat(connectionId, message);
        break;
      
      case 'message':
        this.handleChatMessage(connectionId, message);
        break;
      
      case 'typing':
        this.handleTypingIndicator(connectionId, message);
        break;
      
      case 'end_chat':
        this.handleEndChat(connectionId, message);
        break;
    }
  }
  
  // Handle typing indicator
  private handleTypingIndicator(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const chatId = message.chatId || connection.chatId;
    if (!chatId) return;

    const session = this.sessions.get(chatId);
    if (!session) return;

    // Notify other participants that this user is typing
    this.sendToSessionParticipants(chatId, {
      type: 'typing_indicator',
      isTyping: message.isTyping,
      userId: connection.id,
      userName: connection.name,
      userType: connection.type
    }, [connectionId]); // Exclude the user who is typing
  }

  // Start a new chat session (from user)
  private handleStartChat(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.type !== 'user') return;

    // Create a new chat session
    const chatId = uuidv4();
    const session: ChatSession = {
      id: chatId,
      userId: connection.id,
      userName: message.userName || connection.name,
      userPhone: message.userPhone || 'Not provided',
      preferredLanguage: message.preferredLanguage || 'en',
      isActive: true,
      startTime: new Date(),
      lastMessageTime: new Date(),
      messages: []
    };

    this.sessions.set(chatId, session);
    connection.chatId = chatId;

    // Send confirmation to user
    this.sendToConnection(connectionId, {
      type: 'chat_started',
      chatId
    });

    // Notify all admins of new chat
    this.notifyAdmins({
      type: 'new_chat',
      session: {
        id: session.id,
        userId: session.userId,
        userName: session.userName,
        userPhone: session.userPhone,
        preferredLanguage: session.preferredLanguage,
        startTime: session.startTime,
        hasAdmin: false,
        messageCount: 0
      }
    });

    log(`New chat session started: ${chatId} by ${connection.name}`, 'chat');
  }

  // Admin joining a chat
  private handleJoinChat(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.type !== 'admin') return;

    const { chatId } = message;
    const session = this.sessions.get(chatId);
    
    if (!session) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Chat session not found'
      });
      return;
    }

    // Check if this admin is already assigned to this chat
    const isNewAdmin = session.adminId !== connection.id;
    
    // Update session with admin info
    session.adminId = connection.id;
    session.adminName = connection.name;
    connection.chatId = chatId;

    // Send chat history to admin
    this.sendToConnection(connectionId, {
      type: 'chat_joined',
      chatId,
      history: session.messages,
      userInfo: {
        name: session.userName,
        phone: session.userPhone,
        preferredLanguage: session.preferredLanguage
      }
    });

    // Only notify user if this is a new admin joining for the first time
    if (isNewAdmin) {
      this.sendToSessionParticipants(chatId, {
        type: 'admin_joined',
        adminName: connection.name
      }, [connectionId]); // Exclude the admin who just joined
    }

    log(`Admin ${connection.name} joined chat ${chatId}`, 'chat');
  }

  // Handle chat message
  private handleChatMessage(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const chatId = message.chatId || connection.chatId;
    if (!chatId) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'No active chat session'
      });
      return;
    }

    const session = this.sessions.get(chatId);
    if (!session) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Chat session not found'
      });
      return;
    }

    // Create chat message
    const chatMessage: ChatMessage = {
      id: uuidv4(),
      senderId: connection.id,
      senderName: connection.name,
      senderType: connection.type,
      chatId,
      content: message.content,
      timestamp: new Date()
    };

    // Update session
    session.messages.push(chatMessage);
    session.lastMessageTime = chatMessage.timestamp;

    // Send message to all participants
    this.sendToSessionParticipants(chatId, {
      type: 'chat_message',
      message: chatMessage
    });

    // If message is from user and no admin assigned, notify admins
    if (connection.type === 'user' && !session.adminId) {
      this.notifyAdmins({
        type: 'unassigned_message',
        chatId,
        userName: session.userName,
        message: chatMessage.content
      });
    }

    log(`New message in chat ${chatId} from ${connection.name}: ${message.content.substring(0, 30)}...`, 'chat');
  }

  // End a chat session
  private handleEndChat(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const chatId = message.chatId || connection.chatId;
    if (!chatId) return;

    const session = this.sessions.get(chatId);
    if (!session) return;

    // Mark session as inactive
    session.isActive = false;

    // Notify all participants
    this.sendToSessionParticipants(chatId, {
      type: 'chat_ended',
      endedBy: connection.type,
      endedByName: connection.name
    });

    // Clear chat ID from connections
    this.connections.forEach(conn => {
      if (conn.chatId === chatId) {
        conn.chatId = undefined;
      }
    });

    // Notify all admins to update their list
    this.notifyAdmins({
      type: 'chat_ended',
      chatId
    });

    log(`Chat session ${chatId} ended by ${connection.name}`, 'chat');
  }

  // Handle client disconnection
  private handleDisconnect(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    log(`${connection.type} disconnected: ${connection.name}`, 'chat');

    // If admin, remove from admin connections
    if (connection.type === 'admin') {
      this.adminConnections.delete(connectionId);
    }

    // If in a chat, notify other participants
    if (connection.chatId) {
      const session = this.sessions.get(connection.chatId);
      if (session) {
        this.sendToSessionParticipants(connection.chatId, {
          type: 'participant_disconnected',
          participantType: connection.type,
          participantName: connection.name
        }, [connectionId]); // Exclude the disconnected client

        // If admin disconnected, clear admin from session
        if (connection.type === 'admin' && session.adminId === connection.id) {
          session.adminId = undefined;
          session.adminName = undefined;
        }
      }
    }

    // Remove connection
    this.connections.delete(connectionId);
  }

  // Send message to a specific connection
  private sendToConnection(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      connection.ws.send(JSON.stringify(message));
    } catch (error) {
      log(`Error sending message to connection ${connectionId}: ${error}`, 'chat-error');
    }
  }

  // Send message to all participants in a chat session
  private sendToSessionParticipants(chatId: string, message: any, excludeConnectionIds: string[] = []) {
    this.connections.forEach((connection, id) => {
      if (connection.chatId === chatId && !excludeConnectionIds.includes(id)) {
        this.sendToConnection(id, message);
      }
    });
  }

  // Notify all admin connections
  private notifyAdmins(message: any) {
    this.adminConnections.forEach(adminId => {
      this.sendToConnection(adminId, message);
    });
  }
}

export default ChatServer;