import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * AuthSuccessPage handles the redirect from social authentication providers
 * It extracts the JWT token from the URL, stores it, and redirects to the home page
 */
const AuthSuccessPage = () => {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      // Store token in localStorage
      localStorage.setItem('auth_token', token);
      
      // Invalidate auth queries to fetch fresh user data
      queryClient.invalidateQueries({queryKey: ['/api/auth/user']});
      
      // Show success toast
      toast({
        title: 'Login Successful',
        description: 'You have successfully logged in with your social account.',
        duration: 3000
      });
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      // If no token, show error and redirect to login
      toast({
        title: 'Authentication Failed',
        description: 'Social login was not successful. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [navigate, queryClient, toast]);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <Loader2 className="h-8 w-8 text-secondary animate-spin mb-4" />
          <h1 className="text-xl font-bold text-neutral-800 mb-2">Processing Login</h1>
          <p className="text-neutral-600">
            Please wait while we complete your social login...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSuccessPage;