import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  useTheme,
  alpha,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';


interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  backLink?: string;
  backLabel?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  backLink,
  backLabel = 'Back',
  action,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    // Replaced Paper with Box and removed Paper-specific styling
    <Box sx={{ mb: 3 }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
          {' '}
          {/* Added padding wrapper for breadcrumbs */}
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{
              mb: 1.5,
              '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' },
              '& .MuiBreadcrumbs-li': { fontSize: '0.85rem' },
            }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography
                  key={index}
                  color="text.primary"
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={index}
                  component={RouterLink}
                  to={crumb.link || '#'}
                  color="text.secondary"
                  sx={{
                    fontSize: '0.85rem',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
          {/* Removed duplicate closing tag */}
        </Box>
      )}

      {/* Back Link */}
      {backLink && (
        <Box sx={{ px: { xs: 2, sm: 3 } }}>
          {' '}
          {/* Added padding wrapper */}
          <Button
            component={RouterLink}
            to={backLink}
            startIcon={<ArrowBackIcon />}
            sx={{
              mb: 2,
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            {backLabel}
          </Button>
        </Box>
      )}

      {/* Header Content */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 }, // Retained padding here
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'flex-start', // Align top
          gap: 2, // Added gap for spacing between title/subtitle and action
        }}
      >
        {/* Title and Subtitle */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            component="h1"
            sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}
          >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: '800px' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Action Button */}
          {action && (
            <Box
              sx={{
                mt: { xs: 2, md: 0 }, // Adjusted margin top for spacing
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                alignItems: { xs: 'stretch', sm: 'center' },
                flexShrink: 0, // Prevent action button from shrinking
              }}
            >
              {action}
            </Box>
          )}
        </Box>

      {/* Optional Children Content */}
      {children && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Divider sx={{ mb: 2 }} /> {/* Added margin bottom to divider */}
          {children}
        </Box>
      )}
    </Box>
  );
}; // Added missing closing brace and semicolon

export default PageHeader;
