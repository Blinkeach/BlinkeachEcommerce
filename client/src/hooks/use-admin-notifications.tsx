import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AdminNotificationsContextType {
  messageCount: number;
  supportRequestsCount: number;
  liveChatCount: number;
  returnRequestsCount: number;
  setMessageCount: (count: number) => void;
  setSupportRequestsCount: (count: number) => void;
  setLiveChatCount: (count: number) => void;
  setReturnRequestsCount: (count: number) => void;
  incrementLiveChatCount: (amount?: number) => void;
  decrementLiveChatCount: (amount?: number) => void;
}

const AdminNotificationsContext = createContext<AdminNotificationsContextType | undefined>(undefined);

export const AdminNotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messageCount, setMessageCount] = useState(0);
  const [supportRequestsCount, setSupportRequestsCount] = useState(0);
  const [liveChatCount, setLiveChatCount] = useState(0);
  const [returnRequestsCount, setReturnRequestsCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket for real-time chat notifications
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/chat?type=admin&adminId=notification&name=AdminNotifications`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Admin notifications WebSocket connected');
        setWsConnected(true);
      };
      
      ws.onclose = () => {
        console.log('Admin notifications WebSocket disconnected');
        setWsConnected(false);
        
        // Try to reconnect after a delay
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            connectWebSocket();
          }
        }, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('Admin notifications WebSocket error:', error);
        setWsConnected(false);
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
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_chat':
        incrementLiveChatCount(1);
        break;
      case 'unassigned_message':
        incrementLiveChatCount(1);
        break;
    }
  };

  // Fetch support requests count
  const { data: supportRequests = [] } = useQuery<{ id: number; status: string }[]>({
    queryKey: ['/api/support/requests'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/support/requests');
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error('Error fetching support requests count:', error);
        return [];
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch contact messages count
  const { data: contactMessages = [] } = useQuery<{ id: number; status: string }[]>({
    queryKey: ['/api/contact/messages'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/contact/messages');
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error('Error fetching contact messages count:', error);
        return [];
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    // Update support requests count based on pending status
    const pendingCount = supportRequests.filter(req => req.status === 'pending').length;
    setSupportRequestsCount(pendingCount);
  }, [supportRequests]);

  useEffect(() => {
    // Update messages count based on new status
    const newCount = contactMessages.filter(msg => msg.status === 'new').length;
    setMessageCount(newCount);
  }, [contactMessages]);

  // Helper functions for live chat notifications
  const incrementLiveChatCount = (amount: number = 1) => {
    setLiveChatCount(prev => prev + amount);
  };

  const decrementLiveChatCount = (amount: number = 1) => {
    setLiveChatCount(prev => Math.max(0, prev - amount));
  };

  // Create a memoized value for the context
  const value = {
    messageCount,
    supportRequestsCount,
    liveChatCount,
    returnRequestsCount,
    setMessageCount,
    setSupportRequestsCount,
    setLiveChatCount,
    setReturnRequestsCount,
    incrementLiveChatCount,
    decrementLiveChatCount
  };

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationsContext);
  if (context === undefined) {
    throw new Error('useAdminNotifications must be used within a AdminNotificationsProvider');
  }
  return context;
};