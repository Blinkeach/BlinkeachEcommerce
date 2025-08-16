import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ArrowUpDown,
  UserPlus
} from 'lucide-react';

// User interface matching the schema
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isAdmin: boolean;
  profilePicture?: string;
  isGoogleUser: boolean;
  isFacebookUser: boolean;
  emailVerified: boolean;
  googleId?: string;
  facebookId?: string;
  lastLogin: string;
  createdAt: string;
  isActive?: boolean; // For toggling active status
}

const CustomerManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [isNewAdminModalOpen, setIsNewAdminModalOpen] = useState(false);
  const [newAdminFormData, setNewAdminFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: allUsers, isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    suspense: false
  });

  // Update user active status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/users/${id}/status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Status updated',
        description: 'The customer status has been successfully updated.',
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update customer status. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
      console.error('Update error:', error);
    }
  });

  // Create new admin user mutation
  const createAdminUserMutation = useMutation({
    mutationFn: async (userData: typeof newAdminFormData & { isAdmin: boolean }) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsNewAdminModalOpen(false);
      setNewAdminFormData({
        username: '',
        password: '',
        email: '',
        fullName: '',
        phone: ''
      });
      toast({
        title: 'Admin user created',
        description: 'The new admin user has been successfully created.',
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create admin user. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
      console.error('Create admin error:', error);
    }
  });

  // Generate sample data for development
  const sampleUsers: User[] = allUsers || Array(15).fill(0).map((_, index) => {
    const id = index + 1;
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 365));
    
    const names = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh', 'Neha Verma'];
    const fullName = names[Math.floor(Math.random() * names.length)];
    const username = fullName.toLowerCase().replace(' ', '.');
    
    return {
      id,
      username,
      email: `${username}@example.com`,
      fullName,
      phone: `+91 ${9800000000 + Math.floor(Math.random() * 199999999)}`,
      address: `${Math.floor(Math.random() * 100) + 1}, Some Street`,
      city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)],
      state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'][Math.floor(Math.random() * 5)],
      pincode: `${100000 + Math.floor(Math.random() * 900000)}`,
      isAdmin: id === 1, // Make the first user an admin
      isGoogleUser: Math.random() > 0.7,
      isFacebookUser: Math.random() > 0.8,
      emailVerified: Math.random() > 0.1,
      lastLogin: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      createdAt: createdDate.toISOString(),
      isActive: Math.random() > 0.1 // Most users are active
    };
  });

  // Filter and sort users
  const filteredUsers = sampleUsers.filter(user => 
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.phone.includes(search)
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortField === 'createdAt' || sortField === 'lastLogin') {
      return sortDirection === 'asc' 
        ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
        : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
    }
    
    const fieldA = a[sortField as keyof User];
    const fieldB = b[sortField as keyof User];

    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    } else {
      return sortDirection === 'asc'
        ? Number(fieldA) - Number(fieldB)
        : Number(fieldB) - Number(fieldA);
    }
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewCustomer = (customer: User) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailOpen(true);
  };

  const handleStatusChange = (userId: number, isActive: boolean) => {
    updateUserStatusMutation.mutate({ id: userId, isActive });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminUserMutation.mutate({
      ...newAdminFormData,
      isAdmin: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <Button onClick={() => setIsNewAdminModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Admin User
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('id')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    ID 
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('fullName')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Name 
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('email')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('phone')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Phone
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Joined
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('isAdmin')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Role
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">#{user.id}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
                      ) : (
                        <Badge variant="outline">Customer</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={user.isActive} 
                          onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                        />
                        <span className="text-sm">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewCustomer(user)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  // Show only current page, first, last, and adjacent pages
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={index}>
                        <PaginationLink
                          isActive={pageNumber === currentPage}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    (pageNumber === currentPage - 2 && currentPage > 3) ||
                    (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return <PaginationItem key={index}>...</PaginationItem>;
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <Dialog open={isCustomerDetailOpen} onOpenChange={setIsCustomerDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View complete details of this customer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                  {selectedCustomer.profilePicture ? (
                    <img 
                      src={selectedCustomer.profilePicture} 
                      alt={selectedCustomer.fullName} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-neutral-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCustomer.fullName}</h3>
                  <p className="text-sm text-neutral-500">
                    {selectedCustomer.isAdmin ? 'Administrator' : 'Customer'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-neutral-500">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Mail className="h-4 w-4 text-neutral-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-neutral-600">{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-4 w-4 text-neutral-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-neutral-600">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <User className="h-4 w-4 text-neutral-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Username</p>
                        <p className="text-sm text-neutral-600">{selectedCustomer.username}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-neutral-500">Address Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-neutral-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-neutral-600">
                          {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state}, {selectedCustomer.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-neutral-500">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 text-neutral-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Joined On</p>
                        <p className="text-sm text-neutral-600">{formatDate(selectedCustomer.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 text-neutral-500 mt-1 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Last Login</p>
                        <p className="text-sm text-neutral-600">{formatDate(selectedCustomer.lastLogin)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-neutral-500">Account Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Account Status</p>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={selectedCustomer.isActive} 
                          onCheckedChange={(checked) => {
                            handleStatusChange(selectedCustomer.id, checked);
                            setSelectedCustomer({...selectedCustomer, isActive: checked});
                          }}
                        />
                        <span className="text-sm">
                          {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Email Verified</p>
                      <Badge 
                        variant={selectedCustomer.emailVerified ? "default" : "outline"} 
                        className={selectedCustomer.emailVerified ? "bg-green-100 text-green-800" : ""}
                      >
                        {selectedCustomer.emailVerified ? "Verified" : "Not Verified"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Admin Privileges</p>
                      <Badge 
                        variant={selectedCustomer.isAdmin ? "default" : "outline"} 
                        className={selectedCustomer.isAdmin ? "bg-purple-100 text-purple-800" : ""}
                      >
                        {selectedCustomer.isAdmin ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Admin User Modal */}
      <Dialog open={isNewAdminModalOpen} onOpenChange={setIsNewAdminModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Admin User</DialogTitle>
            <DialogDescription>
              Create a new administrative user with full access to the dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
              <Input 
                id="fullName" 
                value={newAdminFormData.fullName} 
                onChange={(e) => setNewAdminFormData({...newAdminFormData, fullName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input 
                id="email" 
                type="email" 
                value={newAdminFormData.email} 
                onChange={(e) => setNewAdminFormData({...newAdminFormData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <Input 
                id="username" 
                value={newAdminFormData.username} 
                onChange={(e) => setNewAdminFormData({...newAdminFormData, username: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input 
                id="password" 
                type="password" 
                value={newAdminFormData.password} 
                onChange={(e) => setNewAdminFormData({...newAdminFormData, password: e.target.value})}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone</label>
              <Input 
                id="phone" 
                value={newAdminFormData.phone} 
                onChange={(e) => setNewAdminFormData({...newAdminFormData, phone: e.target.value})}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsNewAdminModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAdminUserMutation.isPending}
              >
                {createAdminUserMutation.isPending ? 'Creating...' : 'Create Admin User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;