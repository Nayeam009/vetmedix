import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2,
  AlertCircle,
  Store,
  Bell,
  Shield,
  Save,
  Truck,
  Settings2,
  Globe,
  Phone,
  MapPin,
  DollarSign,
  Package,
  Clock,
  Users,
  Eye,
  MessageSquare,
  Mail
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface StoreSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  taxRate: number;
  aboutText: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
  };
}

interface ShippingSettings {
  defaultCharge: number;
  freeShippingThreshold: number;
  enableFreeShipping: boolean;
  estimatedDeliveryDays: number;
  deliveryAreas: string;
  courierName: string;
}

interface OrderSettings {
  minOrderAmount: number;
  maxOrderAmount: number;
  autoCancelHours: number;
  enableCOD: boolean;
  enableOnlinePayment: boolean;
  lowStockThreshold: number;
  orderPrefix: string;
}

interface NotificationSettings {
  orderAlerts: boolean;
  lowStockAlerts: boolean;
  newCustomerAlerts: boolean;
  emailNotifications: boolean;
  appointmentAlerts: boolean;
  reviewAlerts: boolean;
}

interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  enableRegistration: boolean;
  enableSocialFeed: boolean;
  enableAppointments: boolean;
  enableShop: boolean;
  maxPetsPerUser: number;
  enableReviews: boolean;
}

const defaultStoreSettings: StoreSettings = {
  name: 'VET-MEDIX',
  email: 'vetmedix.25@gmail.com',
  phone: '',
  address: 'Gopalganj, Bangladesh',
  currency: 'BDT',
  taxRate: 0,
  aboutText: '',
  socialLinks: { facebook: '', instagram: '', youtube: '' },
};

const defaultShippingSettings: ShippingSettings = {
  defaultCharge: 100,
  freeShippingThreshold: 2000,
  enableFreeShipping: true,
  estimatedDeliveryDays: 3,
  deliveryAreas: 'All over Bangladesh',
  courierName: 'SteadFast',
};

const defaultOrderSettings: OrderSettings = {
  minOrderAmount: 100,
  maxOrderAmount: 50000,
  autoCancelHours: 48,
  enableCOD: true,
  enableOnlinePayment: false,
  lowStockThreshold: 5,
  orderPrefix: 'VM',
};

const defaultNotifications: NotificationSettings = {
  orderAlerts: true,
  lowStockAlerts: true,
  newCustomerAlerts: false,
  emailNotifications: true,
  appointmentAlerts: true,
  reviewAlerts: true,
};

const defaultPlatformSettings: PlatformSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
  enableRegistration: true,
  enableSocialFeed: true,
  enableAppointments: true,
  enableShop: true,
  maxPetsPerUser: 30,
  enableReviews: true,
};

