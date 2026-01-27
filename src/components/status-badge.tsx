import { Circle, CircleDot, Check, AlertTriangle } from 'lucide-react';

type StatusBadgeProps = {
  status: 'draft' | 'sent' | 'paid' | 'overdue';
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    draft: {
      Icon: Circle,
      label: 'Draft',
      textColor: 'var(--status-draft-text)',
      bgColor: 'var(--status-draft-bg)',
    },
    sent: {
      Icon: CircleDot,
      label: 'Sent',
      textColor: 'var(--status-sent-text)',
      bgColor: 'var(--status-sent-bg)',
    },
    paid: {
      Icon: Check,
      label: 'Paid',
      textColor: 'var(--status-paid-text)',
      bgColor: 'var(--status-paid-bg)',
    },
    overdue: {
      Icon: AlertTriangle,
      label: 'Overdue',
      textColor: 'var(--status-overdue-text)',
      bgColor: 'var(--status-overdue-bg)',
    },
  };

  const { Icon, label, textColor, bgColor } = config[status];

  return (
    <span
      role="status"
      style={{
        color: textColor,
        backgroundColor: bgColor,
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
