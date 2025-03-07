import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Description as DocumentIcon,
  Assignment as ContractIcon,
  Receipt as InvoiceIcon,
  Star as ProposalIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

const Documents: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Documents
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom color="primary">
          Coming Soon!
        </Typography>
        
        <Typography variant="body1" paragraph>
          The Documents module is currently under development. This feature will allow you to create, manage, and track all your important project documents in one place.
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Planned Features
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <ProposalIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Proposal Templates" 
                      secondary="Create and manage professional proposal templates" 
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <ContractIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Contract Management" 
                      secondary="Generate, send and track contract signatures" 
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <InvoiceIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Invoice Generation" 
                      secondary="Automatically create invoices from project data" 
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <DocumentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Document Storage" 
                      secondary="Centralized storage for all project-related files" 
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Expiration Tracking" 
                      secondary="Automatic notifications for document expirations" 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Implementation Timeline
                </Typography>
                <Typography variant="body2" paragraph>
                  The Documents module is scheduled for implementation in the next development sprint. We're currently working on:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Backend API integration" 
                      secondary="Establishing secure document storage and retrieval" 
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Document template engine" 
                      secondary="Creating a flexible template system for all document types" 
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  
                  <ListItem>
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Digital signature integration" 
                      secondary="Adding secure e-signature capabilities" 
                    />
                  </ListItem>
                </List>
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                  We appreciate your patience as we work to make this feature available soon!
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Documents;