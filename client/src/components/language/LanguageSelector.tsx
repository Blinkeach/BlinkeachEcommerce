import React, { useState } from 'react';
import { useLanguage, languages, type LanguageCode } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  showLabel?: boolean;
  alignment?: 'start' | 'end';
  size?: 'sm' | 'default' | 'lg';
}

export function LanguageSelector({
  variant = 'ghost',
  showLabel = false,
  alignment = 'end',
  size = 'default'
}: LanguageSelectorProps = {}) {
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Get the flags for each language
  const languageFlags: Record<string, string> = {
    en: '🇬🇧',
    hi: '🇮🇳',
    te: '🇮🇳',
    mr: '🇮🇳',
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="gap-2 items-center"
          aria-label={t('common.language')}
        >
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span>{t('common.language')}</span>
          )}
          <span className="hidden md:inline">{languages[currentLanguage as LanguageCode]?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignment} className="w-48">
        {Object.entries(languages).map(([code, { name }]) => (
          <DropdownMenuItem 
            key={code}
            className="flex items-center justify-between gap-2 cursor-pointer"
            onClick={() => {
              setLanguage(code as LanguageCode);
              setOpen(false);
            }}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{languageFlags[code as LanguageCode]}</span>
              <span>{name}</span>
            </span>
            {currentLanguage === code && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}