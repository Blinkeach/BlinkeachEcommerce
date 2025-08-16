import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { SiFacebook } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import Logo from '@/components/icons/Logo';
import { Separator } from '@/components/ui/separator';

// Create schema for form validation
const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters long' }),
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifiedEmail, setIsVerifiedEmail] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Check if we have a pre-verified email from OTP process
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (email) {
      setVerifiedEmail(email);
      setIsVerifiedEmail(true);
      form.setValue('email', email);
      
      // Clean the URL but keep the email parameter
      // window.history.replaceState({}, document.title, `/register?email=${encodeURIComponent(email)}`);
      
      toast({
        title: 'Email Verified',
        description: 'Your email has been verified. Please complete your registration.',
        duration: 3000
      });
    }
  }, [location, toast]);

  // Initialize the form with default values
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      fullName: '',
      email: verifiedEmail || '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      // Remove confirmPassword and agreeTerms before sending
      const { confirmPassword, agreeTerms, ...userData } = data;
      
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    onSuccess: (data) => {
      // Store the token if it's returned
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully!',
        duration: 3000
      });
      
      // Force a complete page refresh to reset all app state
      if (data.token) {
        window.location.href = '/'; // Direct to home if we have a token with page refresh
      } else {
        window.location.href = '/login'; // Direct to login if we need to log in with page refresh
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      // Try to extract more specific error message if available
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('username')) {
          errorMessage = 'This username is already taken. Please choose another one.';
        } else if (error.message.includes('email')) {
          errorMessage = 'This email is already registered. Please use another email or try logging in.';
        }
      }
      
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  const handleGoogleLogin = () => {
    // Redirect to verify-email page first, informing that email verification is required
    toast({
      title: 'Email Verification Required',
      description: 'Please verify your email before signing up with Google.',
      duration: 3000
    });
    navigate('/verify-email');
  };

  const handleFacebookLogin = () => {
    // Redirect to verify-email page first, informing that email verification is required
    toast({
      title: 'Email Verification Required',
      description: 'Please verify your email before signing up with Facebook.',
      duration: 3000
    });
    navigate('/verify-email');
  };

  return (
    <>
      <Helmet>
        <title>Create Account - Blinkeach</title>
        <meta name="description" content="Create a new account on Blinkeach to start shopping and track your orders." />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Logo size="medium" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">Create an account</h1>
            <p className="text-neutral-600 mt-1">Join Blinkeach to start shopping!</p>
            
            {isVerifiedEmail ? (
              <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-md text-sm">
                ✓ Email verified: {verifiedEmail}
              </div>
            ) : (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/verify-email')}
                  className="w-full"
                >
                  Verify your email to continue
                </Button>
                <p className="text-xs text-neutral-500 mt-2">
                  Email verification is required before registration
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <fieldset disabled={!isVerifiedEmail} className={!isVerifiedEmail ? "opacity-60" : ""}>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            {...field} 
                            disabled={true} // Always disabled, will be set by URL param
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Create a password" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                              onClick={() => setShowPassword(!showPassword)}
                              tabIndex={!isVerifiedEmail ? -1 : undefined}
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
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm your password" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              tabIndex={!isVerifiedEmail ? -1 : undefined}
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
                  
                  <FormField
                    control={form.control}
                    name="agreeTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0 mt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I agree to the{' '}
                            <Link href="/terms">
                              <a className="text-secondary hover:underline">Terms of Service</a>
                            </Link>
                            {' '}and{' '}
                            <Link href="/privacy">
                              <a className="text-secondary hover:underline">Privacy Policy</a>
                            </Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-secondary hover:bg-secondary-dark text-white mt-6"
                    disabled={registerMutation.isPending || !isVerifiedEmail}
                  >
                    {registerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                  </Button>
                </fieldset>
                
                {!isVerifiedEmail && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                    <p className="text-sm text-amber-800 text-center">
                      Please verify your email before creating an account
                    </p>
                    <Button 
                      type="button"
                      variant="secondary"
                      className="w-full mt-2"
                      onClick={() => navigate('/verify-email')}
                    >
                      Go to Email Verification
                    </Button>
                  </div>
                )}
                
                {!isVerifiedEmail && (
                  <>
                    <Separator className="my-6" />
                    
                    <div className="text-center text-sm text-neutral-600 mb-4">
                      Or sign up with
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={handleGoogleLogin}
                      >
                        <FcGoogle className="mr-2 h-5 w-5" />
                        Continue with Google
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={handleFacebookLogin}
                      >
                        <SiFacebook className="mr-2 h-5 w-5 text-blue-600" />
                        Continue with Facebook
                      </Button>
                      
                      <div className="text-center mt-4">
                        <Link href="/login">
                          <a className="text-sm text-secondary hover:underline">
                            Verify your email with OTP instead
                          </a>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="text-center text-sm text-neutral-600 mt-4">
                  Already have an account?{' '}
                  <Link href="/login">
                    <a className="text-secondary hover:underline font-medium">
                      Log in
                    </a>
                  </Link>
                </div>
              </form>
            </Form>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              By registering, you agree to Blinkeach's{' '}
              <Link href="/terms">
                <a className="text-secondary hover:underline">Terms of Service</a>
              </Link>{' '}
              and{' '}
              <Link href="/privacy">
                <a className="text-secondary hover:underline">Privacy Policy</a>
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
