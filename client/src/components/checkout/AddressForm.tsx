import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const addressFormSchema = z.object({
  addressName: z.string().min(2, { message: 'Label must be at least 2 characters' }),
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
  address: z.string().min(5, { message: 'Please enter your full address' }),
  city: z.string().min(2, { message: 'Please enter your city' }),
  state: z.string().min(2, { message: 'Please enter your state' }),
  pincode: z.string().min(6, { message: 'Enter a valid PIN code' }).max(6),
  isDefault: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  onSubmit: (values: AddressFormValues) => void;
  isSubmitting: boolean;
  initialValues?: Partial<AddressFormValues>;
  submitButtonText?: string;
  form?: ReturnType<typeof useForm<AddressFormValues>>;
  hideSubmitButton?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({ 
  onSubmit, 
  isSubmitting, 
  initialValues,
  submitButtonText = 'Save Address',
  form: formProp,
  hideSubmitButton = false
}) => {
  const defaultForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      addressName: initialValues?.addressName || 'Home',
      fullName: initialValues?.fullName || '',
      phone: initialValues?.phone || '',
      address: initialValues?.address || '',
      city: initialValues?.city || '',
      state: initialValues?.state || '',
      pincode: initialValues?.pincode || '',
      isDefault: initialValues?.isDefault || false,
    }
  });
  
  const form = formProp || defaultForm;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="addressName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Label</FormLabel>
                <FormControl>
                  <Input placeholder="Home, Work, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter your phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your full address" 
                  {...field} 
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your state" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIN Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your PIN code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as default address</FormLabel>
                <p className="text-sm text-neutral-500">
                  This address will be used as your default shipping address.
                </p>
              </div>
            </FormItem>
          )}
        />
        
        {!hideSubmitButton && (
          <Button 
            type="submit" 
            className="w-full bg-secondary hover:bg-secondary-dark text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : submitButtonText}
          </Button>
        )}
      </form>
    </Form>
  );
};

export default AddressForm;