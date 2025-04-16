import React from 'react';
import {
  TextField,
  TextFieldProps,
  Select,
  SelectProps,
  MenuItem,
  FormControl,
  FormControlProps,
  InputLabel,
  FormHelperText,
  Checkbox,
  CheckboxProps,
  FormControlLabel,
  Radio,
  RadioProps,
  RadioGroup,
  RadioGroupProps,
  Switch,
  SwitchProps,
  Button,
  ButtonProps,
  Box,
  Typography,
  useTheme,
  alpha,
  Divider,
  Grid,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Help as HelpIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Enhanced TextField with improved styling
export const FormTextField: React.FC<TextFieldProps> = (props) => {
  const theme = useTheme();

  return (
    <TextField
      fullWidth
      variant="outlined"
      size="medium"
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: theme.shape.borderRadius,
          transition: 'all 0.2s ease-in-out',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.primary.main, 0.5),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
        '& .MuiInputLabel-root': {
          '&.Mui-focused': {
            color: theme.palette.primary.main,
          },
        },
        ...props.sx,
      }}
      {...props}
    />
  );
};

// Enhanced Select component
export interface FormSelectProps extends Omit<SelectProps, 'onChange'> {
  label: string;
  options: Array<{ value: string | number; label: string }>;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  onChange?: (value: unknown) => void;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  options,
  helperText,
  error,
  required,
  onChange,
  ...props
}) => {
  const theme = useTheme();

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <FormControl
      fullWidth
      error={error}
      required={required}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: theme.shape.borderRadius,
          transition: 'all 0.2s ease-in-out',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.primary.main, 0.5),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
        '& .MuiInputLabel-root': {
          '&.Mui-focused': {
            color: theme.palette.primary.main,
          },
        },
      }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        onChange={handleChange as any}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: theme.shape.borderRadius,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              maxHeight: 300,
            },
          },
        }}
        {...props}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Enhanced Checkbox with label
export interface FormCheckboxProps extends CheckboxProps {
  label: string;
  helperText?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  helperText,
  ...props
}) => {
  const theme = useTheme();

  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox
            sx={{
              color: theme.palette.primary.main,
              '&.Mui-checked': {
                color: theme.palette.primary.main,
              },
            }}
            {...props}
          />
        }
        label={
          <Typography variant="body2" color="textPrimary">
            {label}
          </Typography>
        }
      />
      {helperText && (
        <FormHelperText sx={{ ml: 4 }}>{helperText}</FormHelperText>
      )}
    </Box>
  );
};

// Enhanced Radio with label
export interface FormRadioProps extends RadioProps {
  label: string;
}

export const FormRadio: React.FC<FormRadioProps> = ({ label, ...props }) => {
  const theme = useTheme();

  return (
    <FormControlLabel
      control={
        <Radio
          sx={{
            color: theme.palette.primary.main,
            '&.Mui-checked': {
              color: theme.palette.primary.main,
            },
          }}
          {...props}
        />
      }
      label={
        <Typography variant="body2" color="textPrimary">
          {label}
        </Typography>
      }
    />
  );
};

// Enhanced RadioGroup
export interface FormRadioGroupProps extends RadioGroupProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  helperText?: string;
  error?: boolean;
  required?: boolean;
}

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  label,
  options,
  helperText,
  error,
  required,
  ...props
}) => {
  return (
    <FormControl component="fieldset" error={error} required={required}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <RadioGroup {...props}>
        {options.map((option) => (
          <FormRadio
            key={option.value}
            value={option.value}
            label={option.label}
          />
        ))}
      </RadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Enhanced Switch with label
export interface FormSwitchProps extends SwitchProps {
  label: string;
  helperText?: string;
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
  label,
  helperText,
  ...props
}) => {
  const theme = useTheme();

  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: theme.palette.primary.main,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: alpha(theme.palette.primary.main, 0.5),
              },
            }}
            {...props}
          />
        }
        label={
          <Typography variant="body2" color="textPrimary">
            {label}
          </Typography>
        }
      />
      {helperText && (
        <FormHelperText sx={{ ml: 4 }}>{helperText}</FormHelperText>
      )}
    </Box>
  );
};

// Form Section with title and optional help text
export interface FormSectionProps {
  title: string;
  subtitle?: string;
  helpText?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  helpText,
  children,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: theme.shape.borderRadius * 1.5,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(to right, ${alpha(
            theme.palette.primary.main,
            0.03
          )}, ${alpha(theme.palette.background.paper, 0.5)})`,
          cursor: collapsible ? 'pointer' : 'default',
        }}
        onClick={toggleExpanded}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            {helpText && (
              <Tooltip title={helpText} arrow>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {collapsible && (
          <IconButton size="small">
            {expanded ? (
              <CloseIcon fontSize="small" />
            ) : (
              <InfoIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>
      <Divider />
      <Box
        sx={{
          p: 3,
          display: collapsible && !expanded ? 'none' : 'block',
        }}
      >
        <Grid container spacing={3}>
          {children}
        </Grid>
      </Box>
    </Paper>
  );
};

// Form Actions component for consistent button placement
export interface FormActionsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelText?: string;
  submitText?: string;
  cancelButtonProps?: ButtonProps;
  submitButtonProps?: ButtonProps;
  direction?: 'row' | 'row-reverse';
  loading?: boolean;
  extraActions?: React.ReactNode;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  onSubmit,
  cancelText = 'Cancel',
  submitText = 'Submit',
  cancelButtonProps,
  submitButtonProps,
  direction = 'row-reverse',
  loading = false,
  extraActions,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: direction === 'row' ? 'flex-start' : 'flex-end',
        alignItems: 'center',
        flexDirection: direction,
        gap: 2,
        mt: 3,
      }}
    >
      {onSubmit && (
        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={loading}
          {...submitButtonProps}
        >
          {submitText}
        </Button>
      )}
      {onCancel && (
        <Button
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={loading}
          {...cancelButtonProps}
        >
          {cancelText}
        </Button>
      )}
      {extraActions && (
        <Box sx={{ mr: 'auto', display: 'flex', gap: 1 }}>{extraActions}</Box>
      )}
    </Box>
  );
};
