import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import SavedAddressList from './SavedAddressList';
import AddressForm from './AddressForm';

// Schema for contact information
const contactInfoSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  specialInstructions: z.string().optional(),
  paymentMethod: z.enum(['razorpay', 'cod'], { required_error: 'Please select a payment method' }),
});

// Schema for new address
const newAddressSchema = z.object({
  addressName: z.string().min(2, { message: 'Label must be at least 2 characters' }),
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
  address: z.string().min(5, { message: 'Please enter your full address' }),
  city: z.string().min(2, { message: 'Please enter your city' }),
  state: z.string().min(2, { message: 'Please enter your state' }),
  pincode: z.string().min(6, { message: 'Enter a valid PIN code' }).max(6),
  isDefault: z.boolean().default(false),
});

type ContactInfoValues = z.infer<typeof contactInfoSchema>;
type NewAddressValues = z.infer<typeof newAddressSchema>;

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

interface CheckoutFormProps {
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
  onPaymentMethodChange?: (paymentMethod: 'razorpay' | 'cod') => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit, isSubmitting, onPaymentMethodChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addressTab, setAddressTab] = useState('saved');
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  
  // Contact information form
  const contactForm = useForm<ContactInfoValues>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      email: user?.email || '',
      paymentMethod: 'razorpay',
      specialInstructions: ''
    }
  });

  // New address form
  const addressForm = useForm<NewAddressValues>({
    resolver: zodResolver(newAddressSchema),
    defaultValues: {
      addressName: 'Home',
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    }
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (addressData: NewAddressValues) => {
      const response = await apiRequest('POST', '/api/user/addresses', addressData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      setSelectedAddress(data);
      toast({
        title: 'Address saved',
        description: 'Your new address has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save address',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle form submission
  const handleSubmit = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("Submit button clicked, addressTab:", addressTab);
    
    try {
      // Validate contact information
      await new Promise<void>((resolve) => {
        contactForm.handleSubmit((contactValues) => {
          console.log("Contact form validated, contactValues:", contactValues);
          resolve();
        })();
      });
      
      // Get the contact values after validation
      const contactValues = contactForm.getValues();
      console.log("Contact values retrieved:", contactValues);
      
      // If user is logged in and has selected a saved address
      if (user && addressTab === 'saved' && selectedAddress) {
        console.log("Using saved address:", selectedAddress);
        
        // Submit complete order information
        onSubmit({
          name: selectedAddress.fullName,
          email: contactValues.email,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          paymentMethod: contactValues.paymentMethod,
          specialInstructions: contactValues.specialInstructions,
          savedAddressId: selectedAddress.id, // Include the saved address ID
        });
      } 
      // If using new address form (either as logged in user or guest)
      else if (addressTab === 'new' || !user) {
        console.log("Using new address form");
        
        try {
          // Validate address form
          await new Promise<void>((resolve, reject) => {
            addressForm.handleSubmit((addressValues) => {
              console.log("Address form validated, addressValues:", addressValues);
              resolve();
            })();
            
            // If there are validation errors, they will be shown in the form
            if (Object.keys(addressForm.formState.errors).length > 0) {
              console.error("Address form validation errors:", addressForm.formState.errors);
              reject(new Error("Address form has validation errors"));
            }
          });
          
          // Get the form values after validation
          const addressValues = addressForm.getValues();
          console.log("Address values retrieved:", addressValues);
          
          // Save address to DB if user is logged in
          if (user) {
            createAddressMutation.mutate(addressValues);
          }
          
          // Submit complete order information
          onSubmit({
            name: addressValues.fullName,
            email: contactValues.email,
            phone: addressValues.phone,
            address: addressValues.address,
            city: addressValues.city,
            state: addressValues.state,
            pincode: addressValues.pincode,
            paymentMethod: contactValues.paymentMethod,
            specialInstructions: contactValues.specialInstructions,
          });
        } catch (error) {
          console.error("Error validating address form:", error);
          toast({
            title: 'Validation Error',
            description: 'Please check the address form fields and try again.',
            variant: 'destructive',
          });
        }
      } else {
        // No address selected or filled out
        toast({
          title: 'Address required',
          description: 'Please select an existing address or add a new one.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: 'Form Error',
        description: 'Please check all form fields and try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle address selection
  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddress(address);
  };
  
  // Handle creating a new address
  const handleNewAddress = () => {
    setAddressTab('new');
  };

  // If not logged in, default to new address tab
  useEffect(() => {
    if (!user) {
      setAddressTab('new');
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Contact Information</h2>
        
        <Form {...contactForm}>
          <div className="space-y-4">
            <FormField
              control={contactForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Shipping Address</h2>
        
        {user ? (
          <Tabs value={addressTab} onValueChange={setAddressTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="saved">Saved Addresses</TabsTrigger>
              <TabsTrigger value="new">Add New Address</TabsTrigger>
            </TabsList>
            
            <TabsContent value="saved">
              <SavedAddressList 
                selectedAddressId={selectedAddress?.id || null}
                onAddressSelect={handleAddressSelect}
                onNewAddress={handleNewAddress}
              />
            </TabsContent>
            
            <TabsContent value="new">
              <Form {...addressForm}>
                <AddressForm 
                  onSubmit={() => {}} // We'll handle submission with the main form
                  isSubmitting={createAddressMutation.isPending}
                  initialValues={addressForm.getValues()}
                  submitButtonText="Save Address"
                  form={addressForm}
                  hideSubmitButton={true} // Hide the submit button since we'll submit with the main form
                />
              </Form>
            </TabsContent>
          </Tabs>
        ) : (
          // Not logged in, just show the address form
          <Form {...addressForm}>
            <AddressForm 
              onSubmit={() => {}} // We'll handle submission with the main form
              isSubmitting={false}
              initialValues={addressForm.getValues()}
              form={addressForm}
              hideSubmitButton={true} // Hide the submit button since we'll submit with the main form
            />
          </Form>
        )}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Payment Method</h2>
        
        <Form {...contactForm}>
          <FormField
            control={contactForm.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup 
                    onValueChange={(value) => {
                      field.onChange(value);
                      onPaymentMethodChange?.(value as 'razorpay' | 'cod');
                    }} 
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border border-neutral-200 rounded-md bg-white">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <label htmlFor="razorpay" className="flex items-center cursor-pointer">
                        <img src="https://razorpay.com/favicon.png" alt="Razorpay" className="h-6 mr-2" />
                        <div>
                          <div className="font-medium">Razorpay</div>
                          <div className="text-xs text-neutral-500">Pay securely with credit/debit card, UPI, or net banking</div>
                        </div>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border border-neutral-200 rounded-md bg-white">
                      <RadioGroupItem value="cod" id="cod" />
                      <label htmlFor="cod" className="flex items-center cursor-pointer w-full">
                        <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2 text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-xs text-neutral-500">Pay with cash when your order arrives</div>
                        </div>
                        <div className="text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded">
                          + ₹10 fee
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={contactForm.control}
            name="specialInstructions"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Special Instructions (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any special instructions for delivery" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </div>
      
      <Button 
        type="button" 
        className="w-full bg-secondary hover:bg-secondary-dark text-white"
        disabled={isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? 'Processing...' : 'Place Order'}
      </Button>
    </div>
  );
};

export default CheckoutForm;
