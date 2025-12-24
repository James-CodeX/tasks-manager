'use client';

import { Badge } from '@/components/ui/badge';

type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const variants: Record<PaymentStatus, { variant: any; label: string }> = {
    PENDING: { variant: 'secondary', label: 'Pending' },
    PAID: { variant: 'default', label: 'Paid' },
    CANCELLED: { variant: 'destructive', label: 'Cancelled' },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
