'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Edit, Eye, EyeOff, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  accountName: string;
  accountType: 'OUTLIER' | 'HANDSHAKE';
  browserType: 'IX_BROWSER' | 'GOLOGIN' | 'MORELOGIN';
  hourlyRate: number;
  taskerId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tasker?: {
    id: string;
    fullName: string;
    email: string;
  };
  creator: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [taskers, setTaskers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [browserTypeFilter, setBrowserTypeFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
    if (user?.role === 'MANAGER') {
      fetchTaskers();
    }
  }, [user]);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, accountTypeFilter, browserTypeFilter, assignedFilter]);

  const fetchAccounts = async () => {
    try {
      const endpoint = user?.role === 'MANAGER' ? '/api/accounts' : '/api/accounts/my';
      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts);
    } catch (error) {
      setError('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaskers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTaskers(data.users.filter((u: any) => u.role === 'TASKER'));
      }
    } catch (error) {
      console.error('Failed to fetch taskers:', error);
    }
  };

  const filterAccounts = () => {
    let filtered = [...accounts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.accountName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Account type filter
    if (accountTypeFilter !== 'all') {
      filtered = filtered.filter(account => account.accountType === accountTypeFilter);
    }

    // Browser type filter
    if (browserTypeFilter !== 'all') {
      filtered = filtered.filter(account => account.browserType === browserTypeFilter);
    }

    // Assigned filter
    if (assignedFilter === 'assigned') {
      filtered = filtered.filter(account => account.taskerId !== null);
    } else if (assignedFilter === 'unassigned') {
      filtered = filtered.filter(account => account.taskerId === null);
    }

    setFilteredAccounts(filtered);
  };

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update account status');
      }

      await fetchAccounts();
    } catch (error) {
      setError('Failed to update account status');
    }
  };

  const assignTasker = async (accountId: string, taskerId: string | null) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ taskerId: taskerId ? parseInt(taskerId) : null }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign tasker');
      }

      await fetchAccounts();
    } catch (error) {
      setError('Failed to assign tasker');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                  ← Back to Dashboard
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {user?.role === 'MANAGER' ? 'Account Management' : 'My Accounts'}
                </h1>
              </div>
              {user?.role === 'MANAGER' && (
                <Button onClick={() => router.push('/accounts/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Accounts
              </CardTitle>
              <CardDescription>
                {user?.role === 'MANAGER' 
                  ? 'Manage work accounts and assignments' 
                  : 'View your assigned work accounts'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search accounts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                {user?.role === 'MANAGER' && (
                  <>
                    <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Account Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="OUTLIER">Outlier</SelectItem>
                        <SelectItem value="HANDSHAKE">Handshake</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={browserTypeFilter} onValueChange={setBrowserTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Browser Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Browsers</SelectItem>
                        <SelectItem value="IX_BROWSER">IX Browser</SelectItem>
                        <SelectItem value="GOLOGIN">GoLogin</SelectItem>
                        <SelectItem value="MORELOGIN">MoreLogin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>

              {/* Accounts Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      {user?.role === 'MANAGER' && <TableHead>Assigned To</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={user?.role === 'MANAGER' ? 7 : 6} className="text-center py-8">
                          {searchTerm || accountTypeFilter !== 'all' || browserTypeFilter !== 'all' || assignedFilter !== 'all'
                            ? 'No accounts found matching your filters.'
                            : 'No accounts found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.accountName}</TableCell>
                          <TableCell>
                            <Badge variant={account.accountType === 'OUTLIER' ? 'default' : 'secondary'}>
                              {account.accountType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {account.browserType.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>${account.hourlyRate.toFixed(2)}</TableCell>
                          {user?.role === 'MANAGER' && (
                            <TableCell>
                              {account.tasker ? (
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  {account.tasker.fullName}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge variant={account.isActive ? 'default' : 'secondary'}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/accounts/${account.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {user?.role === 'MANAGER' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/accounts/${account.id}/edit`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleAccountStatus(account.id, account.isActive)}
                                  >
                                    {account.isActive ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}