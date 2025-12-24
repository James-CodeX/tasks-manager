'use client';

import { Badge } from '@/components/ui/badge';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<Status, { variant: any; label: string }> = {
    PENDING: { variant: 'secondary', label: 'Pending' },
    APPROVED: { variant: 'default', label: 'Approved' },
    REJECTED: { variant: 'destructive', label: 'Rejected' },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
