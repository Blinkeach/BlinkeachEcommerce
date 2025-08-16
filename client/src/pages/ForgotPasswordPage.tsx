import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
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
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import Logo from '@/components/icons/Logo';

// Create schema for email form validation
const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

// Create schema for OTP verification
const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }).regex(/^\d+$/, { message: 'OTP must contain only numbers' })
});

// Create schema for password reset
const passwordResetSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

// Steps for the forgot password flow
enum Step {
  EnterEmail,
  VerifyOTP,
  ResetPassword
}

const ForgotPasswordPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(Step.EnterEmail);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { forgotPasswordMutation, verifyOtpMutation, resetPasswordMutation } = useAuth();

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

  // Initialize the password reset form
  const passwordResetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onEmailSubmit = (values: EmailFormValues) => {
    setEmail(values.email);
    forgotPasswordMutation.mutate(values.email, {
      onSuccess: () => {
        setCurrentStep(Step.VerifyOTP);
      }
    });
  };

  const onOtpSubmit = (values: OtpFormValues) => {
    verifyOtpMutation.mutate({ email, otp: values.otp }, {
      onSuccess: () => {
        setCurrentStep(Step.ResetPassword);
      }
    });
  };

  const onPasswordResetSubmit = (values: PasswordResetFormValues) => {
    resetPasswordMutation.mutate({ email, password: values.password }, {
      onSuccess: () => {
        toast({
          title: 'Password Reset Successful',
          description: 'Your password has been updated. Please log in with your new password.',
          duration: 3000,
        });
        navigate('/login');
      }
    });
  };

  const handleResendOtp = () => {
    forgotPasswordMutation.mutate(email);
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - Blinkeach</title>
        <meta name="description" content="Reset your Blinkeach account password." />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Logo size="medium" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">Forgot Password</h1>
            <p className="text-neutral-600 mt-1">
              {currentStep === Step.EnterEmail && 'Enter your email to receive a verification code'}
              {currentStep === Step.VerifyOTP && 'Enter the verification code sent to your email'}
              {currentStep === Step.ResetPassword && 'Create a new password for your account'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Back button */}
            {currentStep !== Step.EnterEmail && (
              <Button
                type="button"
                variant="ghost"
                className="mb-4 -ml-2 text-neutral-600"
                onClick={() => setCurrentStep(currentStep === Step.VerifyOTP ? Step.EnterEmail : Step.VerifyOTP)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}

            {/* Step 1: Enter Email */}
            {currentStep === Step.EnterEmail && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your registered email" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-secondary hover:bg-secondary-dark text-white mt-4"
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Verification Code
                  </Button>
                </form>
              </Form>
            )}

            {/* Step 2: Verify OTP */}
            {currentStep === Step.VerifyOTP && (
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
                      disabled={forgotPasswordMutation.isPending}
                      className="sm:flex-1"
                    >
                      {forgotPasswordMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Resend Code
                    </Button>
                    
                    <Button 
                      type="submit"
                      disabled={verifyOtpMutation.isPending}
                      className="sm:flex-1 bg-secondary hover:bg-secondary-dark text-white"
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

            {/* Step 3: Reset Password */}
            {currentStep === Step.ResetPassword && (
              <Form {...passwordResetForm}>
                <form onSubmit={passwordResetForm.handleSubmit(onPasswordResetSubmit)} className="space-y-4">
                  <FormField
                    control={passwordResetForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter new password" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordResetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm new password" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-secondary hover:bg-secondary-dark text-white mt-4"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reset Password
                  </Button>
                </form>
              </Form>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Remember your password?{' '}
              <Link href="/login" className="text-secondary hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-500">
              By continuing, you agree to Blinkeach's{' '}
              <Link href="/terms-and-conditions" className="text-secondary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-secondary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;