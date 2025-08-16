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
import { 
  Eye, EyeOff, Loader2, Mail,
} from 'lucide-react';
import { SiFacebook } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import Logo from '@/components/icons/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

// Create schema for form validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  rememberMe: z.boolean().optional()
});

const otpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }).regex(/^\d+$/, { message: 'OTP must contain only numbers' })
});

type LoginFormValues = z.infer<typeof loginSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

const LoginPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('email');
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  
  // Check for token in URL (for social login redirects) or verified email from OTP
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    const verified = params.get('verified');
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('auth_token', token);
    }
    
    if (email && verified === 'true') {
      // Pre-fill the login form with the verified email
      form.setValue('email', email);
      toast({
        title: 'Email Verified',
        description: 'Your email has been verified. Please log in with your password.',
        duration: 3000
      });
      
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, toast]);

  // Initialize the form with default values
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    },
  });

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Store the token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      toast({
        title: t('login.login_successful'),
        description: t('login.login_success_message'),
        duration: 3000
      });
      
      // Force a complete page refresh to reset all app state
      if (data.user.isAdmin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
      toast({
        title: t('login.login_failed'),
        description: t('login.login_failed_message'),
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  // OTP request mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/auth/send-otp', { email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('login.otp.otp_sent'),
        description: t('login.otp.otp_sent_message'),
        duration: 5000
      });
      setShowOtpDialog(true);
    },
    onError: (error) => {
      console.error('OTP request error:', error);
      toast({
        title: t('login.otp.otp_failed'),
        description: t('login.otp.otp_failed_message'),
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  // OTP verification mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpFormValues) => {
      const response = await apiRequest('POST', '/api/auth/verify-otp', data);
      return response.json();
    },
    onSuccess: (data) => {
      const userExists = data.userExists;
      
      toast({
        title: t('login.otp.verification_success'),
        description: t('login.otp.verification_success_message'),
        duration: 3000
      });
      
      setShowOtpDialog(false);
      
      if (userExists) {
        // If user already exists, stay on login page with email pre-filled
        form.setValue('email', otpEmail);
        toast({
          title: t('login.otp.account_exists'),
          description: t('login.otp.account_exists_message'),
          duration: 3000
        });
      } else {
        // If new user, redirect to registration
        navigate('/register?email=' + encodeURIComponent(otpEmail));
      }
    },
    onError: (error) => {
      console.error('OTP verification error:', error);
      toast({
        title: t('login.otp.verification_failed'),
        description: t('login.otp.verification_failed_message'),
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const handleOtpRequest = () => {
    const email = form.getValues().email;
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError('email', { message: 'Please enter a valid email address' });
      return;
    }
    
    setOtpEmail(email);
    otpForm.setValue('email', email);
    sendOtpMutation.mutate(email);
  };

  const handleOtpSubmit = (values: OtpFormValues) => {
    verifyOtpMutation.mutate(values);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Helmet>
        <title>{t('login.page_title')} - Blinkeach</title>
        <meta name="description" content={t('login.meta_description')} />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Logo size="medium" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">{t('login.heading')}</h1>
            <p className="text-neutral-600 mt-1">{t('login.welcome_message')}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email">{t('login.email_login')}</TabsTrigger>
                <TabsTrigger value="social">{t('login.social_login')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('login.form.email_label')}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t('login.form.email_placeholder')} {...field} />
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
                          <FormLabel>{t('login.form.password_label')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder={t('login.form.password_placeholder')} 
                                {...field} 
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                onClick={togglePasswordVisibility}
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
                    
                    <div className="flex items-center justify-between">
                      <FormField
                        control={form.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">{t('login.form.remember_me')}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Link href="/forgot-password" className="text-sm text-secondary hover:underline">
                        {t('login.form.forgot_password')}
                      </Link>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-secondary hover:bg-secondary-dark text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t('login.form.submit_button')}
                    </Button>
                    
                    {/* Removed the "Sign up with OTP verification" button as per new requirements */}
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="social">
                <div className="space-y-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleLogin}
                  >
                    <FcGoogle className="mr-2 h-5 w-5" />
                    {t('login.social.google')}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleFacebookLogin}
                  >
                    <SiFacebook className="mr-2 h-5 w-5 text-blue-600" />
                    {t('login.social.facebook')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="text-center text-sm text-neutral-600 mt-6">
              {t('login.register_prompt')}{' '}
              <Link href="/register" className="text-secondary hover:underline font-medium">
                {t('login.register_link')}
              </Link>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              {t('login.terms_agreement')}{' '}
              <Link href="/terms-and-conditions" className="text-secondary hover:underline">
                {t('login.terms_link')}
              </Link>{' '}
              {t('login.and')}{' '}
              <Link href="/privacy-policy" className="text-secondary hover:underline">
                {t('login.privacy_link')}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
      
      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('login.otp.dialog_title')}</DialogTitle>
            <DialogDescription>
              {t('login.otp.dialog_description')} {otpEmail}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.otp.verification_code')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('login.otp.code_placeholder')} 
                        {...field} 
                        maxLength={6}
                        className="text-center text-xl tracking-widest"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => sendOtpMutation.mutate(otpEmail)}
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('login.otp.resend_button')}
                </Button>
                
                <Button 
                  type="submit"
                  disabled={verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('login.otp.verify_button')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginPage;
