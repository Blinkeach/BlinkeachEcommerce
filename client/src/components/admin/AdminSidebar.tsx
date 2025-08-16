import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAdminNotifications } from '@/hooks/use-admin-notifications';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  ChevronDown,
  MessageCircle,
  PackageOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Logo from '@/components/icons/Logo';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  exact?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  href,
  icon,
  children,
  active,
  onClick,
  exact = false
}) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
          active
            ? "bg-secondary text-white"
            : "text-neutral-600 hover:bg-neutral-100"
        )}
        onClick={onClick}
      >
        {icon}
        <span>{children}</span>
      </div>
    </Link>
  );
};

const AdminSidebar: React.FC<{ onMobileClose?: () => void }> = ({ onMobileClose }) => {
  const [location] = useLocation();
  const { messageCount, supportRequestsCount, liveChatCount, returnRequestsCount } = useAdminNotifications();
  
  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location === path;
    }
    return location.startsWith(path);
  };

  return (
    <div className="flex h-full w-full flex-col bg-white border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Logo size="small" />
            <span className="font-medium">Admin</span>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2 px-3">
        <div className="space-y-1">
          <SidebarLink
            href="/admin"
            icon={<LayoutDashboard className="h-4 w-4" />}
            active={isActive('/admin', true)}
            onClick={onMobileClose}
            exact
          >
            Dashboard
          </SidebarLink>
          <SidebarLink
            href="/admin/products"
            icon={<Package className="h-4 w-4" />}
            active={isActive('/admin/products')}
            onClick={onMobileClose}
          >
            Products
          </SidebarLink>
          <SidebarLink
            href="/admin/orders"
            icon={<ShoppingCart className="h-4 w-4" />}
            active={isActive('/admin/orders')}
            onClick={onMobileClose}
          >
            Orders
          </SidebarLink>
          <SidebarLink
            href="/admin/customers"
            icon={<Users className="h-4 w-4" />}
            active={isActive('/admin/customers')}
            onClick={onMobileClose}
          >
            Customers
          </SidebarLink>
          <SidebarLink
            href="/admin/analytics"
            icon={<TrendingUp className="h-4 w-4" />}
            active={isActive('/admin/analytics')}
            onClick={onMobileClose}
          >
            Analytics
          </SidebarLink>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-1">
          <SidebarLink
            href="/admin/settings"
            icon={<Settings className="h-4 w-4" />}
            active={isActive('/admin/settings')}
            onClick={onMobileClose}
          >
            Settings
          </SidebarLink>
          <SidebarLink
            href="/admin/messages"
            icon={<MessageSquare className="h-4 w-4" />}
            active={isActive('/admin/messages')}
            onClick={onMobileClose}
          >
            Messages
            {messageCount > 0 && (
              <span className="ml-auto bg-secondary text-white text-xs py-0.5 px-1.5 rounded-full">
                {messageCount}
              </span>
            )}
          </SidebarLink>
          <SidebarLink
            href="/admin/support"
            icon={<PhoneCall className="h-4 w-4" />}
            active={isActive('/admin/support')}
            onClick={onMobileClose}
          >
            Support Requests
            {supportRequestsCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs py-0.5 px-1.5 rounded-full">
                {supportRequestsCount}
              </span>
            )}
          </SidebarLink>
          <SidebarLink
            href="/admin/returns"
            icon={<PackageOpen className="h-4 w-4" />}
            active={isActive('/admin/returns')}
            onClick={onMobileClose}
          >
            Return Requests
            {returnRequestsCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs py-0.5 px-1.5 rounded-full">
                {returnRequestsCount}
              </span>
            )}
          </SidebarLink>
          <SidebarLink
            href="/admin/livechat"
            icon={<MessageCircle className="h-4 w-4" />}
            active={isActive('/admin/livechat')}
            onClick={onMobileClose}
          >
            Live Chat
            {liveChatCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs py-0.5 px-1.5 rounded-full">
                {liveChatCount}
              </span>
            )}
          </SidebarLink>
          <SidebarLink
            href="/admin/help"
            icon={<HelpCircle className="h-4 w-4" />}
            active={isActive('/admin/help')}
            onClick={onMobileClose}
          >
            Help & Support
          </SidebarLink>
        </div>
      </div>
      
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-white">
            <span className="text-sm font-medium">A</span>
          </div>
          <div>
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-neutral-500">admin@blinkeach.com</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="outline" className="w-full justify-start text-red-600" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
