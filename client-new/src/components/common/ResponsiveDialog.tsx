import React from 'react';
import { Dialog, DialogProps, useMediaQuery, useTheme } from '@mui/material';

const ResponsiveDialog: React.FC<DialogProps> = ({ children, ...dialogProps }) => {
  const theme = useTheme();
  const isFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog fullScreen={isFullScreen} {...dialogProps}>
      {children}
    </Dialog>
  );
};

export default ResponsiveDialog;