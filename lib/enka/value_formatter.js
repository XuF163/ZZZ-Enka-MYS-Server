// value_formatter.js
/**
 * Provides functions to format raw stat values into display strings.
 */
import { PERCENT_ID_LIST } from './constants.js'; // Adjust path

const logger = console;

/**
 * Formats a raw stat value (typically integer) into a display string (e.g., "100", "12.3%").
 * Based on the logic from the old 'formatEquipWeaponPropValue'.
 * @param {number | string | null | undefined} value - The raw numeric value.
 * @param {string | number} prop_id - The property ID to determine formatting type.
 * @returns {string} Formatted string.
 */
export function formatStatValueForDisplay(value, prop_id) {
    const idStr = String(prop_id);
    const isPercentProp = PERCENT_ID_LIST.includes(idStr); // Use imported constant
    const numericValue = Number(value);

    if (value === undefined || value === null || isNaN(numericValue)) {
        return isPercentProp ? '0.0%' : '0';
    }

    try {
        if (isPercentProp) {
            // Divide by 100 for display percentage
            return (numericValue / 100).toFixed(1) + '%';
        } else if (idStr === '30503' || idStr === '30501') { // Energy Regen (flat)
             // Assuming internal value is 1000x per second rate?
             return (numericValue / 1000).toFixed(2);
        } else {
            // Default: integer display
            return String(Math.floor(numericValue));
        }
    } catch (e) {
        logger.error(`[ValueFormatter] Error formatting value ${value} for prop_id ${prop_id}:`, e);
        return isPercentProp ? '0.0%' : '0'; // Fallback
    }
}
