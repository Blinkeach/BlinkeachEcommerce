import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import Logo from '@/components/icons/Logo';

// Create schema for email form validation
const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

// Create schema for OTP form validation
const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }).regex(/^\d+$/, { message: 'OTP must contain only numbers' })
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

const OTPVerificationPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { sendOtpMutation, verifyOtpMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Initialize the email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Initialize the OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onEmailSubmit = (data: EmailFormValues) => {
    setEmail(data.email);
    sendOtpMutation.mutate(data.email, {
      onSuccess: () => {
        setOtpSent(true);
      }
    });
  };

  const onOtpSubmit = (data: OtpFormValues) => {
    verifyOtpMutation.mutate({ email, otp: data.otp }, {
      onSuccess: (data) => {
        // Check if the user already exists based on the response
        const userExists = data.userExists;
        
        if (userExists) {
          // If the user already exists, offer to log in
          toast({
            title: 'Email Verified',
            description: 'This email is already registered. You can log in to your account.',
            duration: 3000
          });
          
          // Redirect to login page with the verified email
          navigate(`/login?email=${encodeURIComponent(email)}&verified=true`);
        } else {
          // If it's a new user, proceed to registration
          toast({
            title: 'Email Verified',
            description: 'Your email has been verified. You can now complete your registration.',
            duration: 3000
          });
          
          // Redirect to register page with the verified email
          navigate(`/register?email=${encodeURIComponent(email)}`);
        }
      }
    });
  };

  const handleResendOtp = () => {
    sendOtpMutation.mutate(email);
  };

  return (
    <>
      <Helmet>
        <title>Email Verification - Blinkeach</title>
        <meta name="description" content="Verify your email to create an account with Blinkeach." />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Logo size="medium" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">Email Verification</h1>
            <p className="text-neutral-600 mt-1">
              {!otpSent 
                ? 'Enter your email to receive a verification code' 
                : 'Enter the 6-digit code sent to your email'
              }
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            {!otpSent ? (
              // Email form
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              {...field} 
                            />
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-secondary hover:bg-secondary-dark text-white mt-4"
                    disabled={sendOtpMutation.isPending}
                  >
                    {sendOtpMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Verification Code
                  </Button>
                </form>
              </Form>
            ) : (
              // OTP form
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                  <div className="mb-4 p-2 bg-neutral-50 rounded-md text-center">
                    <p className="text-sm text-neutral-600">We've sent a code to</p>
                    <p className="font-medium">{email}</p>
                  </div>
                  
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter 6-digit code" 
                            {...field} 
                            maxLength={6}
                            className="text-center text-xl tracking-widest font-medium"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-between mt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleResendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="sm:flex-1"
                    >
                      {sendOtpMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Resend Code
                    </Button>
                    
                    <Button 
                      type="submit"
                      disabled={verifyOtpMutation.isPending}
                      className="sm:flex-1"
                    >
                      {verifyOtpMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Verify & Continue
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <a href="/login" className="text-secondary hover:underline font-medium">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default OTPVerificationPage;