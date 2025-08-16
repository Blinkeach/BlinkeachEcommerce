import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User,
  Package,
  MapPin,
  Phone,
  Mail, 
  Upload, 
  Camera,
  Loader2,
  AlertCircle,
  Gift
} from 'lucide-react';
import { ReferralCard } from '@/components/user/ReferralCard';

import { useTranslation } from 'react-i18next';

// Create schema for profile form
const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

// Create schema for profile picture upload
const profilePictureSchema = z.object({
  image: z.instanceof(File).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type ProfilePictureFormValues = z.infer<typeof profilePictureSchema>;

const ProfilePage: React.FC = () => {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('info');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Check if user is authenticated
  if (!isLoading && !user) {
    navigate('/login');
    return null;
  }
  
  // Initialize the profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      pincode: user?.pincode || '',
    },
  });
  
  // Initialize the profile picture form
  const pictureForm = useForm<ProfilePictureFormValues>({
    resolver: zodResolver(profilePictureSchema),
    defaultValues: {
      image: undefined,
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating your profile.',
        variant: 'destructive',
        duration: 5000,
      });
    },
  });
  
  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // apiRequest now handles FormData automatically
      const response = await apiRequest('POST', '/api/user/profile-picture', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Picture Updated',
        description: 'Your profile picture has been updated successfully.',
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'An error occurred while uploading your profile picture.',
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  // Form submission handlers
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      pictureForm.setValue('image', file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handlePictureSubmit = (values: ProfilePictureFormValues) => {
    if (values.image) {
      uploadProfilePictureMutation.mutate(values.image);
    }
  };
  
  // Helper to get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>My Profile - Blinkeach</title>
        <meta name="description" content="View and edit your Blinkeach user profile information." />
      </Helmet>
      
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="info">
              <User className="h-4 w-4 mr-2" />
              Personal Information
            </TabsTrigger>
            <TabsTrigger value="picture">
              <Camera className="h-4 w-4 mr-2" />
              Profile Picture
            </TabsTrigger>
            <TabsTrigger value="referral">
              <Gift className="h-4 w-4 mr-2" />
              Referral Rewards
            </TabsTrigger>
          </TabsList>
          
          {/* Personal Information Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  View and update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="Enter your phone number" {...field} />
                                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    <h3 className="text-lg font-medium">Address Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
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
                              <Input placeholder="State" {...field} />
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
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input placeholder="Pincode" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full md:w-auto"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Profile Picture Tab */}
          <TabsContent value="picture">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Update your profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-40 w-40 border-2 border-secondary">
                      {previewUrl ? (
                        <AvatarImage src={previewUrl} alt="Preview" />
                      ) : user?.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.fullName} />
                      ) : (
                        <AvatarFallback className="text-3xl">
                          {getInitials(user?.fullName || '')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <p className="text-sm text-neutral-500">Current Profile Picture</p>
                  </div>
                  
                  <div className="flex-1">
                    <Form {...pictureForm}>
                      <form onSubmit={pictureForm.handleSubmit(handlePictureSubmit)} className="space-y-6">
                        <FormField
                          control={pictureForm.control}
                          name="image"
                          render={() => (
                            <FormItem>
                              <FormLabel>Upload New Picture</FormLabel>
                              <FormControl>
                                <div className="flex flex-col space-y-4">
                                  <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center hover:bg-neutral-50 transition-colors cursor-pointer">
                                    <Label htmlFor="profile-picture" className="cursor-pointer">
                                      <div className="flex flex-col items-center space-y-3">
                                        <Upload className="h-10 w-10 text-neutral-400" />
                                        <div className="text-sm text-neutral-600">
                                          <p className="font-medium">Click to upload</p>
                                          <p>PNG, JPG or JPEG (max. 5MB)</p>
                                        </div>
                                      </div>
                                      <Input
                                        id="profile-picture"
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg"
                                        className="hidden"
                                        onChange={handleFileChange}
                                      />
                                    </Label>
                                  </div>
                                  
                                  {pictureForm.formState.errors.image && (
                                    <div className="flex items-center space-x-2 text-red-500 text-sm">
                                      <AlertCircle className="h-4 w-4" />
                                      <span>{pictureForm.formState.errors.image.message?.toString()}</span>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="submit"
                          disabled={!pictureForm.getValues().image || uploadProfilePictureMutation.isPending}
                        >
                          {uploadProfilePictureMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Upload New Picture
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Referral Tab */}
          <TabsContent value="referral">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  {t('referral.title', 'Referral Program')}
                </CardTitle>
                <CardDescription>
                  {t('referral.description', 'Invite friends and earn rewards when they make a purchase')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReferralCard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Account information card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and authentication information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center text-neutral-700">
                  <Mail className="h-5 w-5 mr-2 text-neutral-500" />
                  <span className="font-medium">Email:</span>
                </div>
                <div className="md:flex-1">
                  {user?.email}
                  {user?.emailVerified ? (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verified</span>
                  ) : (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Not Verified</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center text-neutral-700">
                  <User className="h-5 w-5 mr-2 text-neutral-500" />
                  <span className="font-medium">Username:</span>
                </div>
                <div className="md:flex-1">{user?.username}</div>
              </div>
              
              {user?.isGoogleUser && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-800 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M17.788 5.108A9 9 0 1021 12h-8" />
                    </svg>
                  </div>
                  <div>Your account is linked with Google</div>
                </div>
              )}
              
              {user?.isFacebookUser && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-800 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </div>
                  <div>Your account is linked with Facebook</div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-neutral-500">
              For security reasons, if you need to change your email or password, please contact customer support.
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default ProfilePage;