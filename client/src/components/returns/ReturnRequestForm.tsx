import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Define form schema for the return request
const returnRequestSchema = z.object({
  reason: z.string().min(1, "Please select a reason for the return"),
  comment: z.string().min(10, "Please provide more details about your return request").max(500, "Comments should not exceed 500 characters"),
  pickupAddressType: z.enum(['same', 'different'], {
    required_error: "Please select a pickup address option",
  }),
  pickupAddress: z.string().optional(),
  pickupCity: z.string().optional(),
  pickupState: z.string().optional(),
  pickupPincode: z.string().optional(),
  pickupPhone: z.string().optional(),
  pickupName: z.string().optional(),
});

// Use superRefine to add field-level validation messages
const returnRequestSchemaWithValidation = returnRequestSchema.superRefine((data, ctx) => {
  if (data.pickupAddressType === 'different') {
    if (!data.pickupAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["pickupAddress"]
      });
    }
    if (!data.pickupCity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["pickupCity"]
      });
    }
    if (!data.pickupState) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["pickupState"]
      });
    }
    if (!data.pickupPincode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["pickupPincode"]
      });
    }
    if (!data.pickupPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["pickupPhone"]
      });
    }
    if (!data.pickupName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["pickupName"]
      });
    }
  }
});

type ReturnRequestFormValues = z.infer<typeof returnRequestSchemaWithValidation>;

interface ReturnRequestFormProps {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ReturnRequestForm: React.FC<ReturnRequestFormProps> = ({ 
  orderId, 
  isOpen, 
  onClose 
}) => {
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Check if order is eligible for return
  const { data: eligibility, isLoading: checkingEligibility } = useQuery({
    queryKey: ['/api/orders', orderId, 'return-eligibility'],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/return-eligibility`);
      return await response.json();
    },
    enabled: isOpen && !!orderId,
  });

  // Set up form with validation
  const form = useForm<ReturnRequestFormValues>({
    resolver: zodResolver(returnRequestSchemaWithValidation),
    defaultValues: {
      reason: '',
      comment: '',
      pickupAddressType: 'same',
      pickupAddress: '',
      pickupCity: '',
      pickupState: '',
      pickupPincode: '',
      pickupPhone: '',
      pickupName: '',
    },
  });

  const { watch } = form;
  const pickupAddressType = watch('pickupAddressType');

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        if (selectedImages.length + files.length > 3) {
          toast({
            title: "Too many images",
            description: "You can upload a maximum of 3 images",
            variant: "destructive"
          });
          return;
        }

        // Add new files to state
        setSelectedImages(prev => [...prev, ...files]);
        
        // Create preview URLs
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      }
    }
  };

  // Handle image removal
  const removeImage = (index: number) => {
    // Release object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    // Remove the image from both arrays
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      // Clean up all preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Submit return request
  const submitMutation = useMutation({
    mutationFn: async (data: ReturnRequestFormValues) => {
      const returnData = {
        orderId,
        reason: data.reason,
        details: data.comment,
        isSameAsDelivery: data.pickupAddressType === 'same',
        ...(data.pickupAddressType === 'different' ? {
          // Keep address parts separate and standardized
          pickupAddress: data.pickupAddress,
          pickupCity: data.pickupCity,
          pickupState: data.pickupState,
          pickupPincode: data.pickupPincode,
          pickupPhone: data.pickupPhone,
          pickupName: data.pickupName // Pass name separately instead of including in address
        } : {})
      };

      const response = await apiRequest("POST", "/api/returns", returnData);
      const returnRequest = await response.json();

      // If images were selected, upload them
      if (selectedImages.length > 0 && returnRequest.id) {
        const formData = new FormData();
        selectedImages.forEach(image => {
          formData.append('images', image);
        });

        // For form data uploads, we need to directly fetch
        await fetch(`/api/returns/upload-images?returnId=${returnRequest.id}`, {
          method: 'POST',
          body: formData
        });
      }

      return returnRequest;
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Return Request Submitted",
        description: "Your return request has been submitted successfully and is pending approval",
        duration: 5000,
      });

      // Close the modal
      onClose();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/returns/user']});
      queryClient.invalidateQueries({queryKey: ['/api/orders/user']});
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit return request",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: ReturnRequestFormValues) => {
    submitMutation.mutate(data);
  };

  // Render eligibility check or form based on result
  if (checkingEligibility) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Checking Return Eligibility</DialogTitle>
            <DialogDescription>
              Please wait while we check if this order is eligible for return...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (eligibility && !eligibility.eligible) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Return Not Available</DialogTitle>
            <DialogDescription>
              This order is not eligible for return.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Return Not Possible</AlertTitle>
            <AlertDescription>
              {eligibility.reason === 'already_requested' && 'A return request for this order has already been submitted.'}
              {eligibility.reason === 'not_delivered' && 'Only delivered orders can be returned.'}
              {eligibility.reason === 'expired' && `The return window has expired. Returns must be requested within 7 days of delivery (${eligibility.daysSinceDelivery} days have passed).`}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Return Request</DialogTitle>
          <DialogDescription>
            Submit a return request for Order #{orderId}. 
            {eligibility?.daysRemaining && 
              ` You have ${eligibility.daysRemaining} day(s) left to request a return.`
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Return*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="damaged">Damaged Product</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item Received</SelectItem>
                      <SelectItem value="defective">Defective Product</SelectItem>
                      <SelectItem value="not_as_described">Not as Described</SelectItem>
                      <SelectItem value="size_issue">Size/Fit Issue</SelectItem>
                      <SelectItem value="quality_issue">Quality Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide more details about your return request" 
                      {...field} 
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label htmlFor="return-images">Upload Images (Optional)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="return-images"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={selectedImages.length >= 3}
                  className="flex-1"
                />
              </div>
              <div className="text-xs text-neutral-500">
                Upload up to 3 images showing the issue with the product. Max 5MB per image.
              </div>

              {previewUrls.length > 0 && (
                <div className="flex gap-3 mt-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Return image ${index + 1}`}
                        className="h-20 w-20 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="pickupAddressType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Pickup Address</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="same" id="same-address" />
                        <Label htmlFor="same-address">Same as delivery address <span className="text-xs text-muted-foreground">(Recommended)</span></Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="different" id="different-address" />
                        <Label htmlFor="different-address">Use a different address</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {pickupAddressType === 'different' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Phone Number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupAddress"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address Line*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="State" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupPincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Return Policy</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-sm">
                  <li>Returns must be initiated within 7 days of delivery</li>
                  <li>Item must be in original condition with all tags and packaging</li>
                  <li>Our team will inspect the product once it's returned</li>
                  <li>Refund will be processed to original payment method within 7-10 business days</li>
                </ul>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : "Submit Return Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnRequestForm;