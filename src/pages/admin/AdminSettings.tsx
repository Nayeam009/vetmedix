import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  Loader2,
  AlertCircle,
  Store,
  Bell,
  Shield,
  Mail,
  Save
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();

  const [storeSettings, setStoreSettings] = useState({
    storeName: 'PetConnect',
    storeEmail: 'support@petconnect.com',
    currency: 'BDT',
    taxRate: '5',
  });

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    lowStockAlerts: true,
    newCustomerAlerts: false,
    emailNotifications: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  const handleSave = () => {
    toast({ title: 'Settings Saved', description: 'Your settings have been updated successfully.' });
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Settings" subtitle="Configure your store settings">
      <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1 sm:w-auto sm:inline-flex">
          <TabsTrigger value="general" className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Notifications</span>
            <span className="xs:hidden">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Store Information</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Basic information about your store</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="storeName" className="text-xs sm:text-sm">Store Name</Label>
                  <Input 
                    id="storeName"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="storeEmail" className="text-xs sm:text-sm">Contact Email</Label>
                  <Input 
                    id="storeEmail"
                    type="email"
                    value={storeSettings.storeEmail}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="currency" className="text-xs sm:text-sm">Currency</Label>
                  <Input 
                    id="currency"
                    value={storeSettings.currency}
                    onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="taxRate" className="text-xs sm:text-sm">Tax Rate (%)</Label>
                  <Input 
                    id="taxRate"
                    type="number"
                    value={storeSettings.taxRate}
                    onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: e.target.value })}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full sm:w-auto min-h-[44px] sm:min-h-0 gap-2 text-sm">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Notification Preferences</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">New Order Alerts</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Get notified when a new order is placed</p>
                  </div>
                  <Switch 
                    checked={notifications.orderAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, orderAlerts: checked })}
                    className="flex-shrink-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">Low Stock Alerts</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Get notified when products are running low</p>
                  </div>
                  <Switch 
                    checked={notifications.lowStockAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, lowStockAlerts: checked })}
                    className="flex-shrink-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">New Customer Alerts</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Get notified when a new customer registers</p>
                  </div>
                  <Switch 
                    checked={notifications.newCustomerAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, newCustomerAlerts: checked })}
                    className="flex-shrink-0"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">Email Notifications</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full sm:w-auto min-h-[44px] sm:min-h-0 gap-2 text-sm">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Security Settings</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage your admin security preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm sm:text-base">Two-Factor Authentication</p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 ml-10 sm:ml-[52px]">
                  Add an extra layer of security to your admin account
                </p>
                <Button variant="outline" size="sm" className="ml-10 sm:ml-[52px] min-h-[40px] sm:min-h-0 text-xs sm:text-sm">
                  Enable 2FA
                </Button>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm sm:text-base">Change Admin Email</p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 ml-10 sm:ml-[52px]">
                  Update the email address used for admin notifications
                </p>
                <Button variant="outline" size="sm" className="ml-10 sm:ml-[52px] min-h-[40px] sm:min-h-0 text-xs sm:text-sm">
                  Change Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;
