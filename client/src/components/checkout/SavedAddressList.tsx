import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Building, Edit, MapPin, Plus, Trash2 } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddressForm from './AddressForm';

interface UserAddress {
  id: number;
  addressName: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface SavedAddressListProps {
  selectedAddressId: number | null;
  onAddressSelect: (address: UserAddress) => void;
  onNewAddress: () => void;
}

const SavedAddressList: React.FC<SavedAddressListProps> = ({
  selectedAddressId,
  onAddressSelect,
  onNewAddress
}) => {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<UserAddress | null>(null);

  // Fetch saved addresses
  const { data: addresses, isLoading, isError } = useQuery({
    queryKey: ['/api/user/addresses'],
    queryFn: async () => {
      const response = await fetch('/api/user/addresses', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved addresses');
      }
      
      return response.json() as Promise<UserAddress[]>;
    }
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (addressId: number) => {
      await apiRequest('POST', `/api/user/addresses/${addressId}/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      toast({
        title: 'Default address updated',
        description: 'Your default shipping address has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete address mutation
  const deleteMutation = useMutation({
    mutationFn: async (addressId: number) => {
      await apiRequest('DELETE', `/api/user/addresses/${addressId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      toast({
        title: 'Address deleted',
        description: 'The address has been removed from your account.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update address mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number, addressData: Partial<UserAddress> }) => {
      await apiRequest('PUT', `/api/user/addresses/${data.id}`, data.addressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Address updated',
        description: 'Your address information has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle address selection
  const handleAddressSelect = (address: UserAddress) => {
    onAddressSelect(address);
  };

  // Handle setting default address
  const handleSetDefault = (addressId: number) => {
    setDefaultMutation.mutate(addressId);
  };

  // Handle address deletion
  const handleDelete = (addressId: number) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      deleteMutation.mutate(addressId);
    }
  };

  // Handle edit button click
  const handleEditClick = (address: UserAddress) => {
    setAddressToEdit(address);
    setIsEditDialogOpen(true);
  };

  // Handle address update form submit
  const handleUpdateAddress = (values: any) => {
    if (!addressToEdit) return;
    
    updateMutation.mutate({
      id: addressToEdit.id,
      addressData: {
        addressName: values.addressName,
        fullName: values.fullName,
        phone: values.phone,
        address: values.address,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        isDefault: values.isDefault
      }
    });
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        <span className="ml-2">Loading saved addresses...</span>
      </div>
    );
  }

  // If error or no addresses found
  if (isError || !addresses || addresses.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-neutral-600 mb-4">You don't have any saved addresses yet.</p>
        <Button 
          onClick={onNewAddress}
          className="bg-secondary hover:bg-secondary-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Saved Addresses</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onNewAddress}
          className="text-secondary border-secondary hover:bg-secondary/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <RadioGroup 
        value={selectedAddressId?.toString() || ''} 
        onValueChange={(value) => {
          const selectedAddress = addresses.find(addr => addr.id.toString() === value);
          if (selectedAddress) {
            handleAddressSelect(selectedAddress);
          }
        }}
        className="space-y-3"
      >
        {addresses.map((address) => (
          <div key={address.id} className="relative">
            <label
              htmlFor={`address-${address.id}`}
              className="cursor-pointer block"
            >
              <Card 
                className={`border ${selectedAddressId === address.id ? 'border-secondary' : 'border-neutral-200'} hover:border-secondary transition-colors`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <RadioGroupItem 
                      value={address.id.toString()} 
                      id={`address-${address.id}`}
                      className="mt-1 mr-3"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <span className="font-medium text-neutral-800">{address.addressName}</span>
                          {address.isDefault && (
                            <span className="ml-2 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditClick(address);
                            }}
                          >
                            <Edit className="h-4 w-4 text-neutral-500" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(address.id);
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-neutral-600">
                        <p className="font-medium">{address.fullName}</p>
                        <p>{address.address}</p>
                        <p>{address.city}, {address.state} {address.pincode}</p>
                        <p>Phone: {address.phone}</p>
                      </div>
                      
                      {!address.isDefault && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto mt-2 text-secondary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSetDefault(address.id);
                          }}
                          disabled={setDefaultMutation.isPending}
                        >
                          Set as default
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </label>
          </div>
        ))}
      </RadioGroup>

      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Update your shipping address details.
            </DialogDescription>
          </DialogHeader>
          
          {addressToEdit && (
            <AddressForm 
              initialValues={{
                addressName: addressToEdit.addressName,
                fullName: addressToEdit.fullName,
                phone: addressToEdit.phone,
                address: addressToEdit.address,
                city: addressToEdit.city,
                state: addressToEdit.state,
                pincode: addressToEdit.pincode,
                isDefault: addressToEdit.isDefault
              }}
              onSubmit={handleUpdateAddress}
              isSubmitting={updateMutation.isPending}
              submitButtonText="Update Address"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedAddressList;