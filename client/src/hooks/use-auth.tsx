import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Types
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  profilePicture?: string | null;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isAdmin: boolean;
  isGoogleUser?: boolean;
  isFacebookUser?: boolean;
  emailVerified?: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
  sendOtpMutation: UseMutationResult<any, Error, string>;
  verifyOtpMutation: UseMutationResult<any, Error, { email: string; otp: string }>;
  forgotPasswordMutation: UseMutationResult<any, Error, string>;
  resetPasswordMutation: UseMutationResult<any, Error, { email: string; password: string }>;
}

// Create context
export const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Get user from token in localStorage on first load
  const [initializing, setInitializing] = useState(true);

  // Check for token in localStorage
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token && !user) {
      // If we have a token but no user data, fetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
    setInitializing(false);
  }, []);

  // Fetch user data if we have a token
  const {
    data: user = null,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        // Add authorization header with token if it exists
        const token = localStorage.getItem("auth_token");
        if (!token) return null;

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const res = await fetch("/api/auth/user", { headers });
        if (res.status === 401) {
          localStorage.removeItem("auth_token");
          return null;
        }
        
        if (!res.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        return res.json();
      } catch (error) {
        return null;
      }
    },
    enabled: !initializing,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      // Store token
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      
      // Update user data in cache
      queryClient.setQueryData(["/api/auth/user"], data.user);
      
      // Show success toast
      toast({
        title: "Login successful",
        description: "You've been successfully logged in",
        duration: 3000,
      });
      
      // Refresh the page completely and redirect based on user role
      if (data.user.isAdmin) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return res.json();
    },
    onSuccess: (data) => {
      // If registration returns a token, store it and set user data
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        queryClient.setQueryData(["/api/auth/user"], data.user);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created and you are now logged in",
          duration: 3000,
        });
        
        // Refresh the page completely and redirect to home
        window.location.href = "/";
      } else {
        // If no token is returned, show success and redirect to login with page refresh
        toast({
          title: "Registration successful",
          description: "Your account has been created. Please log in",
          duration: 3000,
        });
        
        window.location.href = "/login";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear token and user data
      localStorage.removeItem("auth_token");
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Show success toast
      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
        duration: 3000,
      });
      
      // Refresh the page and redirect to login page
      window.location.href = "/login";
    },
    onError: () => {
      // Even if the server request fails, we still want to clear local auth state
      localStorage.removeItem("auth_token");
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.href = "/login";
    },
  });

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/send-otp", { email });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your email",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP",
        variant: "destructive",
      });
    },
  });

  // Forgot Password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Reset Code Sent",
          description: "A password reset code has been sent to your email",
          duration: 3000,
        });
      } else {
        // For security reasons, we don't reveal if the email exists or not
        toast({
          title: "Reset Code Sent",
          description: "If this email is registered, a reset code has been sent",
          duration: 3000,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Reset Code",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Reset Password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. Please log in with your new password",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Could not reset your password. Please try again",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || initializing,
        error,
        isAuthenticated: !!user,
        loginMutation,
        logoutMutation,
        registerMutation,
        sendOtpMutation,
        verifyOtpMutation,
        forgotPasswordMutation,
        resetPasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for easy context use
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}