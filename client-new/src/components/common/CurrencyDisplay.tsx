import { useState, useEffect } from 'react';
import { formatCurrencySync } from '../../utils/formatters';
import { getSystemSettings } from '../../api/settingsService';

interface CurrencyDisplayProps {
  amount: number;
  currencyCode?: string;
  className?: string;
}

/**
 * Component to display currency values consistently throughout the application
 * Automatically uses system currency settings unless overridden
 */
const CurrencyDisplay = ({
  amount,
  currencyCode,
  className,
}: CurrencyDisplayProps) => {
  const [formattedValue, setFormattedValue] = useState<string>('');

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        if (currencyCode) {
          // If a specific currency is provided, use it
          setFormattedValue(formatCurrencySync(amount, currencyCode));
        } else {
          // Otherwise use the system setting
          const settings = await getSystemSettings();
          setFormattedValue(
            formatCurrencySync(amount, settings.unitPreferences.currency)
          );
        }
      } catch (error) {
        console.error('Error loading currency settings:', error);
        // Fallback to INR
        setFormattedValue(formatCurrencySync(amount));
      }
    };

    loadCurrency();
  }, [amount, currencyCode]);

  return <span className={className}>{formattedValue}</span>;
};

export default CurrencyDisplay;
