import React, { useState } from "react";
import { useReferral } from "@/hooks/use-referral";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export function ReferralCard() {
  const { t } = useTranslation();
  const { 
    referral, 
    isLoadingReferral, 
    rewardsData, 
    createReferralMutation,
  } = useReferral();
  
  const [copied, setCopied] = useState(false);
  
  const handleCopyCode = () => {
    if (referral?.referralCode) {
      navigator.clipboard.writeText(referral.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleShare = async () => {
    if (referral?.referralCode) {
      const shareText = t('referral.share_text', { 
        code: referral.referralCode,
        url: window.location.origin
      });
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: t('referral.share_title'),
            text: shareText,
            url: window.location.origin
          });
        } catch (error) {
          console.error("Error sharing:", error);
        }
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };
  
  const handleCreateCode = () => {
    createReferralMutation.mutate();
  };
  
  if (isLoadingReferral) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          {t('referral.invite_friends')}
        </CardTitle>
        <CardDescription>
          {t('referral.invite_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {referral ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('referral.your_code')}</label>
              <div className="flex gap-2">
                <Input 
                  value={referral.referralCode} 
                  readOnly 
                  className="font-medium text-lg tracking-wider"
                />
                <Button variant="outline" size="icon" onClick={handleCopyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Alert className="bg-primary/10 border-primary/20">
              <AlertTitle className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                {t('referral.how_it_works')}
              </AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('referral.friend_benefit')}</li>
                  <li>{t('referral.your_benefit', { amount: '₹40' })}</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {rewardsData && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-medium">{t('referral.your_rewards')}</h3>
                  <div className="flex justify-between items-center">
                    <span>{t('referral.total_earned')}</span>
                    <Badge variant="outline" className="font-medium text-lg">
                      ₹{rewardsData.totalAmount}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('referral.friends_referred')}</span>
                    <Badge variant="outline">
                      {rewardsData.rewards.length}
                    </Badge>
                  </div>
                  {rewardsData.pendingCount > 0 && (
                    <div className="flex justify-between items-center">
                      <span>{t('referral.pending_rewards')}</span>
                      <Badge>
                        {rewardsData.pendingCount}
                      </Badge>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="mb-4">{t('referral.no_code_yet')}</p>
            <Button onClick={handleCreateCode} disabled={createReferralMutation.isPending}>
              {createReferralMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-current"></span>
                  {t('referral.generating')}
                </span>
              ) : t('referral.create_code')}
            </Button>
          </div>
        )}
      </CardContent>
      {referral && (
        <CardFooter>
          <Button className="w-full" onClick={handleShare} variant="default">
            <Share2 className="h-4 w-4 mr-2" />
            {t('referral.share_with_friends')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}