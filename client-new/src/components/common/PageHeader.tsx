import React from 'react';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link, 
  Button, 
  useTheme, 
  alpha,
  Paper,
  Divider,
  useMediaQuery
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
  children
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Paper 
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: theme.shape.borderRadius * 1.5,
        // overflow: 'hidden', // Removed to prevent text clipping
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      <Box 
        sx={{ 
          // Padding moved to inner Box
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.background.paper, 0.5)})`,
        }}
      >
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs 
            aria-label="breadcrumb" 
            sx={{ 
              mb: 1.5,
              '& .MuiBreadcrumbs-ol': {
                flexWrap: 'wrap',
              },
              '& .MuiBreadcrumbs-li': {
                fontSize: '0.85rem',
              }
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
                    }
                  }}
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}

        {/* Back Link */}
        {backLink && (
          <Button
            component={RouterLink}
            to={backLink}
            startIcon={<ArrowBackIcon />}
            sx={{ 
              mb: 2,
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            {backLabel}
          </Button>
        )}

        {/* Header Content */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 }, // Added padding to inner flex box
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'flex-start', // Revert to always align top
            // gap: 2,
          }}
        >
          {/* Removed inner Box wrapper */}
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                lineHeight: 'normal', // Let browser handle title line height
                mb: 1, // Add explicit bottom margin to title
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  mt: 0, // Revert negative margin
                  maxWidth: '800px',
                  lineHeight: 'normal', // Let browser calculate line height
                  // pt: 0.2,
                }}
              >
                {subtitle}
              </Typography>
            )}
          {/* Removed inner Box wrapper */}

          {/* Action Button */}
          {action && (
            <Box sx={{
              mt: { xs: 1, md: 0 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1, // Keep gap for row layout
              alignItems: { xs: 'stretch', sm: 'center' },
              // Reverted specific margin for stacked buttons
            }}>
              {action}
            </Box>
          )}
        </Box>
      </Box>

      {/* Optional Children Content */}
      {children && (
        <>
          <Divider />
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {children}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default PageHeader;