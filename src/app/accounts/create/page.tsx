'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateAccountPage() {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'OUTLIER' | 'HANDSHAKE'>('OUTLIER');
  const [browserType, setBrowserType] = useState<'IX_BROWSER' | 'GOLOGIN' | 'MORELOGIN'>('IX_BROWSER');
  const [hourlyRate, setHourlyRate] = useState('');
  const [taskerId, setTaskerId] = useState<string>('');
  const [taskers, setTaskers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchTaskers();
  }, []);

  const fetchTaskers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTaskers(data.users.filter((u: any) => u.role === 'TASKER'));
      }
    } catch (error) {
      console.error('Failed to fetch taskers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!accountName.trim()) {
      setError('Account name is required');
      return;
    }

    if (!hourlyRate || parseFloat(hourlyRate) < 0) {
      setError('Hourly rate must be a positive number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountName: accountName.trim(),
          accountType,
          browserType,
          hourlyRate: parseFloat(hourlyRate),
          taskerId: taskerId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Reset form
        setAccountName('');
        setAccountType('OUTLIER');
        setBrowserType('IX_BROWSER');
        setHourlyRate('');
        setTaskerId('');
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="MANAGER">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Button variant="ghost" onClick={() => router.push('/accounts')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Accounts
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                Account created successfully! You can create another account or go back to the account list.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Create New Account</CardTitle>
              <CardDescription>
                Add a new work account to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      type="text"
                      placeholder="Enter account name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter hourly rate"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select value={accountType} onValueChange={(value: 'OUTLIER' | 'HANDSHAKE') => setAccountType(value)} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OUTLIER">Outlier - AI training tasks</SelectItem>
                        <SelectItem value="HANDSHAKE">Handshake - Hourly task submissions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="browserType">Browser Type</Label>
                    <Select value={browserType} onValueChange={(value: 'IX_BROWSER' | 'GOLOGIN' | 'MORELOGIN') => setBrowserType(value)} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select browser type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IX_BROWSER">IX Browser</SelectItem>
                        <SelectItem value="GOLOGIN">GoLogin</SelectItem>
                        <SelectItem value="MORELOGIN">MoreLogin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskerId">Assign to Tasker (Optional)</Label>
                  <Select value={taskerId} onValueChange={setTaskerId} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tasker (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Leave unassigned</SelectItem>
                      {taskers.map((tasker) => (
                        <SelectItem key={tasker.id} value={tasker.id}>
                          {tasker.fullName} ({tasker.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/accounts')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}