const SettingRow = ({ icon: Icon, label, description, children }: {
  icon: React.ElementType;
  label: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm sm:text-base">{label}</p>
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const SaveButton = ({ isPending, onClick, label = 'Save Changes' }: { isPending: boolean; onClick: () => void; label?: string }) => (
  <Button onClick={onClick} disabled={isPending} className="w-full sm:w-auto min-h-[44px] sm:min-h-0 gap-2 text-sm">
    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
    {label}
  </Button>
);

const AdminSettings = () => {
  useDocumentTitle('Settings - Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShippingSettings);
  const [orderSettings, setOrderSettings] = useState<OrderSettings>(defaultOrderSettings);
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(defaultPlatformSettings);

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_settings').select('*');
      if (error) throw error;
      const get = (key: string) => data?.find(s => s.key === key)?.value;
      return {
        store: get('store') ? (get('store') as unknown as StoreSettings) : defaultStoreSettings,
        shipping: get('shipping') ? (get('shipping') as unknown as ShippingSettings) : defaultShippingSettings,
        orders: get('orders') ? (get('orders') as unknown as OrderSettings) : defaultOrderSettings,
        notifications: get('notifications') ? (get('notifications') as unknown as NotificationSettings) : defaultNotifications,
        platform: get('platform') ? (get('platform') as unknown as PlatformSettings) : defaultPlatformSettings,
      };
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (settings) {
      setStoreSettings({ ...defaultStoreSettings, ...settings.store });
      setShippingSettings({ ...defaultShippingSettings, ...settings.shipping });
      setOrderSettings({ ...defaultOrderSettings, ...settings.orders });
      setNotifications({ ...defaultNotifications, ...settings.notifications });
      setPlatformSettings({ ...defaultPlatformSettings, ...settings.platform });
    }
  }, [settings]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (!authLoading && !roleLoading && !isAdmin) navigate('/');
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  const createSaveMutation = (key: string, successMsg: string) =>
    useMutation({
      mutationFn: async (data: unknown) => {
        // Try update first, then upsert if no rows affected
        const { data: existing } = await supabase.from('admin_settings').select('id').eq('key', key).maybeSingle();
        if (existing) {
          const { error } = await supabase.from('admin_settings')
            .update({ value: data as unknown as Json, updated_at: new Date().toISOString() })
            .eq('key', key);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('admin_settings')
            .insert({ key, value: data as unknown as Json });
          if (error) throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
        toast.success(successMsg);
      },
      onError: () => toast.error(`Failed to save ${key} settings`),
    });

  const saveStoreMutation = createSaveMutation('store', 'Store settings saved');
  const saveShippingMutation = createSaveMutation('shipping', 'Shipping settings saved');
  const saveOrderMutation = createSaveMutation('orders', 'Order settings saved');
  const saveNotificationsMutation = createSaveMutation('notifications', 'Notification preferences saved');
  const savePlatformMutation = createSaveMutation('platform', 'Platform settings saved');

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
    <AdminLayout title="Settings" subtitle="Configure your platform settings">
      <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1 sm:w-auto sm:inline-flex">
          <TabsTrigger value="general" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Store className="h-3.5 w-3.5" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Truck className="h-3.5 w-3.5" />
            <span>Shipping</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5" />
            <span>Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-1.5 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs sm:text-sm">
            <Settings2 className="h-3.5 w-3.5" />
            <span>Platform</span>
          </TabsTrigger>
        </TabsList>

        {/* ── General Tab ── */}
        <TabsContent value="general">
          <div className="space-y-4 sm:space-y-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-base sm:text-lg">Store Information</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Basic information about your store</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="storeName" className="text-xs sm:text-sm">Store Name</Label>
                    <Input id="storeName" value={storeSettings.name} onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })} className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storeEmail" className="text-xs sm:text-sm">Contact Email</Label>
                    <Input id="storeEmail" type="email" value={storeSettings.email} onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })} className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storePhone" className="text-xs sm:text-sm">Phone Number</Label>
                    <Input id="storePhone" value={storeSettings.phone} onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })} placeholder="+880 XXXX XXXXXX" className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storeAddress" className="text-xs sm:text-sm">Address</Label>
                    <Input id="storeAddress" value={storeSettings.address} onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })} className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="text-xs sm:text-sm">Currency</Label>
                    <Select value={storeSettings.currency} onValueChange={(v) => setStoreSettings({ ...storeSettings, currency: v })}>
                      <SelectTrigger className="h-10 sm:h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BDT">BDT (৳)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="taxRate" className="text-xs sm:text-sm">Tax Rate (%)</Label>
                    <Input id="taxRate" type="number" value={storeSettings.taxRate} onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: parseFloat(e.target.value) || 0 })} className="h-10 sm:h-11" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">About / Footer Text</Label>
                  <Textarea value={storeSettings.aboutText} onChange={(e) => setStoreSettings({ ...storeSettings, aboutText: e.target.value })} placeholder="Short description for about section & footer" rows={3} />
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-sm mb-3">Social Links</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">Facebook</Label>
                      <Input value={storeSettings.socialLinks.facebook} onChange={(e) => setStoreSettings({ ...storeSettings, socialLinks: { ...storeSettings.socialLinks, facebook: e.target.value } })} placeholder="https://facebook.com/..." className="h-10 sm:h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">Instagram</Label>
                      <Input value={storeSettings.socialLinks.instagram} onChange={(e) => setStoreSettings({ ...storeSettings, socialLinks: { ...storeSettings.socialLinks, instagram: e.target.value } })} placeholder="https://instagram.com/..." className="h-10 sm:h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm">YouTube</Label>
                      <Input value={storeSettings.socialLinks.youtube} onChange={(e) => setStoreSettings({ ...storeSettings, socialLinks: { ...storeSettings.socialLinks, youtube: e.target.value } })} placeholder="https://youtube.com/..." className="h-10 sm:h-11" />
                    </div>
                  </div>
                </div>

                <SaveButton isPending={saveStoreMutation.isPending} onClick={() => saveStoreMutation.mutate(storeSettings)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Shipping Tab ── */}
        <TabsContent value="shipping">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Shipping & Delivery</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure delivery charges and shipping options</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Default Delivery Charge (৳)</Label>
                  <Input type="number" value={shippingSettings.defaultCharge} onChange={(e) => setShippingSettings({ ...shippingSettings, defaultCharge: parseFloat(e.target.value) || 0 })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Estimated Delivery (Days)</Label>
                  <Input type="number" value={shippingSettings.estimatedDeliveryDays} onChange={(e) => setShippingSettings({ ...shippingSettings, estimatedDeliveryDays: parseInt(e.target.value) || 3 })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Courier Service</Label>
                  <Input value={shippingSettings.courierName} onChange={(e) => setShippingSettings({ ...shippingSettings, courierName: e.target.value })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Delivery Areas</Label>
                  <Input value={shippingSettings.deliveryAreas} onChange={(e) => setShippingSettings({ ...shippingSettings, deliveryAreas: e.target.value })} className="h-10 sm:h-11" />
                </div>
              </div>

              <Separator />

              <SettingRow icon={Truck} label="Free Shipping" description="Enable free shipping above a certain order amount">
                <Switch checked={shippingSettings.enableFreeShipping} onCheckedChange={(c) => setShippingSettings({ ...shippingSettings, enableFreeShipping: c })} />
              </SettingRow>

              {shippingSettings.enableFreeShipping && (
                <div className="space-y-1.5 pl-0 sm:pl-12">
                  <Label className="text-xs sm:text-sm">Free Shipping Threshold (৳)</Label>
                  <Input type="number" value={shippingSettings.freeShippingThreshold} onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: parseFloat(e.target.value) || 0 })} className="h-10 sm:h-11 max-w-xs" />
                  <p className="text-xs text-muted-foreground">Orders above this amount get free delivery</p>
                </div>
              )}

              <SaveButton isPending={saveShippingMutation.isPending} onClick={() => saveShippingMutation.mutate(shippingSettings)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Orders Tab ── */}
        <TabsContent value="orders">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Order Management</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure order processing rules and limits</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Order ID Prefix</Label>
                  <Input value={orderSettings.orderPrefix} onChange={(e) => setOrderSettings({ ...orderSettings, orderPrefix: e.target.value })} className="h-10 sm:h-11" placeholder="e.g. VM" />
                  <p className="text-xs text-muted-foreground">Prefix for order numbers (e.g. VM-001)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Auto-Cancel After (Hours)</Label>
                  <Input type="number" value={orderSettings.autoCancelHours} onChange={(e) => setOrderSettings({ ...orderSettings, autoCancelHours: parseInt(e.target.value) || 48 })} className="h-10 sm:h-11" />
                  <p className="text-xs text-muted-foreground">Pending orders auto-cancel after this time</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Minimum Order Amount (৳)</Label>
                  <Input type="number" value={orderSettings.minOrderAmount} onChange={(e) => setOrderSettings({ ...orderSettings, minOrderAmount: parseFloat(e.target.value) || 0 })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Maximum Order Amount (৳)</Label>
                  <Input type="number" value={orderSettings.maxOrderAmount} onChange={(e) => setOrderSettings({ ...orderSettings, maxOrderAmount: parseFloat(e.target.value) || 50000 })} className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Low Stock Alert Threshold</Label>
                  <Input type="number" value={orderSettings.lowStockThreshold} onChange={(e) => setOrderSettings({ ...orderSettings, lowStockThreshold: parseInt(e.target.value) || 5 })} className="h-10 sm:h-11" />
                  <p className="text-xs text-muted-foreground">Alert when stock falls below this number</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SettingRow icon={DollarSign} label="Cash on Delivery" description="Allow customers to pay on delivery">
                  <Switch checked={orderSettings.enableCOD} onCheckedChange={(c) => setOrderSettings({ ...orderSettings, enableCOD: c })} />
                </SettingRow>
                <SettingRow icon={Globe} label="Online Payment" description="Accept online payments (bKash, Nagad, etc.)">
                  <Switch checked={orderSettings.enableOnlinePayment} onCheckedChange={(c) => setOrderSettings({ ...orderSettings, enableOnlinePayment: c })} />
                </SettingRow>
              </div>

              <SaveButton isPending={saveOrderMutation.isPending} onClick={() => saveOrderMutation.mutate(orderSettings)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Notification Preferences</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-3 sm:space-y-4">
              <SettingRow icon={Package} label="New Order Alerts" description="Get notified when a new order is placed">
                <Switch checked={notifications.orderAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, orderAlerts: c })} />
              </SettingRow>
              <SettingRow icon={AlertCircle} label="Low Stock Alerts" description="Get notified when products are running low">
                <Switch checked={notifications.lowStockAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, lowStockAlerts: c })} />
              </SettingRow>
              <SettingRow icon={Users} label="New Customer Alerts" description="Get notified when a new customer registers">
                <Switch checked={notifications.newCustomerAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, newCustomerAlerts: c })} />
              </SettingRow>
              <SettingRow icon={Clock} label="Appointment Alerts" description="Get notified for new appointment bookings">
                <Switch checked={notifications.appointmentAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, appointmentAlerts: c })} />
              </SettingRow>
              <SettingRow icon={MessageSquare} label="Review Alerts" description="Get notified when customers leave reviews">
                <Switch checked={notifications.reviewAlerts} onCheckedChange={(c) => setNotifications({ ...notifications, reviewAlerts: c })} />
              </SettingRow>
              <SettingRow icon={Mail} label="Email Notifications" description="Receive notifications via email">
                <Switch checked={notifications.emailNotifications} onCheckedChange={(c) => setNotifications({ ...notifications, emailNotifications: c })} />
              </SettingRow>

              <SaveButton isPending={saveNotificationsMutation.isPending} onClick={() => saveNotificationsMutation.mutate(notifications)} label="Save Preferences" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Platform Tab ── */}
        <TabsContent value="platform">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg">Platform Controls</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Enable or disable major features of the platform</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-3 sm:space-y-4">
              <SettingRow icon={Shield} label="Maintenance Mode" description="Temporarily disable public access to the site">
                <Switch checked={platformSettings.maintenanceMode} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, maintenanceMode: c })} />
              </SettingRow>

              {platformSettings.maintenanceMode && (
                <div className="space-y-1.5 pl-0 sm:pl-12">
                  <Label className="text-xs sm:text-sm">Maintenance Message</Label>
                  <Textarea value={platformSettings.maintenanceMessage} onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceMessage: e.target.value })} rows={2} />
                </div>
              )}

              <Separator />

              <SettingRow icon={Users} label="User Registration" description="Allow new users to sign up">
                <Switch checked={platformSettings.enableRegistration} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableRegistration: c })} />
              </SettingRow>
              <SettingRow icon={Store} label="E-Commerce / Shop" description="Enable the product shop and orders">
                <Switch checked={platformSettings.enableShop} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableShop: c })} />
              </SettingRow>
              <SettingRow icon={Clock} label="Appointments" description="Allow clinic appointment booking">
                <Switch checked={platformSettings.enableAppointments} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableAppointments: c })} />
              </SettingRow>
              <SettingRow icon={Eye} label="Social Feed" description="Enable the pet social media feed">
                <Switch checked={platformSettings.enableSocialFeed} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableSocialFeed: c })} />
              </SettingRow>
              <SettingRow icon={MessageSquare} label="Product Reviews" description="Allow customers to review products">
                <Switch checked={platformSettings.enableReviews} onCheckedChange={(c) => setPlatformSettings({ ...platformSettings, enableReviews: c })} />
              </SettingRow>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Max Pets Per User</Label>
                <Input type="number" value={platformSettings.maxPetsPerUser} onChange={(e) => setPlatformSettings({ ...platformSettings, maxPetsPerUser: parseInt(e.target.value) || 30 })} className="h-10 sm:h-11 max-w-xs" />
              </div>

              <SaveButton isPending={savePlatformMutation.isPending} onClick={() => savePlatformMutation.mutate(platformSettings)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;
