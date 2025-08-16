import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Clock, 
  CheckCheck, 
  Ban 
} from 'lucide-react';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { ReturnRequest } from '../../../shared/schema';

// Schema for admin notes form
const adminNotesSchema = z.object({
  adminNotes: z.string().min(1, "Admin notes are required")
});

type AdminNotesFormValues = z.infer<typeof adminNotesSchema>;

const ReturnRequestsPanel: React.FC = () => {
  const { toast } = useToast();
  const { setReturnRequestsCount } = useAdminNotifications();
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch return requests
  const { data: returnRequests, isLoading, error } = useQuery({
    queryKey: ['/api/returns'],
    onSuccess: (data) => {
      // Update notification count for pending return requests
      const pendingCount = data?.filter(req => req.status === 'pending')?.length || 0;
      setReturnRequestsCount(pendingCount);
    }
  });

  // Approve return request mutation
  const approveMutation = useMutation({
    mutationFn: async (requestData: { id: number; adminNotes: string }) => {
      return apiRequest('PUT', `/api/returns/${requestData.id}/approve`, { adminNotes: requestData.adminNotes });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Return request approved successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] });
      setIsDetailsOpen(false);
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to approve return request: ${error.message}`,
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  });

  // Reject return request mutation
  const rejectMutation = useMutation({
    mutationFn: async (requestData: { id: number; adminNotes: string }) => {
      return apiRequest('PUT', `/api/returns/${requestData.id}/reject`, { adminNotes: requestData.adminNotes });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Return request rejected',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] });
      setIsDetailsOpen(false);
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to reject return request: ${error.message}`,
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  });

  const handleViewRequest = (returnRequest: ReturnRequest) => {
    setSelectedRequest(returnRequest);
    setAdminNotes(returnRequest.adminNotes || '');
    setIsDetailsOpen(true);
  };

  const handleApproveRequest = (returnRequest: ReturnRequest) => {
    if (!adminNotes || adminNotes.trim() === '') {
      toast({
        title: 'Error',
        description: 'Please add admin notes before approving the request',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    approveMutation.mutate({ 
      id: returnRequest.id,
      adminNotes
    });
  };

  const handleRejectRequest = (returnRequest: ReturnRequest) => {
    if (!adminNotes || adminNotes.trim() === '') {
      toast({
        title: 'Error',
        description: 'Please add a rejection reason in the admin notes field',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    rejectMutation.mutate({ 
      id: returnRequest.id,
      adminNotes
    });
  };
  
  // Helper function to get the status badge for a return request
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300"><CheckCheck className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300"><Ban className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter requests based on selected status
  const filteredRequests = returnRequests?.filter(req => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
          <CardDescription>Loading return requests...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
          <CardDescription>Error loading return requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load return requests: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Return Requests</CardTitle>
              <CardDescription>Manage customer return requests</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter">Filter:</Label>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter" className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No return requests found for this filter.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.id}</TableCell>
                      <TableCell>#{request.orderId}</TableCell>
                      <TableCell>User #{request.userId}</TableCell>
                      <TableCell>
                        {request.createdAt ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true }) : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleViewRequest(request)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Return Request #{selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              Order #{selectedRequest?.orderId} - {selectedRequest?.createdAt 
                ? format(new Date(selectedRequest.createdAt), 'PPP p') 
                : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Request Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status:</span>
                  <span>{selectedRequest ? getStatusBadge(selectedRequest.status) : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Reason:</span>
                  <span className="text-right">{selectedRequest?.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Description:</span>
                  <span className="text-right max-w-[250px] truncate">{selectedRequest?.description || 'N/A'}</span>
                </div>
                {selectedRequest?.imageUrl && (
                  <div>
                    <span className="text-neutral-500 block mb-1">Evidence Image:</span>
                    <img 
                      src={selectedRequest.imageUrl} 
                      alt="Return evidence" 
                      className="w-full h-auto rounded-md border border-gray-200" 
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Pickup Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Name:</span>
                  <span>{selectedRequest?.pickupAddress?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phone:</span>
                  <span>{selectedRequest?.pickupAddress?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Address:</span>
                  <address className="not-italic text-right">
                    {selectedRequest?.pickupAddress?.street1}<br />
                    {selectedRequest?.pickupAddress?.street2 && <>{selectedRequest.pickupAddress.street2}<br /></>}
                    {selectedRequest?.pickupAddress?.city}, {selectedRequest?.pickupAddress?.state} {selectedRequest?.pickupAddress?.pincode}
                  </address>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea 
                id="admin-notes" 
                placeholder="Add admin notes (required for both approve and reject actions)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                disabled={selectedRequest?.status !== 'pending' || isProcessing}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailsOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => selectedRequest && handleRejectRequest(selectedRequest)}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button 
                  onClick={() => selectedRequest && handleApproveRequest(selectedRequest)}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
              </>
            )}
            {selectedRequest?.status !== 'pending' && (
              <Button 
                variant="outline" 
                onClick={() => setIsDetailsOpen(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnRequestsPanel;