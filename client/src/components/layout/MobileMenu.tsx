import React, { useEffect } from 'react';
import { Link } from 'wouter';
import TransitionLink from './TransitionLink';
import { 
  X, 
  User, 
  Home, 
  ShoppingBag, 
  Heart, 
  Package, 
  Gift, 
  Headphones, 
  LogOut, 
  LogIn,
  UserPlus,
  LayoutDashboard,
  Settings,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage, languages, type LanguageCode } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { user, logoutMutation } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.fullName) return 'U';
    
    const nameParts = user.fullName.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white h-full w-4/5 max-w-xs overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-medium text-lg">Menu</h2>
          <Button variant="ghost" onClick={onClose} size="icon">
            <X className="h-5 w-5 text-neutral-700" />
          </Button>
        </div>
        
        <div className="p-4 bg-secondary text-white">
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={user.profilePicture || ''} alt={user.fullName} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-secondary-foreground">{user.email}</p>
                </div>
              </>
            ) : (
              <>
                <User className="h-6 w-6" />
                <div>
                  <p className="font-medium">Welcome, Guest</p>
                  <p className="text-sm">
                    <Link href="/login">
                      <span className="underline cursor-pointer" onClick={onClose}>Sign in</span>
                    </Link> or{' '}
                    <Link href="/register">
                      <span className="underline cursor-pointer" onClick={onClose}>Register</span>
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        <ul className="py-2">
          <li>
            <TransitionLink href="/">
              <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                <Home className="h-5 w-5 mr-3" /> Home
              </div>
            </TransitionLink>
          </li>
          <li>
            <TransitionLink href="/shop">
              <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                <ShoppingBag className="h-5 w-5 mr-3" /> Shop by Category
              </div>
            </TransitionLink>
          </li>
          
          {user ? (
            <>
              <li>
                <TransitionLink href="/profile">
                  <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                    <User className="h-5 w-5 mr-3" /> My Profile
                  </div>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/wishlist">
                  <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                    <Heart className="h-5 w-5 mr-3" /> My Wishlist
                  </div>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/orders">
                  <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                    <Package className="h-5 w-5 mr-3" /> My Orders
                  </div>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/account-settings">
                  <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                    <Settings className="h-5 w-5 mr-3" /> Account Settings
                  </div>
                </TransitionLink>
              </li>
              {user.isAdmin && (
                <li>
                  <TransitionLink href="/admin">
                    <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                      <LayoutDashboard className="h-5 w-5 mr-3" /> Admin Dashboard
                    </div>
                  </TransitionLink>
                </li>
              )}
              <li>
                <button 
                  className="w-full text-left flex items-center px-4 py-3 hover:bg-neutral-100 border-b text-red-600" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-5 w-5 mr-3" /> 
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <TransitionLink href="/login">
                  <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                    <LogIn className="h-5 w-5 mr-3" /> Login
                  </div>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/register">
                  <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                    <UserPlus className="h-5 w-5 mr-3" /> Register
                  </div>
                </TransitionLink>
              </li>
            </>
          )}

          <Separator className="my-2" />
          
          {/* Language Selection */}
          <li className="border-b">
            <div className="px-4 py-3">
              <div className="flex items-center mb-2">
                <Globe className="h-5 w-5 mr-3" />
                <span className="font-medium">Select Language</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-8">
                {Object.entries(languages).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLanguage(code as LanguageCode);
                    }}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md ${
                      currentLanguage === code
                        ? 'bg-secondary text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200'
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </li>
          
          <li>
            <TransitionLink href="/offers">
              <div className="flex items-center px-4 py-3 hover:bg-neutral-100 border-b cursor-pointer" onClick={onClose}>
                <Gift className="h-5 w-5 mr-3" /> Offers Zone
              </div>
            </TransitionLink>
          </li>
          <li>
            <TransitionLink href="/help-faq">
              <div className="flex items-center px-4 py-3 hover:bg-neutral-100 cursor-pointer" onClick={onClose}>
                <Headphones className="h-5 w-5 mr-3" /> Customer Service
              </div>
            </TransitionLink>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MobileMenu;
