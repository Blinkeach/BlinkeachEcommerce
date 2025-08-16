import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Phone, Mail, AlertCircle, Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';

interface SupportRequest {
  id: number;
  type: 'callback' | 'email';
  name: string;
  phone?: string;
  email?: string;
  preferredLanguage?: 'english' | 'hindi';
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

const SupportRequestsPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const { setSupportRequestsCount } = useAdminNotifications();
  
  // Fetch support requests
  const { data: supportRequests = [], isLoading, error } = useQuery<SupportRequest[]>({
    queryKey: ['/api/support/requests'],
    queryFn: async () => {
      const response = await fetch('/api/support/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch support requests');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute to keep the list updated
  });
  
  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'completed' | 'cancelled' }) => {
      const response = await fetch(`/api/support/requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update request status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the requests query
      queryClient.invalidateQueries({ queryKey: ['/api/support/requests'] });
      toast({
        title: 'Status updated',
        description: 'Support request status has been updated successfully.',
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
  
  // Handle marking a request as completed
  const handleCompleteRequest = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'completed' });
  };
  
  // Handle cancelling a request
  const handleCancelRequest = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'cancelled' });
  };
  
  // Filter requests based on active tab
  const filteredRequests = supportRequests.filter(request => 
    activeTab === 'all' || request.status === activeTab
  );
  
  // Count of pending requests - can be used for notifications/badges
  const pendingCount = supportRequests.filter(req => req.status === 'pending').length;
  
  // Update the notification context with the pending count
  useEffect(() => {
    setSupportRequestsCount(pendingCount);
  }, [pendingCount, setSupportRequestsCount]);
  
  // Format the time since the request was created
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
          <CardTitle>Support Requests</CardTitle>
          <CardDescription>Loading support requests...</CardDescription>
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
          <CardTitle>Support Requests</CardTitle>
          <CardDescription>Error loading support requests</CardDescription>
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
            <CardTitle>Support Requests</CardTitle>
            <CardDescription>
              Manage customer support requests and callbacks
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="px-3 py-1 text-sm">
              {pendingCount} Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {activeTab !== 'all' ? activeTab : ''} support requests found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 bg-background hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {request.type === 'callback' ? (
                            <Phone className="h-4 w-4 text-primary" />
                          ) : (
                            <Mail className="h-4 w-4 text-primary" />
                          )}
                          {request.name}
                        </h3>
                        
                        <div className="mt-1 text-sm text-muted-foreground">
                          {request.type === 'callback' ? (
                            <p>
                              Phone: {request.phone}
                              {request.preferredLanguage && (
                                <span className="ml-2">
                                  (Language: {request.preferredLanguage})
                                </span>
                              )}
                            </p>
                          ) : (
                            <p>Email: {request.email}</p>
                          )}
                          
                          {request.notes && (
                            <p className="mt-1">Notes: {request.notes}</p>
                          )}
                          
                          <p className="mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> 
                            {formatTimeAgo(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteRequest(request.id)}
                              className="h-8"
                            >
                              <Check className="h-4 w-4 mr-1" /> Done
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelRequest(request.id)}
                              className="h-8 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {request.status === 'completed' && (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            Completed
                          </Badge>
                        )}
                        
                        {request.status === 'cancelled' && (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            Cancelled
                          </Badge>
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

export default SupportRequestsPanel;