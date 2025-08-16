import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MailOpen, Archive, AlertCircle, Clock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  createdAt: string;
}

const MessagesPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('new');
  const { setMessageCount } = useAdminNotifications();

  // Fetch contact messages
  const { data: messages = [], isLoading, error } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact/messages'],
    queryFn: async () => {
      const response = await fetch('/api/contact/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute to keep the list updated
  });

  // Update message status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'read' | 'archived' }) => {
      const response = await fetch(`/api/contact/messages/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update message status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the messages query
      queryClient.invalidateQueries({ queryKey: ['/api/contact/messages'] });
      toast({
        title: 'Status updated',
        description: 'Message status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handle marking a message as read
  const handleMarkAsRead = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'read' });
  };
  
  // Handle archiving a message
  const handleArchive = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'archived' });
  };
  
  // Filter messages based on active tab
  const filteredMessages = messages.filter(message => 
    activeTab === 'all' || message.status === activeTab
  );
  
  // Count of new messages - for notifications/badges
  const newCount = messages.filter(msg => msg.status === 'new').length;
  
  // Update notification count for new messages
  useEffect(() => {
    setMessageCount(newCount);
  }, [newCount, setMessageCount]);
  
  // Format the time since the message was created
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Messages</CardTitle>
          <CardDescription>Loading messages...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Messages</CardTitle>
          <CardDescription>Error loading messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error instanceof Error ? error.message : 'An error occurred'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customer Messages</CardTitle>
            <CardDescription>
              Manage messages from the contact form
            </CardDescription>
          </div>
          {newCount > 0 && (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {newCount} New
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="new" className="relative">
              New
              {newCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {newCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {activeTab !== 'all' ? activeTab : ''} messages found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`border rounded-lg p-4 bg-background ${
                      message.status === 'new' ? 'border-secondary' : ''
                    } hover:bg-accent/10 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          {message.name}
                          {message.status === 'new' && (
                            <Badge variant="secondary" className="ml-2">New</Badge>
                          )}
                        </h3>
                        
                        <div className="mt-1 text-sm text-muted-foreground">
                          <p>Email: {message.email}</p>
                          {message.phone && <p className="mt-1">Phone: {message.phone}</p>}
                          
                          <p className="mt-2 bg-accent/20 p-3 rounded border">
                            {message.message}
                          </p>
                          
                          <p className="mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> 
                            {formatTimeAgo(message.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {message.status === 'new' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(message.id)}
                              className="h-8"
                            >
                              <MailOpen className="h-4 w-4 mr-1" /> Mark as Read
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleArchive(message.id)}
                              className="h-8 hover:text-muted-foreground"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {message.status === 'read' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchive(message.id)}
                            className="h-8"
                          >
                            <Archive className="h-4 w-4 mr-1" /> Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MessagesPanel;