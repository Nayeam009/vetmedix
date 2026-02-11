import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Users,
  Shield,
  ShieldCheck,
  User,
  Download,
  Stethoscope,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAdmin, useAdminUsers } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { downloadCSV } from '@/lib/csvParser';
import { usePagination } from '@/hooks/usePagination';

type RoleFilter = 'all' | 'user' | 'admin' | 'moderator' | 'doctor' | 'clinic_owner';

const AdminCustomers = () => {
  useDocumentTitle('Customers - Admin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  const { data: customers, isLoading } = useAdminUsers();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  // Stats computed from data
  const stats = useMemo(() => {
    if (!customers) return { total: 0, admins: 0, moderators: 0, doctors: 0, clinicOwners: 0, users: 0 };
    const admins = customers.filter(c => c.user_roles?.some((r: any) => r.role === 'admin')).length;
    const moderators = customers.filter(c => c.user_roles?.some((r: any) => r.role === 'moderator')).length;
    const doctors = customers.filter(c => c.user_roles?.some((r: any) => r.role === 'doctor')).length;
    const clinicOwners = customers.filter(c => c.user_roles?.some((r: any) => r.role === 'clinic_owner')).length;
    return { total: customers.length, admins, moderators, doctors, clinicOwners, users: customers.length - admins - moderators - doctors - clinicOwners };
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let result = customers || [];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.full_name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    }
    
    if (roleFilter !== 'all') {
      result = result.filter(c => {
        const roles = c.user_roles?.map((r: any) => r.role) || [];
        if (roleFilter === 'user') return roles.length === 0 || (roles.length === 1 && roles[0] === 'user');
        return roles.includes(roleFilter);
      });
    }
    
    return result;
  }, [customers, searchQuery, roleFilter]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    previousPage,
    nextPage,
    hasPreviousPage,
    hasNextPage,
    startIndex,
  } = usePagination({ data: filteredCustomers, pageSize: 20 });

  const handleStatClick = useCallback((role: RoleFilter) => {
    setRoleFilter(prev => prev === role ? 'all' : role);
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: 'admin' | 'moderator' | 'user' | 'doctor' | 'clinic_owner') => {
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }

      toast({ title: 'Success', description: `User role updated to ${role.replace('_', ' ')}` });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  }, [toast, queryClient]);

  const getRoleBadge = (userRoles: any[] | null) => {
    const role = userRoles?.[0]?.role;
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><Shield className="h-3 w-3 mr-1" />Moderator</Badge>;
      case 'doctor':
        return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"><Stethoscope className="h-3 w-3 mr-1" />Doctor</Badge>;
      case 'clinic_owner':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><Building2 className="h-3 w-3 mr-1" />Clinic Owner</Badge>;
      default:
        return <Badge variant="outline"><User className="h-3 w-3 mr-1" />User</Badge>;
    }
  };

  const handleExportCSV = useCallback(() => {
    if (!filteredCustomers.length) return;
    const headers = ['Name', 'Phone', 'Address', 'Division', 'District', 'Thana', 'Role', 'Joined'];
    const rows = filteredCustomers.map(customer => [
      customer.full_name || 'Unnamed',
      customer.phone || '',
      customer.address || '',
      customer.division || '',
      customer.district || '',
      customer.thana || '',
      customer.user_roles?.[0]?.role || 'user',
      format(new Date(customer.created_at), 'yyyy-MM-dd')
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    downloadCSV(csvContent, `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast({ title: 'Success', description: 'Customers exported to CSV' });
  }, [filteredCustomers, toast]);

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
    <AdminLayout title="Customers" subtitle="Manage user accounts and roles">
      {/* Stats Bar — clickable to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div onClick={() => handleStatClick('all')} className={`cursor-pointer rounded-xl sm:rounded-2xl transition-all ${roleFilter === 'all' ? 'ring-2 ring-primary' : ''}`}>
          <StatCard
            title="Total Customers"
            value={stats.total}
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          />
        </div>
        <div onClick={() => handleStatClick('admin')} className={`cursor-pointer rounded-xl sm:rounded-2xl transition-all ${roleFilter === 'admin' ? 'ring-2 ring-purple-500' : ''}`}>
          <StatCard
            title="Admins"
            value={stats.admins}
            icon={<ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
          />
        </div>
        <div onClick={() => handleStatClick('moderator')} className={`cursor-pointer rounded-xl sm:rounded-2xl transition-all ${roleFilter === 'moderator' ? 'ring-2 ring-blue-500' : ''}`}>
          <StatCard
            title="Moderators"
            value={stats.moderators}
            icon={<Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
          />
        </div>
        <div onClick={() => handleStatClick('doctor')} className={`cursor-pointer rounded-xl sm:rounded-2xl transition-all ${roleFilter === 'doctor' ? 'ring-2 ring-teal-500' : ''}`}>
          <StatCard
            title="Doctors"
            value={stats.doctors}
            icon={<Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />}
          />
        </div>
        <div onClick={() => handleStatClick('clinic_owner')} className={`col-span-2 sm:col-span-1 cursor-pointer rounded-xl sm:rounded-2xl transition-all ${roleFilter === 'clinic_owner' ? 'ring-2 ring-amber-500' : ''}`}>
          <StatCard
            title="Clinic Owners"
            value={stats.clinicOwners}
            icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
          />
        </div>
      </div>

      {/* Search + Filter + Export */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-[140px] sm:w-[160px] h-10 sm:h-11 rounded-xl text-sm">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="clinic_owner">Clinic Owner</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={!filteredCustomers.length}
            className="h-10 sm:h-11 rounded-xl text-sm gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
        Showing {paginatedData.length ? startIndex + 1 : 0}–{startIndex + paginatedData.length} of {filteredCustomers.length} customers
      </p>

      {/* Customers Table/Cards */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border">
              {paginatedData.map((customer) => (
                <div key={customer.id} className="p-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {customer.avatar_url && <AvatarImage src={customer.avatar_url} alt={customer.full_name || ''} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{customer.full_name || 'Unnamed'}</p>
                      {getRoleBadge(customer.user_roles)}
                    </div>
                    <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.district && customer.division ? `${customer.district}, ${customer.division}` : 'No location'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'user')}>
                        <User className="h-4 w-4 mr-2" />Set as User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'moderator')}>
                        <Shield className="h-4 w-4 mr-2" />Set as Moderator
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'doctor')}>
                        <Stethoscope className="h-4 w-4 mr-2" />Set as Doctor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'clinic_owner')}>
                        <Building2 className="h-4 w-4 mr-2" />Set as Clinic Owner
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'admin')} className="text-purple-600">
                        <ShieldCheck className="h-4 w-4 mr-2" />Set as Admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {customer.avatar_url && <AvatarImage src={customer.avatar_url} alt={customer.full_name || ''} />}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.full_name || 'Unnamed'}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        {customer.district && customer.division ? `${customer.district}, ${customer.division}` : '-'}
                      </TableCell>
                      <TableCell>{getRoleBadge(customer.user_roles)}</TableCell>
                      <TableCell>{format(new Date(customer.created_at), 'PP')}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'user')}>
                              <User className="h-4 w-4 mr-2" />Set as User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'moderator')}>
                              <Shield className="h-4 w-4 mr-2" />Set as Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'doctor')}>
                              <Stethoscope className="h-4 w-4 mr-2" />Set as Doctor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'clinic_owner')}>
                              <Building2 className="h-4 w-4 mr-2" />Set as Clinic Owner
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateUserRole(customer.user_id, 'admin')} className="text-purple-600">
                              <ShieldCheck className="h-4 w-4 mr-2" />Set as Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousPage} disabled={!hasPreviousPage} className="rounded-xl gap-1">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage} className="rounded-xl gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomers;
