'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { SessionTimer } from '@/components/session-timer';
import { SessionStats } from '@/components/session-stats';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlayCircle, StopCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Account {
  id: string;
  accountName: string;
  accountType: string;
  hourlyRate: number;
}

interface ActiveSession {
  id: string;
  startTime: string;
  hourlyRate: number;
  account: {
    accountName: string;
    accountType: string;
  };
}

export default function SessionsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'TASKER') {
      router.push('/dashboard');
      return;
    }
    fetchAccounts();
    fetchActiveSessions();
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts/my', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/sessions/active', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch active sessions:', err);
    }
  };

  const handleStartSession = async () => {
    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          accountId: selectedAccount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedAccount('');
        fetchActiveSessions();
      } else {
        setError(data.error || 'Failed to start session');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (response.ok) {
        fetchActiveSessions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to stop session');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'TASKER') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Start Session Card */}
      <Card>
        <CardHeader>
          <CardTitle>Start Work Session</CardTitle>
          <CardDescription>
            Select an account to begin tracking your work time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    No accounts assigned
                  </div>
                ) : (
                  accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} - ${account.hourlyRate}/hr
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={handleStartSession}
              disabled={isLoading || !selectedAccount}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Currently running work sessions
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/sessions/history')}
            >
              <Clock className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active sessions
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{session.account.accountName}</h3>
                    <p className="text-sm text-gray-500">
                      Started: {format(new Date(session.startTime), 'MMM d, yyyy HH:mm')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Rate: ${session.hourlyRate}/hr
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <SessionTimer startTime={session.startTime} />
                    <Button
                      variant="destructive"
                      onClick={() => handleStopSession(session.id)}
                      disabled={isLoading}
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
