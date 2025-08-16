import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  showLabel?: boolean;
  alignment?: 'start' | 'end';
  size?: 'sm' | 'default' | 'lg';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'outline',
  showLabel = true,
  alignment = 'end',
  size = 'default'
}) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const [open, setOpen] = useState(false);

  // Get the current language name to display
  const currentLangName = supportedLanguages[currentLanguage]?.name || 'English';

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
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignment} className="w-40">
        {Object.entries(supportedLanguages).map(([code, { name }]) => (
          <DropdownMenuItem 
            key={code}
            className="flex items-center justify-between gap-2 cursor-pointer"
            onClick={() => {
              changeLanguage(code);
              setOpen(false);
            }}
          >
            <span>{name}</span>
            {currentLanguage === code && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;