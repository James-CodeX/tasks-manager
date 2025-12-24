'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, User, Clock, DollarSign, Monitor, Eye, EyeOff } from 'lucide-react';
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

export default function AccountDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [account, setAccount] = useState<Account | null>(null);
  const [taskers, setTaskers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchAccount();
    if (user?.role === 'MANAGER') {
      fetchTaskers();
    }
  }, [id, user]);

  const fetchAccount = async () => {
    try {
      const endpoint = user?.role === 'MANAGER' 
        ? `/api/accounts/${id}` 
        : `/api/accounts/my`;
      
      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account');
      }

      const data = await response.json();
      
      // For taskers, find the account in their assigned accounts
      if (user?.role === 'TASKER') {
        const userAccount = data.accounts.find((acc: Account) => acc.id === params.id);
        if (!userAccount) {
          setError('Account not found or not assigned to you');
          setIsLoading(false);
          return;
        }
        setAccount(userAccount);
      } else {
        setAccount(data.account);
      }
    } catch (error) {
      setError('Failed to load account');
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
        const taskerUsers = data.users.filter((u: any) => u.role === 'TASKER');
        console.log('Fetched taskers:', taskerUsers);
        setTaskers(taskerUsers);
      } else {
        console.error('Failed to fetch users:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch taskers:', error);
    }
  };

  const toggleAccountStatus = async () => {
    if (!account) return;

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !account.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update account status');
      }

      await fetchAccount();
    } catch (error) {
      setError('Failed to update account status');
    }
  };

  const assignTasker = async (newTaskerId: string | null) => {
    if (!account) return;

    console.log('assignTasker called with:', newTaskerId);
    setIsAssigning(true);
    setError(''); // Clear previous errors
    try {
      const payload = { taskerId: newTaskerId ? parseInt(newTaskerId) : null };
      console.log('Sending assignment request:', payload);
      
      const response = await fetch(`/api/accounts/${account.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('Assignment response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Assignment failed:', data);
        throw new Error(data.error || 'Failed to assign tasker');
      }

      const result = await response.json();
      console.log('Assignment successful:', result);
      await fetchAccount();
    } catch (error) {
      console.error('Assignment error:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign tasker');
    } finally {
      setIsAssigning(false);
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

  if (error || !account) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">{error || 'Account not found'}</p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => router.push('/accounts')}>
                  Back to Accounts
                </Button>
              </div>
            </CardContent>
          </Card>
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
              <Button variant="ghost" onClick={() => router.push('/accounts')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Accounts
              </Button>
              {user?.role === 'MANAGER' && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/accounts/${account.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleAccountStatus}
                  >
                    {account.isActive ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {account.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Account Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Monitor className="h-5 w-5 mr-2" />
                    {account.accountName}
                  </CardTitle>
                  <CardDescription>
                    Account details and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Account Type</h4>
                      <Badge variant={account.accountType === 'OUTLIER' ? 'default' : 'secondary'}>
                        {account.accountType}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Browser Type</h4>
                      <Badge variant="outline">
                        {account.browserType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Hourly Rate</h4>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="text-lg font-semibold">{account.hourlyRate.toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Created</h4>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(account.createdAt).toLocaleDateString()} at {new Date(account.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Assignment
                  </CardTitle>
                  <CardDescription>
                    Tasker assignment information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {account.tasker ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Assigned Tasker</h4>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{account.tasker.fullName}</p>
                          <p className="text-sm text-muted-foreground">{account.tasker.email}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No tasker assigned</p>
                    </div>
                  )}

                  {user?.role === 'MANAGER' && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Reassign Tasker</h4>
                      {taskers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No taskers available. Create a tasker user first.</p>
                      ) : (
                        <Select 
                          value={account.taskerId ? String(account.taskerId) : 'unassigned'} 
                          onValueChange={(value) => {
                            console.log('Selected value:', value);
                            assignTasker(value === 'unassigned' ? null : value);
                          }}
                          disabled={isAssigning}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tasker" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassign</SelectItem>
                            {taskers.map((tasker) => (
                              <SelectItem key={tasker.id} value={String(tasker.id)}>
                                {tasker.fullName} ({tasker.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {isAssigning && (
                        <p className="text-sm text-muted-foreground mt-2">Assigning...</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Creator Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Created By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{account.creator.fullName}</p>
                    <p className="text-sm text-muted-foreground">{account.creator.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {user?.role === 'TASKER' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => router.push('/sessions')}
                    >
                      Start Working Session
                    </Button>
                    {account.accountType === 'HANDSHAKE' && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => router.push('/tasks')}
                      >
                        Submit Task
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}