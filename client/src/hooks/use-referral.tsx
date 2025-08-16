import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

interface Referral {
  id: number;
  userId: number;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

interface ReferralReward {
  id: number;
  referrerId: number;
  referredUserId: number;
  orderId: number;
  amount: number;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

interface ReferralRewardsResponse {
  rewards: ReferralReward[];
  totalAmount: number;
  pendingCount: number;
}

interface ValidateResponse {
  valid: boolean;
  referrerId?: number;
  message?: string;
}

export function useReferral() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Get the user's referral code
  const { 
    data: referral,
    isLoading: isLoadingReferral,
    error: referralError,
    refetch: refetchReferral
  } = useQuery({
    queryKey: ['/api/referral'],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest('GET', '/api/referral');
      return res.json() as Promise<Referral>;
    },
    enabled: !!user
  });

  // Get the user's rewards
  const {
    data: rewardsData,
    isLoading: isLoadingRewards,
    error: rewardsError,
    refetch: refetchRewards
  } = useQuery({
    queryKey: ['/api/referral/rewards'],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest('GET', '/api/referral/rewards');
      return res.json() as Promise<ReferralRewardsResponse>;
    },
    enabled: !!user
  });

  // Create a new referral code
  const createReferralMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/referral');
      return res.json() as Promise<Referral>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/referral'], data);
      toast({
        title: t('referral.code_created'),
        description: t('referral.code_created_description'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('referral.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Validate a referral code
  const validateReferralMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('GET', `/api/referral/validate/${code}`);
      return res.json() as Promise<ValidateResponse>;
    },
    onError: (error: Error) => {
      toast({
        title: t('referral.validation_error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    referral,
    isLoadingReferral,
    referralError,
    rewardsData,
    isLoadingRewards,
    rewardsError,
    createReferralMutation,
    validateReferralMutation,
    refetchReferral,
    refetchRewards
  };
}