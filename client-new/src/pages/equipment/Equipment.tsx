import { Box, Typography, Paper, Button, Grid, Card, CardContent, CardMedia, Stack, Chip } from '@mui/material';
import { 
  Inventory as InventoryIcon,
  ElectricBolt as PanelIcon,
  Memory as InverterIcon,
  Battery90 as BatteryIcon,
  Construction as ToolsIcon,
  NotificationsActive as ComingSoonIcon
} from '@mui/icons-material';

const Equipment = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
        Equipment Inventory
      </Typography>

      <Paper sx={{ p: 3, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <ComingSoonIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Equipment Management Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mb: 3 }}>
          Our comprehensive equipment inventory management system is currently under development. 
          Soon you'll be able to track all your solar equipment inventory, manage stock levels, 
          and seamlessly integrate with your projects.
        </Typography>
        <Chip 
          label="In Development" 
          color="primary" 
          variant="outlined" 
          size="medium"
        />
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
        Key Features Coming Soon:
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6" component="div">
                  Inventory Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Monitor stock levels, set minimum thresholds, and get low-stock alerts
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <PanelIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6" component="div">
                  Equipment Catalog
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Maintain a detailed catalog of solar panels, inverters, batteries, and more
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <BatteryIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6" component="div">
                  Project Integration
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Automatically track equipment allocation across your solar projects
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <ToolsIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6" component="div">
                  Stock Management
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Add, adjust, and track equipment stock with a detailed history log
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <Button 
          variant="contained" 
          disabled
          startIcon={<ComingSoonIcon />}
          sx={{ mt: 2 }}
        >
          Equipment Module Coming Soon
        </Button>
      </Box>
    </Box>
  );
};

export default Equipment;