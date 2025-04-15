import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  useTheme, 
  alpha,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface ContentCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  onRefresh?: () => void;
  noPadding?: boolean;
  elevation?: number;
  headerBg?: 'default' | 'primary' | 'secondary' | 'transparent';
  children: React.ReactNode;
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  subtitle,
  icon,
  action,
  collapsible = false,
  defaultExpanded = true,
  onRefresh,
  noPadding = false,
  elevation = 0,
  headerBg = 'default',
  children
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Determine header background color
  const getHeaderBgColor = () => {
    switch (headerBg) {
      case 'primary':
        return `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`;
      case 'secondary':
        return `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`;
      case 'transparent':
        return 'transparent';
      default:
        return `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.background.paper, 0.5)})`;
    }
  };

  // Determine header text color
  const getHeaderTextColor = () => {
    switch (headerBg) {
      case 'primary':
      case 'secondary':
        return theme.palette.common.white;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Paper
      elevation={elevation}
      sx={{
        borderRadius: theme.shape.borderRadius * 1.5,
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        boxShadow: elevation === 0 ? '0 4px 20px rgba(0, 0, 0, 0.03)' : undefined,
        border: elevation === 0 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 6px 25px rgba(0, 0, 0, 0.05)',
        },
      }}
    >
      {/* Card Header */}
      {(title || subtitle || action || collapsible || onRefresh) && (
        <>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: getHeaderBgColor(),
              color: getHeaderTextColor(),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {icon && (
                <Box 
                  sx={{ 
                    color: headerBg === 'default' || headerBg === 'transparent' 
                      ? theme.palette.primary.main 
                      : 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {icon}
                </Box>
              )}
              <Box>
                {title && (
                  <Typography 
                    variant="h6" 
                    component="h2"
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography 
                    variant="body2" 
                    color={headerBg === 'default' || headerBg === 'transparent' ? 'text.secondary' : 'inherit'}
                    sx={{ 
                      mt: 0.5,
                      opacity: headerBg === 'default' || headerBg === 'transparent' ? 1 : 0.8,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {action}
              
              {onRefresh && (
                <Tooltip title="Refresh">
                  <IconButton 
                    onClick={onRefresh}
                    size="small"
                    sx={{ 
                      color: headerBg === 'default' || headerBg === 'transparent' 
                        ? theme.palette.text.secondary 
                        : 'inherit',
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {collapsible && (
                <Tooltip title={expanded ? "Collapse" : "Expand"}>
                  <IconButton 
                    onClick={toggleExpanded}
                    size="small"
                    sx={{ 
                      color: headerBg === 'default' || headerBg === 'transparent' 
                        ? theme.palette.text.secondary 
                        : 'inherit',
                      transition: 'transform 0.2s',
                    }}
                  >
                    {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Card Content */}
      <Collapse in={!collapsible || expanded} timeout="auto" sx={{ flexGrow: 1 }}>
        <Box 
          sx={{ 
            p: noPadding ? 0 : 2,
            height: '100%',
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ContentCard;