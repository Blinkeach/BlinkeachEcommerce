import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown } from 'lucide-react';
import { FlagIcon } from '@/components/icons/FlagIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Comprehensive list of Indian languages with flag images
const languages = {
  en: { name: 'English', nativeName: 'English', countryCode: 'gb', code: 'en' },
  hi: { name: 'Hindi', nativeName: 'हिंदी', countryCode: 'in', code: 'hi' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', countryCode: 'in', code: 'bn' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', countryCode: 'in', code: 'te' },
  mr: { name: 'Marathi', nativeName: 'मराठी', countryCode: 'in', code: 'mr' },
  ta: { name: 'Tamil', nativeName: 'தமিழ்', countryCode: 'in', code: 'ta' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', countryCode: 'in', code: 'gu' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', countryCode: 'in', code: 'kn' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', countryCode: 'in', code: 'ml' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', countryCode: 'in', code: 'pa' }
};

interface LanguageSelectorProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  showLabel?: boolean;
  alignment?: 'start' | 'end';
  size?: 'sm' | 'default' | 'lg';
}

export function LanguageSelectorWithFlags({
  variant = 'ghost',
  showLabel = false,
  alignment = 'end',
  size = 'default'
}: LanguageSelectorProps = {}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  // Function to change language using i18next
  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setOpen(false);
  };

  const getCurrentLanguageInfo = () => {
    const currentLang = i18n.language || 'en';
    return languages[currentLang as keyof typeof languages] || languages.en;
  };

  const currentLang = getCurrentLanguageInfo();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="gap-2 items-center hover:bg-gray-100 transition-colors"
          aria-label="Select Language"
        >
          <FlagIcon countryCode={currentLang.countryCode} size={18} />
          {showLabel && (
            <span className="hidden sm:inline">Language</span>
          )}
          <span className="hidden md:inline font-medium">{currentLang.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignment} className="w-64 max-h-80 overflow-y-auto">
        <div className="p-2">
          <p className="text-xs text-gray-500 mb-2 px-2">Select your language</p>
          {Object.entries(languages).map(([code, { name, nativeName, countryCode }]) => (
            <DropdownMenuItem 
              key={code}
              className="flex items-center justify-between gap-3 cursor-pointer py-3 px-2 rounded-md hover:bg-gray-50"
              onClick={() => changeLanguage(code)}
            >
              <div className="flex items-center gap-3">
                <FlagIcon countryCode={countryCode} size={20} />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{name}</span>
                  {nativeName !== name && (
                    <span className="text-xs text-gray-500">{nativeName}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {i18n.language === code && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}