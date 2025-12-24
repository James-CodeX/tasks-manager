'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { SessionStats } from '@/components/session-stats';
import { formatDuration, formatCurrency } from '@/components/session-timer';
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
import { ArrowLeft, Calendar } from 'lucide-react';
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
}

interface SessionData {
  sessions: Session[];
  totals: {
    totalHours: number;
    totalPayment: number;
  };
}

export default function SessionHistoryPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [data, setData] = useState<SessionData>({ sessions: [], totals: { totalHours: 0, totalPayment: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (user?.role !== 'TASKER') {
      router.push('/dashboard');
      return;
    }
    fetchSessions();
  }, [user, filter]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/sessions/my${statusParam}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const responseData = await response.json();
        setData(responseData);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'TASKER') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/sessions')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Session History</h1>
          <p className="text-gray-600">View your work session records</p>
        </div>
      </div>

      <SessionStats
        totalHours={data.totals.totalHours}
        totalPayment={data.totals.totalPayment}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Work Sessions</CardTitle>
              <CardDescription>
                Complete history of your work sessions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : data.sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sessions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.account.accountName}
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.startTime), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {session.endTime ? (
                        format(new Date(session.endTime), 'MMM d, yyyy HH:mm')
                      ) : (
                        <span className="text-green-600 font-semibold">Active</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.totalHours ? (
                        formatDuration(session.totalHours)
                      ) : (
                        '-'
                      )}
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
