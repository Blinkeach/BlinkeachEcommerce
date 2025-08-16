import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MessageSquare, PhoneCall, Send, UserCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  preferredLanguage: string;
  startTime: Date;
  lastMessageTime: Date;
  hasAdmin: boolean;
  adminName?: string;
  messageCount: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  chatId: string;
  content: string;
  timestamp: Date | string;
}

const LiveChatPanel: React.FC = () => {
  const { toast } = useToast();
  const { decrementLiveChatCount, incrementLiveChatCount } = useAdminNotifications();
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // State
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userInfo, setUserInfo] = useState<{ name: string; phone: string; preferredLanguage: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to WebSocket
  useEffect(() => {
    if (!connected && !connecting) {
      connectWebSocket();
    }
    
    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  // Scroll to bottom when new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // State for controlling which tab is active
  const [activeTab, setActiveTab] = useState('chats');
  
  const connectWebSocket = () => {
    setConnecting(true);
    
    // Get the current admin user info
    const adminId = '1'; // Replace with actual admin ID
    const adminName = 'Admin Support'; // Replace with actual admin name
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/chat?type=admin&adminId=${adminId}&name=${encodeURIComponent(adminName)}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setConnecting(false);
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event);
      setConnected(false);
      setConnecting(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!connected) {
          connectWebSocket();
        }
      }, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
      setConnecting(false);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  };
  
  const handleWebSocketMessage = (data: any) => {
    console.log('WebSocket message:', data);
    console.log('Current selected chat ID:', selectedChatId);
    
    switch (data.type) {
      case 'connection_established':
        toast({
          title: 'Connected to chat server',
          description: 'You can now chat with customers',
          duration: 3000
        });
        
        // Reset to the 'chats' tab when connection is established or re-established
        setActiveTab('chats');
        
        // If there's no selected chat, clear any previous messages
        if (!selectedChatId) {
          setMessages([]);
        }
        break;
        
      case 'active_sessions':
        setSessions(data.sessions);
        break;
        
      case 'new_chat':
        setSessions(prev => [data.session, ...prev]);
        toast({
          title: 'New chat request',
          description: `New chat from ${data.session.userName}`,
          duration: 5000
        });
        break;
        
      case 'chat_joined':
        console.log('Chat joined received with history:', data.history);
        console.log('Chat ID from joined event:', data.chatId);
        
        // Make sure we set the selectedChatId first, then update the messages
        setSelectedChatId(data.chatId);
        
        // Now handle the history/messages
        if (data.history && Array.isArray(data.history)) {
          console.log('Setting messages array with length:', data.history.length);
          setMessages(data.history);
        } else {
          console.warn('No message history received or invalid format');
          setMessages([]);
        }
        
        // Set user info and loading state
        setUserInfo(data.userInfo);
        setIsLoading(false);
        
        // Automatically switch to the chat tab when chat is joined
        setActiveTab('chat');
        break;
        
      case 'typing_indicator':
        // Only handle typing indicators for the selected chat
        if (data.userId && data.chatId === selectedChatId && data.userType === 'user') {
          // If user started/stopped typing
          setIsUserTyping(data.isTyping);
          
          // Clear any previous timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          // Auto-clear typing indicator after 5 seconds as a fallback
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsUserTyping(false);
            }, 5000);
          }
        }
        break;
      
      case 'chat_message':
        console.log('Chat message received:', data.message);
        console.log('Selected chat ID:', selectedChatId);
        console.log('Message chat ID:', data.message.chatId);
        
        // If this is the first message and no chat is selected, 
        // automatically join the chat and select it
        if (!selectedChatId && data.message.senderType === 'user') {
          console.log('No chat selected, auto-joining chat:', data.message.chatId);
          
          // Set the selected chat ID
          setSelectedChatId(data.message.chatId);
          
          // Switch to the chat tab
          setActiveTab('chat');
          
          // Fetch chat history by joining the chat
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'join_chat',
              chatId: data.message.chatId
            }));
          }
          
          // This will now be handled by the chat_joined event
          return;
        }
        
        // Always update the sessions list regardless of which chat is selected
        setSessions(prev => {
          console.log('Current sessions:', prev);
          return prev.map(session => 
            session.id === data.message.chatId 
              ? { 
                  ...session, 
                  lastMessageTime: data.message.timestamp, 
                  messageCount: session.messageCount + 1 
                }
              : session
          );
        });
        
        // Handle message display if it's for the selected chat
        if (data.message.chatId === selectedChatId) {
          console.log('Updating messages with new message for active chat');
          
          // Clear typing indicator when receiving a message from the user
          if (data.message.senderType === 'user') {
            setIsUserTyping(false);
          }
          
          // Add the new message to the messages array
          setMessages(prev => {
            console.log('Current messages before update:', prev);
            console.log('Adding new message:', data.message);
            return [...prev, data.message];
          });
          
          // Decrement notification count for user messages in the selected chat
          if (data.message.senderType === 'user') {
            decrementLiveChatCount(1);
          }
        } else {
          console.log('Message is for a different chat than the currently selected one');
          // Increment notification count for messages in other chats
          if (data.message.senderType === 'user') {
            incrementLiveChatCount(1);
          }
        }
        
        // We've already handled this in the logic above
        break;
        
      case 'chat_ended':
        // Remove from active sessions
        setSessions(prev => prev.filter(session => session.id !== data.chatId));
        
        if (selectedChatId === data.chatId) {
          setSelectedChatId(null);
          setMessages([]);
          setUserInfo(null);
          
          toast({
            title: 'Chat ended',
            description: 'The chat session has ended',
            duration: 3000
          });
        }
        break;
        
      case 'participant_disconnected':
        if (data.participantType === 'user' && selectedChatId) {
          toast({
            title: 'User disconnected',
            description: `${data.participantName} has disconnected`,
            variant: 'destructive',
            duration: 5000
          });
        }
        break;
        
      case 'error':
        toast({
          title: 'Chat Error',
          description: data.message,
          variant: 'destructive',
          duration: 5000
        });
        break;
    }
  };
  
  const joinChat = (chatId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to chat server. Trying to reconnect...',
        variant: 'destructive',
        duration: 3000
      });
      connectWebSocket();
      return;
    }
    
    console.log('Joining chat with ID:', chatId);
    setIsLoading(true);
    
    // Clear current messages
    setMessages([]);
    
    // First update the selectedChatId to ensure it's set
    // before any websocket messages are processed
    setSelectedChatId(chatId);
    
    // Switch to chat tab immediately when joining
    setActiveTab('chat');
    
    // Send join message
    wsRef.current.send(JSON.stringify({
      type: 'join_chat',
      chatId
    }));
    
    // Update local sessions data
    setSessions(prev => prev.map(session => 
      session.id === chatId 
        ? { ...session, hasAdmin: true }
        : session
    ));
    
    // Decrement notification count when admin joins a chat
    decrementLiveChatCount(1);
    
    setIsLoading(false);
  };
  
  // Send typing indicator
  const sendTypingIndicator = (isTyping: boolean) => {
    if (!selectedChatId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      chatId: selectedChatId,
      isTyping
    }));
  };
  
  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current) return;
    
    if (!selectedChatId) {
      toast({
        title: 'No chat selected',
        description: 'Please select a chat before sending a message',
        variant: 'destructive',
        duration: 3000
      });
      return;
    }
    
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to chat server',
        variant: 'destructive',
        duration: 3000
      });
      return;
    }
    
    // Send message via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'message',
      chatId: selectedChatId,
      content: newMessage
    }));
    
    // Clear typing indicator
    sendTypingIndicator(false);
    
    // Clear input
    setNewMessage('');
    
    // If we have very few messages, add this message to the local state immediately
    // to provide immediate feedback to the admin
    const messageObj: ChatMessage = {
      id: `local-${Date.now()}`,
      senderId: '1', // admin ID
      senderName: 'Admin Support',
      senderType: 'admin',
      chatId: selectedChatId,
      content: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, messageObj]);
  };
  
  const endChat = () => {
    if (!selectedChatId || !wsRef.current) return;
    
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to chat server',
        variant: 'destructive',
        duration: 3000
      });
      return;
    }
    
    // Send end chat message
    wsRef.current.send(JSON.stringify({
      type: 'end_chat',
      chatId: selectedChatId
    }));
  };
  
  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <Card className="w-full h-[calc(100vh-13rem)] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          Live Chat
          {connecting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          {!connected && !connecting && (
            <Badge variant="destructive" className="ml-2">Disconnected</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="chats" className="flex-1">Active Chats</TabsTrigger>
              <TabsTrigger value="chat" className="flex-1" disabled={!selectedChatId}>Current Chat</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="chats" className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active chat sessions
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 border rounded-md hover:bg-accent/10 cursor-pointer transition-colors ${
                        selectedChatId === session.id ? 'bg-accent/20 border-accent' : ''
                      }`}
                      onClick={() => joinChat(session.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback>{session.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{session.userName}</h4>
                            <p className="text-xs text-muted-foreground">
                              <PhoneCall className="inline h-3 w-3 mr-1" />
                              {session.userPhone}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {formatTime(session.lastMessageTime)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(session.startTime)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-2">
                        <Badge variant={session.preferredLanguage === 'en' ? 'outline' : 'secondary'} className="text-xs">
                          {session.preferredLanguage === 'en' ? 'English' : 'Hindi'}
                        </Badge>
                        
                        {session.hasAdmin ? (
                          <Badge variant="outline" className="text-xs flex items-center">
                            <UserCheck className="h-3 w-3 mr-1" />
                            {session.adminName || 'Assigned'}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Unassigned</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="chat" className="flex-1 min-h-0 flex flex-col">
            {selectedChatId ? (
              <>
                <div className="px-6 py-2 border-b flex justify-between items-center">
                  {userInfo && (
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>{userInfo.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{userInfo.name}</h4>
                        <p className="text-xs text-muted-foreground">{userInfo.phone}</p>
                      </div>
                      <Badge variant={userInfo.preferredLanguage === 'en' ? 'outline' : 'secondary'} className="ml-2 text-xs">
                        {userInfo.preferredLanguage === 'en' ? 'English' : 'Hindi'}
                      </Badge>
                    </div>
                  )}
                  
                  <Button variant="destructive" size="sm" onClick={endChat}>
                    End Chat
                  </Button>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.senderType === 'admin'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="text-sm mb-1">{msg.content}</div>
                            <div className="text-xs opacity-70 text-right">
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* User typing indicator */}
                    {isUserTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t mt-auto">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        
                        // Only send typing indicator if in active chat
                        if (selectedChatId) {
                          // Clear any existing timeout
                          if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                          }
                          
                          // Send typing = true
                          sendTypingIndicator(true);
                          
                          // Set timeout to send typing = false after 3 seconds of inactivity
                          typingTimeoutRef.current = setTimeout(() => {
                            sendTypingIndicator(false);
                          }, 3000);
                        }
                      }}
                      placeholder="Type your message..."
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium">No chat selected</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a chat from the list to start responding
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LiveChatPanel;