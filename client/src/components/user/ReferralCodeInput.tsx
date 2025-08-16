import React, { useState } from "react";
import { useReferral } from "@/hooks/use-referral";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X } from "lucide-react";

interface ReferralCodeInputProps {
  onValidCode: (referrerId: number) => void;
  onClear: () => void;
}

export function ReferralCodeInput({ onValidCode, onClear }: ReferralCodeInputProps) {
  const { t } = useTranslation();
  const { validateReferralMutation } = useReferral();
  
  const [code, setCode] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleValidate = async () => {
    if (!code.trim()) {
      setErrorMessage(t('referral.code_required'));
      setIsValid(false);
      return;
    }
    
    try {
      const result = await validateReferralMutation.mutateAsync(code.trim());
      if (result.valid) {
        setIsValid(true);
        setErrorMessage(null);
        if (result.referrerId) {
          onValidCode(result.referrerId);
        }
      } else {
        setIsValid(false);
        setErrorMessage(result.message || t('referral.invalid_code'));
        onClear();
      }
    } catch (error) {
      setIsValid(false);
      setErrorMessage(t('referral.validation_error'));
      onClear();
    }
  };
  
  const handleClear = () => {
    setCode("");
    setIsValid(null);
    setErrorMessage(null);
    onClear();
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('referral.enter_code')}</label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (isValid !== null) {
              setIsValid(null);
              setErrorMessage(null);
            }
          }}
          placeholder={t('referral.code_placeholder')}
          className="font-medium uppercase"
          disabled={isValid === true || validateReferralMutation.isPending}
        />
        
        {isValid === null ? (
          <Button 
            variant="outline" 
            onClick={handleValidate}
            disabled={!code.trim() || validateReferralMutation.isPending}
          >
            {validateReferralMutation.isPending ? (
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-current"></span>
            ) : t('referral.apply')}
          </Button>
        ) : isValid ? (
          <Button variant="outline" size="icon" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="icon" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isValid === true && (
        <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm">
              {t('referral.code_applied')}
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      {isValid === false && errorMessage && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <AlertDescription className="text-sm">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}