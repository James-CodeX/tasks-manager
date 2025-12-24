'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, DollarSign, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Worker Tracking System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Badge variant={user.role === 'MANAGER' ? 'default' : 'secondary'}>
                {user.role.toLowerCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.fullName}!</h2>
          <p className="text-gray-600">Here's what's happening with your worker tracking system.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.5</div>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$245</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {user.role === 'MANAGER' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage taskers and their accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/users')}>
                      <Users className="h-4 w-4 mr-2" />
                      View Users
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/users/create')}>
                      Add User
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>
                    Manage work accounts and browser configurations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/accounts')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Accounts
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/accounts/create')}>
                      Add Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Submissions</CardTitle>
                  <CardDescription>
                    Review and approve task submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/dashboard/submissions')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Review Submissions
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Work Sessions</CardTitle>
                  <CardDescription>
                    Monitor active sessions and work hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/dashboard/sessions/monitor')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Monitor Sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Management</CardTitle>
                  <CardDescription>
                    Generate and manage payment records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/dashboard/payments')}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Payments
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard/payments/generate')}>
                      Generate Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === 'TASKER' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>My Accounts</CardTitle>
                  <CardDescription>
                    View your assigned work accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/accounts')}>
                      <Users className="h-4 w-4 mr-2" />
                      View My Accounts
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Work Sessions</CardTitle>
                  <CardDescription>
                    Track your work hours and earnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/dashboard/sessions')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Manage Sessions
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard/sessions/history')}>
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Submissions</CardTitle>
                  <CardDescription>
                    Submit hourly tasks for Handshake accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/dashboard/submissions')}>
                      <Settings className="h-4 w-4 mr-2" />
                      View Submissions
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard/submissions/submit')}>
                      Submit Task
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Payments</CardTitle>
                  <CardDescription>
                    View your payment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => router.push('/dashboard/payments')}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Payments
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}