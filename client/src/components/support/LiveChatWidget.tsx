import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Smile, 
  Phone, 
  Mail, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

// Define types for messages
interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  message: string;
  timestamp: Date;
}

interface CallbackRequest {
  name: string;
  phone: string;
  preferredLanguage: 'english' | 'hindi';
  email: string;
  notes: string;
}

// Check if current time is within live chat hours (Mon-Sat, 10am-6pm)
const isWithinBusinessHours = (): boolean => {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const hours = now.getHours();
  
  // Only available Monday to Saturday (day 1-6)
  if (day === 0) return false;
  
  // 10 AM to 6 PM (10-18)
  return hours >= 10 && hours < 18;
};

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isAgentAvailable, setIsAgentAvailable] = useState(isWithinBusinessHours());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [callbackForm, setCallbackForm] = useState<CallbackRequest>({
    name: '',
    phone: '',
    preferredLanguage: 'english',
    email: '',
    notes: ''
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<string>(isAgentAvailable ? 'chat' : 'email');
  const [isCallbackDialogOpen, setIsCallbackDialogOpen] = useState(false);
  const [isChatbotActive, setIsChatbotActive] = useState(false);
  const [isConnectingToWebSocket, setIsConnectingToWebSocket] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  
  // Prefill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setCallbackForm(prev => ({
        ...prev,
        name: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);
  
  // Check business hours every minute
  useEffect(() => {
    const checkBusinessHours = () => {
      setIsAgentAvailable(isWithinBusinessHours());
    };
    
    const interval = setInterval(checkBusinessHours, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      let initialMessages: ChatMessage[] = [
        {
          id: '1',
          sender: 'system',
          message: 'Welcome to Blinkeach Customer Support!',
          timestamp: new Date()
        }
      ];
      
      if (isChatbotActive) {
        initialMessages.push({
          id: '2',
          sender: 'system',
          message: 'I am your virtual assistant. How can I help you today?',
          timestamp: new Date()
        });
      } else if (isAgentAvailable) {
        initialMessages.push({
          id: '2',
          sender: 'system',
          message: 'Our customer support agents are available to help you. How may we assist you today?',
          timestamp: new Date()
        });
      } else {
        initialMessages.push({
          id: '2',
          sender: 'system',
          message: 'Our live chat agents are currently offline. Live chat is available Monday to Saturday, 10:00 AM to 6:00 PM IST. You can leave an email or request a callback.',
          timestamp: new Date()
        });
      }
      
      setMessages(initialMessages);
    }
  }, [isChatbotActive, isAgentAvailable]);
  
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // If chatbot is active, use the chatbot message handler
    if (isChatbotActive) {
      handleChatbotMessage(inputMessage);
      return;
    }
    
    // If we have WebSocket available and it's within business hours
    if (isAgentAvailable) {
      // If we don't have a WebSocket connection, establish one
      if (!isWebSocketConnected && !isConnectingToWebSocket) {
        // Add user message to display while connecting
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          message: inputMessage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Save the message to send after connection
        const messageToSend = inputMessage;
        setInputMessage('');
        
        // Connect WebSocket
        setIsWaitingForAgent(true);
        connectToWebSocket();
        
        // Wait for connection and chat start, then send message
        const checkAndSendInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN && chatSessionId) {
            wsRef.current.send(JSON.stringify({
              type: 'message',
              chatId: chatSessionId,
              content: messageToSend
            }));
            clearInterval(checkAndSendInterval);
            setIsWaitingForAgent(false);
          }
        }, 500);
        
        // Clear interval after 10 seconds if not connected
        setTimeout(() => {
          clearInterval(checkAndSendInterval);
          if (isWaitingForAgent) {
            setIsWaitingForAgent(false);
            const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              sender: 'system',
              message: 'Could not connect to chat server. Please try again.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }, 10000);
      } else if (isWebSocketConnected && chatSessionId) {
        // If we already have a WebSocket connection, send message directly
        sendLiveChatMessage();
      } else if (isConnectingToWebSocket) {
        // If we're still connecting, queue the message
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          message: inputMessage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        
        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'system',
          message: 'Connecting to support agent...',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, systemMessage]);
        setIsWaitingForAgent(true);
      }
    } else {
      // If outside business hours, add the message but inform user agents are offline
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        message: inputMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // If outside business hours, suggest email or callback
      setTimeout(() => {
        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'system',
          message: 'Our agents are currently offline. Please use our email support or request a callback.',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, systemMessage]);
      }, 500);
    }
  };
  
  const handleSubmitEmailSupport = async () => {
    if (!callbackForm.email || !callbackForm.name || !callbackForm.notes) {
      toast({
        title: "Missing Information",
        description: "Please provide your name, email, and message.",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate API request
    toast({
      title: "Email Sent",
      description: "Thank you for contacting us. We will respond to your email shortly.",
    });
    
    // In a real implementation, we would send this to the server
    try {
      // This would be an actual API call in a real implementation
      // await apiRequest('POST', '/api/support/email', callbackForm);
      
      // Add a confirmation message to the chat
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        message: `Thank you for your message. Our team will respond to your email (${callbackForm.email}) as soon as possible.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      setActiveTab('chat');
      
      // Reset form
      setCallbackForm(prev => ({
        ...prev,
        notes: ''
      }));
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleRequestCallback = async () => {
    if (!callbackForm.phone || !callbackForm.name) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and phone number for the callback.",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate API request
    try {
      // This would be an actual API call in a real implementation
      await apiRequest('POST', '/api/support/callback-request', callbackForm);
      
      toast({
        title: "Callback Requested",
        description: "Our team will call you as soon as possible.",
      });
      
      // Add a confirmation message to the chat
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        message: `Thank you for your callback request. Our team will call you at ${callbackForm.phone} during business hours. Preferred language: ${callbackForm.preferredLanguage.charAt(0).toUpperCase() + callbackForm.preferredLanguage.slice(1)}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      setIsCallbackDialogOpen(false);
      
    } catch (error) {
      console.error("Error requesting callback:", error);
      toast({
        title: "Error",
        description: "Failed to request callback. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Connect to WebSocket for live chat
  const connectToWebSocket = () => {
    if (isConnectingToWebSocket || isWebSocketConnected || wsRef.current) return;
    
    setIsConnectingToWebSocket(true);
    
    // Create unique user ID (in a real app, this would be a user ID from the database)
    const userId = isAuthenticated && user ? user.id.toString() : `guest-${Date.now()}`;
    const userName = isAuthenticated && user ? user.fullName : 'Guest User';
    const userPhone = isAuthenticated && user ? user.phone : 'Not provided';
    const preferredLang = currentLanguage === 'en' ? 'en' : 'hi';
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/chat?type=user&userId=${userId}&name=${encodeURIComponent(userName)}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    // Handle WebSocket events
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsWebSocketConnected(true);
      setIsConnectingToWebSocket(false);
      
      // Start a new chat session
      ws.send(JSON.stringify({
        type: 'start_chat',
        userName,
        userPhone,
        preferredLanguage: preferredLang
      }));
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsWebSocketConnected(false);
      setIsConnectingToWebSocket(false);
      wsRef.current = null;
      setChatSessionId(null);
      
      // Add message about disconnection if we had an active session
      if (chatSessionId) {
        const disconnectMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'system',
          message: 'You have been disconnected from the chat. Please refresh to reconnect.',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, disconnectMessage]);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsWebSocketConnected(false);
      setIsConnectingToWebSocket(false);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        message: 'Error connecting to chat server. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    console.log('WebSocket message:', data);
    
    switch (data.type) {
      case 'connection_established':
        // Connection established, no need to do anything
        break;
        
      case 'chat_started':
        setChatSessionId(data.chatId);
        break;
        
      case 'admin_joined':
        // Check if we already have a similar system message
        const adminJoinedMessage = `${data.adminName} has joined the chat.`;
        const hasExistingJoinMessage = messages.some(msg => 
          msg.sender === 'system' && 
          msg.message === adminJoinedMessage
        );
        
        // Only add the message if there isn't a similar one already
        if (!hasExistingJoinMessage) {
          const joinMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'system',
            message: adminJoinedMessage,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, joinMessage]);
        }
        break;
        
      case 'typing_indicator':
        if (data.userType === 'admin') {
          setIsAgentTyping(data.isTyping);
        }
        break;
        
      case 'chat_message':
        // When receiving a message, clear typing indicator
        if (data.message.senderType === 'admin') {
          setIsAgentTyping(false);
        }
        
        const message = data.message;
        const chatMessage: ChatMessage = {
          id: message.id,
          sender: message.senderType === 'admin' ? 'agent' : 'user',
          message: message.content,
          timestamp: new Date(message.timestamp)
        };
        
        setMessages(prev => [...prev, chatMessage]);
        break;
        
      case 'chat_ended':
        const endMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'system',
          message: 'The chat session has ended.',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, endMessage]);
        setChatSessionId(null);
        
        // Close WebSocket connection
        if (wsRef.current) {
          wsRef.current.close();
        }
        break;
        
      case 'participant_disconnected':
        if (data.participantType === 'admin') {
          const disconnectMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'system',
            message: `${data.participantName} has disconnected. Another agent will be with you shortly.`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, disconnectMessage]);
        }
        break;
        
      case 'error':
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'system',
          message: data.message,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        break;
    }
  };
  
  // Send typing indicator
  const sendTypingIndicator = (isTyping: boolean) => {
    if (!wsRef.current || !chatSessionId || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      chatId: chatSessionId,
      isTyping
    }));
  };
  
  // Send message via WebSocket
  const sendLiveChatMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || !chatSessionId) return;
    
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        message: 'Connection lost. Trying to reconnect...',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      connectToWebSocket();
      return;
    }
    
    // Send message via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'message',
      chatId: chatSessionId,
      content: inputMessage
    }));
    
    // Clear typing indicator when sending a message
    sendTypingIndicator(false);
    
    setInputMessage('');
  };
  
  // Function to handle chatbot communication
  const handleChatbotMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    try {
      // Make API call to chatbot
      const response = await apiRequest('POST', '/api/chatbot', { 
        message: message,
        language: currentLanguage 
      });
      
      if (response && 'reply' in response) {
        const botMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'agent', // We use agent for styling, but it's the bot
          message: response.reply as string,
          timestamp: new Date()
        };
        
        // Add a small delay to make it feel more natural
        setTimeout(() => {
          setMessages(prev => [...prev, botMessage]);
        }, 500);
      }
    } catch (error) {
      console.error("Error getting chatbot response:", error);
      
      // Show error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        message: "Sorry, I'm having trouble connecting to our assistant. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  // Function to open appropriate support option based on selection
  const handleSupportOptionSelect = (option: 'email' | 'chat' | 'chatbot') => {
    // Reset messages
    setMessages([]);
    
    switch(option) {
      case 'email':
        window.location.href = "mailto:blinkeach@gmail.com";
        break;
      case 'chat':
        setIsChatbotActive(false);
        setIsOptionsMenuOpen(false);
        setIsOpen(true);
        
        // If within business hours, connect to WebSocket immediately
        if (isAgentAvailable && !isWebSocketConnected && !isConnectingToWebSocket) {
          const welcomeMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'system',
            message: 'Welcome to live chat support! Connecting you to an agent...',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, welcomeMessage]);
          connectToWebSocket();
        }
        break;
      case 'chatbot':
        setIsChatbotActive(true);
        setIsOptionsMenuOpen(false);
        setIsOpen(true);
        break;
    }
  };
  
  // Format message timestamp
  const formatTime = (date: Date): string => {
    return format(date, 'h:mm a');
  };
  
  return (
    <>
      {/* Chat Icon Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setIsOptionsMenuOpen(false);
            } else {
              setIsOptionsMenuOpen(true);
            }
          }}
          className={`h-14 w-14 rounded-full shadow-lg ${isOpen || isOptionsMenuOpen ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </Button>
      </div>
      
      {/* Support Options Menu */}
      {isOptionsMenuOpen && !isOpen && (
        <div className="fixed bottom-24 right-6 w-[250px] shadow-xl rounded-lg border bg-background z-40">
          <div className="p-1">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-center text-base">Support Options</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-2 pb-2">
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={() => handleSupportOptionSelect('email')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Email Us</span>
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={() => handleSupportOptionSelect('chat')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{isAgentAvailable ? 'Live Chat with Agent' : 'Send Message'}</span>
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={() => handleSupportOptionSelect('chatbot')}
                >
                  <Smile className="mr-2 h-4 w-4" />
                  <span>AI Chatbot Assistant</span>
                </Button>
              </CardContent>
              
              <CardFooter className="pt-0 pb-3 flex justify-center">
                <Button variant="ghost" size="sm" onClick={() => setIsOptionsMenuOpen(false)}>
                  <X size={16} className="mr-1" />
                  <span>Close</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] md:w-[420px] shadow-xl rounded-lg border bg-background z-40 overflow-hidden flex flex-col">
          <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">Customer Support</h3>
              <p className="text-xs">
                {isAgentAvailable ? 'Agents are online' : 'Agents are offline'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-2"
                onClick={() => setIsCallbackDialogOpen(true)}
              >
                <Phone size={16} className="mr-1" /> Call Me
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-primary-foreground hover:text-primary hover:bg-primary-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 mx-4 mt-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex flex-col flex-1 data-[state=inactive]:hidden">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '350px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender !== 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 ${
                      msg.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : msg.sender === 'agent' 
                          ? 'bg-accent' 
                          : 'bg-muted'
                    }`}>
                      {msg.sender === 'agent' && (
                        <p className="text-xs font-semibold mb-1">Support Agent</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isAgentTyping && (
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
              
              {/* Chat Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      
                      // Only send typing indicators in live chat mode
                      if (!isChatbotActive && !isWaitingForAgent && chatSessionId) {
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (isChatbotActive) {
                          handleChatbotMessage(inputMessage);
                        } else {
                          handleSendMessage();
                        }
                      }
                    }}
                    disabled={isWaitingForAgent}
                  />
                  <Button 
                    onClick={() => {
                      if (isChatbotActive) {
                        handleChatbotMessage(inputMessage);
                      } else {
                        handleSendMessage();
                      }
                    }}
                    size="icon"
                    disabled={!inputMessage.trim() || isWaitingForAgent}
                  >
                    {isWaitingForAgent ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
                {isChatbotActive && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center">
                    <Smile className="h-3 w-3 mr-1" />
                    <span>Chatting with AI Assistant</span>
                  </div>
                )}
                {!isChatbotActive && !isAgentAvailable && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Live chat available Mon-Sat, 10am-6pm IST</span>
                  </div>
                )}
                {!isChatbotActive && isWaitingForAgent && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    <span>Connecting to an agent...</span>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="email" className="flex-1 p-4 overflow-y-auto data-[state=inactive]:hidden">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="support-name">Your Name</Label>
                  <Input 
                    id="support-name"
                    value={callbackForm.name}
                    onChange={(e) => setCallbackForm({...callbackForm, name: e.target.value})}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="support-email">Email Address</Label>
                  <Input 
                    id="support-email"
                    type="email"
                    value={callbackForm.email}
                    onChange={(e) => setCallbackForm({...callbackForm, email: e.target.value})}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="support-message">Your Message</Label>
                  <Textarea 
                    id="support-message"
                    value={callbackForm.notes}
                    onChange={(e) => setCallbackForm({...callbackForm, notes: e.target.value})}
                    placeholder="How can we help you?"
                    rows={4}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleSubmitEmailSupport}
                >
                  Send Message
                </Button>
                
                <div className="text-center text-xs text-muted-foreground mt-4">
                  <p>You can also email us directly at:</p>
                  <a href="mailto:blinkeach@gmail.com" className="text-primary hover:underline">
                    blinkeach@gmail.com
                  </a>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Callback Request Dialog */}
      <Dialog open={isCallbackDialogOpen} onOpenChange={setIsCallbackDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request a Callback</DialogTitle>
            <DialogDescription>
              Fill in your details and we'll call you back during business hours (Mon-Sat, 10am-6pm).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="callback-name">Your Name</Label>
              <Input 
                id="callback-name"
                value={callbackForm.name}
                onChange={(e) => setCallbackForm({...callbackForm, name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="callback-phone">Phone Number</Label>
              <Input 
                id="callback-phone"
                value={callbackForm.phone}
                onChange={(e) => setCallbackForm({...callbackForm, phone: e.target.value})}
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="callback-language">Preferred Language</Label>
              <RadioGroup 
                defaultValue={callbackForm.preferredLanguage}
                onValueChange={(value) => setCallbackForm({
                  ...callbackForm, 
                  preferredLanguage: value as 'english' | 'hindi'
                })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="english" id="english" />
                  <Label htmlFor="english">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hindi" id="hindi" />
                  <Label htmlFor="hindi">Hindi</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="callback-notes">Additional Notes (Optional)</Label>
              <Textarea 
                id="callback-notes"
                value={callbackForm.notes}
                onChange={(e) => setCallbackForm({...callbackForm, notes: e.target.value})}
                placeholder="Please share any details about your query"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestCallback}>
              Request Callback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LiveChatWidget;