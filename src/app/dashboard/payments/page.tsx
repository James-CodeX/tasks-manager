'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { PaymentStats } from '@/components/payment-stats';
import { Download, Plus, Loader2 } from 'lucide-react';

interface Payment {
  id: number;
  taskerId: number;
  tasker: {
    username: string;
  };
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paidAt: string | null;
  notes: string | null;
}

interface PaymentSummary {
  totalAmount: number;
  totalHours: number;
  pendingAmount: number;
  paidAmount: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalAmount: 0,
    totalHours: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
  });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchPayments();
  }, [filters]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments);
      setSummary({
        totalAmount: data.totalAmount,
        totalHours: data.totalHours,
        pendingAmount: data.pendingAmount,
        paidAmount: data.paidAmount,
      });
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/payments/export?${params}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      const res = await fetch(`/api/payments/${id}/mark-paid`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (res.ok) {
        fetchPayments();
      }
    } catch (err) {
      console.error('Failed to mark as paid:', err);
    }
  };

  const isManager = currentUser?.role === 'MANAGER';

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage payment records and payroll</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {isManager && (
            <Button onClick={() => router.push('/dashboard/payments/generate')}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Payment
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <PaymentStats {...summary} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>View and manage payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isManager && <TableHead>Tasker</TableHead>}
                  <TableHead>Period</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Date</TableHead>
                  {isManager && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isManager ? 7 : 6} className="text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      {isManager && <TableCell>{payment.tasker.username}</TableCell>}
                      <TableCell>
                        {format(new Date(payment.periodStart), 'MMM d, yyyy')} -{' '}
                        {format(new Date(payment.periodEnd), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{payment.totalHours.toFixed(2)}h</TableCell>
                      <TableCell className="font-medium">${payment.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell>
                        {payment.paidAt ? format(new Date(payment.paidAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      {isManager && (
                        <TableCell>
                          {payment.status === 'PENDING' && (
                            <Button size="sm" onClick={() => handleMarkPaid(payment.id)}>
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
