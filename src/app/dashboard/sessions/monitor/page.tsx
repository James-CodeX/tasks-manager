'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { SessionTimer, formatDuration, formatCurrency } from '@/components/session-timer';
import { SessionStats } from '@/components/session-stats';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Session {
  id: string;
  startTime: string;
  endTime: string | null;
  totalHours: number | null;
  hourlyRate: number;
  totalPayment: number | null;
  account: {
    accountName: string;
    accountType: string;
  };
  tasker: {
    fullName: string;
    email: string;
  };
}

interface SessionData {
  sessions: Session[];
  totals: {
    totalHours: number;
    totalPayment: number;
  };
}

export default function SessionMonitorPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [activeData, setActiveData] = useState<Session[]>([]);
  const [recentData, setRecentData] = useState<SessionData>({ sessions: [], totals: { totalHours: 0, totalPayment: 0 } });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }
    fetchSessions();
    
    // Refresh active sessions every 30 seconds
    const interval = setInterval(() => {
      fetchActiveSessions();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchSessions = async () => {
    setIsLoading(true);
    await Promise.all([fetchActiveSessions(), fetchRecentSessions()]);
    setIsLoading(false);
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/sessions/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveData(data);
      }
    } catch (err) {
      console.error('Failed to fetch active sessions:', err);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const response = await fetch('/api/sessions?status=completed', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentData({
          sessions: data.sessions.slice(0, 10), // Only show 10 most recent
          totals: data.totals,
        });
      }
    } catch (err) {
      console.error('Failed to fetch recent sessions:', err);
    }
  };

  if (user?.role !== 'MANAGER') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Work Session Monitor</h1>
        <p className="text-gray-600">Monitor active and completed work sessions</p>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Currently running work sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : activeData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active sessions
            </div>
          ) : (
            <div className="space-y-4">
              {activeData.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{session.tasker.fullName}</h3>
                      <Badge>Active</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {session.account.accountName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Started: {format(new Date(session.startTime), 'MMM d, yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Rate: ${session.hourlyRate}/hr
                    </p>
                  </div>
                  <SessionTimer startTime={session.startTime} className="text-green-600" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <SessionStats
        totalHours={recentData.totals.totalHours}
        totalPayment={recentData.totals.totalPayment}
      />

      {/* Recent Completed Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Sessions</CardTitle>
          <CardDescription>Latest 10 completed work sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : recentData.sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No completed sessions
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tasker</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentData.sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.tasker.fullName}
                    </TableCell>
                    <TableCell>{session.account.accountName}</TableCell>
                    <TableCell>
                      {format(new Date(session.startTime), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {session.totalHours ? formatDuration(session.totalHours) : '-'}
                    </TableCell>
                    <TableCell>${session.hourlyRate.toFixed(2)}/hr</TableCell>
                    <TableCell>
                      {session.totalPayment ? (
                        <span className="font-semibold">
                          {formatCurrency(session.totalPayment)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
