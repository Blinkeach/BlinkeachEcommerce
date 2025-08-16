import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Dashboard from '@/components/admin/Dashboard';
import ProductManagement from '@/components/admin/ProductManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import CustomerManagement from '@/components/admin/CustomerManagement';
import SupportRequestsPanel from '@/components/admin/SupportRequestsPanel';
import MessagesPanel from '@/components/admin/MessagesPanel';
import LiveChatPanel from '@/components/admin/LiveChatPanel';
import ReturnRequestsPanel from '@/components/admin/ReturnRequestsPanel';
import NavbarSettings from '@/components/admin/NavbarSettings';
import { useMobile } from '@/hooks/use-mobile';
import { AdminNotificationsProvider } from '@/hooks/use-admin-notifications';

const AdminPage: React.FC = () => {
  const [, params] = useRoute('/admin/:tab?');
  const [location, navigate] = useLocation();
  const isMobile = useMobile();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Get current tab or default to dashboard
  const currentTab = params?.tab || '';

  useEffect(() => {
    // Handle invalid tabs by redirecting to dashboard
    if (params?.tab && !['products', 'orders', 'customers', 'analytics', 'settings', 'messages', 'help', 'support', 'livechat', 'returns'].includes(params.tab)) {
      navigate('/admin');
    }
  }, [params, navigate]);

  // Set the title based on the current tab
  const getTabTitle = () => {
    switch (currentTab) {
      case 'products': return 'Product Management';
      case 'orders': return 'Order Management';
      case 'customers': return 'Customer Management';
      case 'analytics': return 'Analytics';
      case 'settings': return 'Settings';
      case 'messages': return 'Messages';
      case 'help': return 'Help & Support';
      case 'support': return 'Support Requests';
      case 'livechat': return 'Live Chat';
      case 'returns': return 'Return Requests';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'support':
        return <div className="space-y-6">
          <h1 className="text-2xl font-bold">Support Requests</h1>
          <SupportRequestsPanel />
        </div>;
      case 'analytics':
        return <div className="p-6"><h1 className="text-2xl font-bold mb-6">Analytics</h1><p>Analytics functionality is coming soon.</p></div>;
      case 'settings':
        return <div className="space-y-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <NavbarSettings />
        </div>;
      case 'messages':
        return <div className="space-y-6">
          <h1 className="text-2xl font-bold">Contact Messages</h1>
          <MessagesPanel />
        </div>;
      case 'livechat':
        return <div className="space-y-6">
          <h1 className="text-2xl font-bold">Live Chat</h1>
          <LiveChatPanel />
        </div>;
      case 'help':
        return <div className="p-6"><h1 className="text-2xl font-bold mb-6">Help & Support</h1><p>Help & Support functionality is coming soon.</p></div>;
      case 'returns':
        return <div className="space-y-6">
          <h1 className="text-2xl font-bold">Return Requests</h1>
          <ReturnRequestsPanel />
        </div>;
      default:
        return <Dashboard />;
    }
  };

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <>
      <Helmet>
        <title>{getTabTitle()} - Blinkeach Admin</title>
        <meta name="description" content={`Admin ${getTabTitle()} for Blinkeach e-commerce platform.`} />
      </Helmet>

      <div className="flex h-screen bg-neutral-50">
        {/* Sidebar for desktop */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar */}
        {isMobile && showMobileSidebar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
            <div className="w-64 h-full">
              <AdminSidebar onMobileClose={toggleMobileSidebar} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="bg-white border-b h-14 flex items-center justify-between px-4 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-medium">Blinkeach Admin</h1>
            <div className="w-8"></div> {/* Spacer for centering the title */}
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
};

// Wrap the AdminPage with the AdminNotificationsProvider
const AdminPageWithNotifications: React.FC = () => {
  return (
    <AdminNotificationsProvider>
      <AdminPage />
    </AdminNotificationsProvider>
  );
};

export default AdminPageWithNotifications;
