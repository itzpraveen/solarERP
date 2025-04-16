import React from 'react';
import { Chip, ChipProps, useTheme, alpha, Tooltip } from '@mui/material';

// Status types with their corresponding colors
export type StatusType =
  | 'draft'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'in-progress'
  | 'on-hold'
  | 'scheduled'
  | 'paid'
  | 'unpaid'
  | 'overdue'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'default';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: StatusType | string;
  label?: string;
  tooltip?: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
  withDot?: boolean;
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  tooltip,
  size = 'small',
  variant = 'filled',
  withDot = false,
  ...chipProps
}) => {
  const theme = useTheme();

  // Get color based on status
  const getStatusColor = (status: string) => {
    const statusMap: Record<
      string,
      { color: string; bgColor: string; borderColor: string }
    > = {
      // Standard statuses
      draft: {
        color: theme.palette.grey[700],
        bgColor: theme.palette.grey[100],
        borderColor: theme.palette.grey[300],
      },
      pending: {
        color: theme.palette.warning.dark,
        bgColor: alpha(theme.palette.warning.main, 0.12),
        borderColor: alpha(theme.palette.warning.main, 0.3),
      },
      active: {
        color: theme.palette.success.dark,
        bgColor: alpha(theme.palette.success.main, 0.12),
        borderColor: alpha(theme.palette.success.main, 0.3),
      },
      inactive: {
        color: theme.palette.grey[600],
        bgColor: theme.palette.grey[100],
        borderColor: theme.palette.grey[300],
      },
      approved: {
        color: theme.palette.success.dark,
        bgColor: alpha(theme.palette.success.main, 0.12),
        borderColor: alpha(theme.palette.success.main, 0.3),
      },
      rejected: {
        color: theme.palette.error.dark,
        bgColor: alpha(theme.palette.error.main, 0.12),
        borderColor: alpha(theme.palette.error.main, 0.3),
      },
      completed: {
        color: theme.palette.success.dark,
        bgColor: alpha(theme.palette.success.main, 0.12),
        borderColor: alpha(theme.palette.success.main, 0.3),
      },
      cancelled: {
        color: theme.palette.error.dark,
        bgColor: alpha(theme.palette.error.main, 0.12),
        borderColor: alpha(theme.palette.error.main, 0.3),
      },
      'in-progress': {
        color: theme.palette.info.dark,
        bgColor: alpha(theme.palette.info.main, 0.12),
        borderColor: alpha(theme.palette.info.main, 0.3),
      },
      'on-hold': {
        color: theme.palette.warning.dark,
        bgColor: alpha(theme.palette.warning.main, 0.12),
        borderColor: alpha(theme.palette.warning.main, 0.3),
      },
      scheduled: {
        color: theme.palette.info.dark,
        bgColor: alpha(theme.palette.info.main, 0.12),
        borderColor: alpha(theme.palette.info.main, 0.3),
      },
      paid: {
        color: theme.palette.success.dark,
        bgColor: alpha(theme.palette.success.main, 0.12),
        borderColor: alpha(theme.palette.success.main, 0.3),
      },
      unpaid: {
        color: theme.palette.warning.dark,
        bgColor: alpha(theme.palette.warning.main, 0.12),
        borderColor: alpha(theme.palette.warning.main, 0.3),
      },
      overdue: {
        color: theme.palette.error.dark,
        bgColor: alpha(theme.palette.error.main, 0.12),
        borderColor: alpha(theme.palette.error.main, 0.3),
      },

      // Semantic statuses
      success: {
        color: theme.palette.success.dark,
        bgColor: alpha(theme.palette.success.main, 0.12),
        borderColor: alpha(theme.palette.success.main, 0.3),
      },
      error: {
        color: theme.palette.error.dark,
        bgColor: alpha(theme.palette.error.main, 0.12),
        borderColor: alpha(theme.palette.error.main, 0.3),
      },
      warning: {
        color: theme.palette.warning.dark,
        bgColor: alpha(theme.palette.warning.main, 0.12),
        borderColor: alpha(theme.palette.warning.main, 0.3),
      },
      info: {
        color: theme.palette.info.dark,
        bgColor: alpha(theme.palette.info.main, 0.12),
        borderColor: alpha(theme.palette.info.main, 0.3),
      },

      // Default
      default: {
        color: theme.palette.grey[700],
        bgColor: theme.palette.grey[100],
        borderColor: theme.palette.grey[300],
      },
    };

    // Convert status to lowercase and handle special cases
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');

    return statusMap[normalizedStatus] || statusMap.default;
  };

  const { color, bgColor, borderColor } = getStatusColor(status);

  // Determine label text
  const displayLabel =
    label ||
    status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');

  const chip = (
    <Chip
      label={displayLabel}
      size={size}
      variant={variant}
      sx={{
        color,
        backgroundColor: variant === 'filled' ? bgColor : 'transparent',
        borderColor: variant === 'outlined' ? borderColor : 'transparent',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        height: size === 'small' ? 24 : 32,
        '& .MuiChip-label': {
          px: withDot ? 1.5 : 2,
          pl: withDot ? 2 : undefined,
        },
        '&::before': withDot
          ? {
              content: '""',
              display: 'block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: color,
              marginRight: 1,
            }
          : undefined,
        ...chipProps.sx,
      }}
      {...chipProps}
    />
  );

  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {chip}
      </Tooltip>
    );
  }

  return chip;
};

export default StatusChip;
