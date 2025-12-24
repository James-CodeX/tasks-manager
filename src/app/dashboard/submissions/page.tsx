'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { StatusBadge } from '@/components/status-badge';
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
import { Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Submission {
  id: string;
  taskId: string;
  screenshotUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes: string | null;
  reviewedAt: string | null;
  account: {
    accountName: string;
    accountType: string;
  };
  tasker: {
    fullName: string;
    email: string;
  };
  reviewer?: {
    fullName: string;
  } | null;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const endpoint = user?.role === 'TASKER' ? '/api/submissions/my' : '/api/submissions';
      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedSubmission) return;

    setIsReviewing(true);
    try {
      const response = await fetch(`/api/submissions/${selectedSubmission.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          notes: reviewNotes || undefined,
        }),
      });

      if (response.ok) {
        setIsReviewDialogOpen(false);
        setSelectedSubmission(null);
        setReviewNotes('');
        fetchSubmissions();
      }
    } catch (err) {
      console.error('Failed to review submission:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const openReviewDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewNotes('');
    setIsReviewDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Submissions</CardTitle>
              <CardDescription>
                {user?.role === 'TASKER' 
                  ? 'View and manage your task submissions'
                  : 'Review and approve task submissions'}
              </CardDescription>
            </div>
            {user?.role === 'TASKER' && (
              <Button onClick={() => router.push('/dashboard/submissions/submit')}>
                <Plus className="w-4 h-4 mr-2" />
                Submit Task
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No submissions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  {user?.role === 'MANAGER' && <TableHead>Tasker</TableHead>}
                  <TableHead>Account</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.taskId}</TableCell>
                    {user?.role === 'MANAGER' && (
                      <TableCell>{submission.tasker.fullName}</TableCell>
                    )}
                    <TableCell>{submission.account.accountName}</TableCell>
                    <TableCell>
                      {format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={submission.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewDialog(submission)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {user?.role === 'MANAGER' && submission.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                handleReview('APPROVED');
                              }}
                              disabled={isReviewing}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                handleReview('REJECTED');
                              }}
                              disabled={isReviewing}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Review the task submission
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Task ID</Label>
                  <p className="text-sm font-medium">{selectedSubmission.taskId}</p>
                </div>
                <div>
                  <Label>Account</Label>
                  <p className="text-sm font-medium">{selectedSubmission.account.accountName}</p>
                </div>
                <div>
                  <Label>Submitted At</Label>
                  <p className="text-sm">
                    {format(new Date(selectedSubmission.submittedAt), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <StatusBadge status={selectedSubmission.status} />
                </div>
              </div>

              <div>
                <Label>Screenshot</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <img 
                    src={selectedSubmission.screenshotUrl} 
                    alt="Task screenshot" 
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {selectedSubmission.notes && (
                <div>
                  <Label>Tasker Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedSubmission.notes}</p>
                </div>
              )}

              {selectedSubmission.status !== 'PENDING' && (
                <>
                  <div>
                    <Label>Reviewed By</Label>
                    <p className="text-sm mt-1">{selectedSubmission.reviewer?.fullName}</p>
                  </div>
                  <div>
                    <Label>Reviewed At</Label>
                    <p className="text-sm mt-1">
                      {selectedSubmission.reviewedAt && format(new Date(selectedSubmission.reviewedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </>
              )}

              {user?.role === 'MANAGER' && selectedSubmission.status === 'PENDING' && (
                <div>
                  <Label htmlFor="reviewNotes">Review Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes (optional)..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
              )}

              {user?.role === 'MANAGER' && selectedSubmission.status === 'PENDING' && (
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => handleReview('APPROVED')}
                    disabled={isReviewing}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReview('REJECTED')}
                    disabled={isReviewing}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
