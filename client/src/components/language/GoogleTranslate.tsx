import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { FlagIcon } from '@/components/icons/FlagIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Comprehensive list of Indian languages supported by i18next
const indianLanguages = {
  en: { name: 'English', nativeName: 'English', countryCode: 'gb', code: 'en' },
  hi: { name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', code: 'hi' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', code: 'bn' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', code: 'te' },
  mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', code: 'mr' },
  ta: { name: 'Tamil', nativeName: 'தமিழ்', flag: '🇮🇳', code: 'ta' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', code: 'gu' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', code: 'kn' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', code: 'ml' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', code: 'pa' }
};

interface GoogleTranslateProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  showLabel?: boolean;
  alignment?: 'start' | 'end';
  size?: 'sm' | 'default' | 'lg';
}

export function GoogleTranslate({
  variant = 'ghost',
  showLabel = false,
  alignment = 'end',
  size = 'default'
}: GoogleTranslateProps = {}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  // Function to change language using i18next
  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setOpen(false);
  };

  const getCurrentLanguageInfo = () => {
    const currentLang = i18n.language || 'en';
    return indianLanguages[currentLang as keyof typeof indianLanguages] || indianLanguages.en;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="gap-2 items-center"
          aria-label="Select Language"
        >
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span>Language</span>
          )}
          <span className="hidden md:inline">{getCurrentLanguageInfo().name}</span>
          <span className="text-base md:hidden">{getCurrentLanguageInfo().flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignment} className="w-56 max-h-80 overflow-y-auto">
        {Object.entries(indianLanguages).map(([code, { name, nativeName, flag }]) => (
          <DropdownMenuItem 
            key={code}
            className="flex items-center justify-between gap-2 cursor-pointer py-3"
            onClick={() => changeLanguage(code)}
          >
            <span className="flex items-center gap-3">
              <span className="text-base">{flag}</span>
              <div className="flex flex-col">
                <span className="font-medium">{name}</span>
                {nativeName !== name && (
                  <span className="text-xs text-muted-foreground">{nativeName}</span>
                )}
              </div>
            </span>
            <div className="flex items-center gap-1">
              {i18n.language === code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}