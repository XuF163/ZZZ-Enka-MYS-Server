// character_calculator.js
/**
 * Provides helper functions related to character base information.
 */
import { getHakushCharacterData } from './data_loader.js'; // Adjust path
import { HAKUSH_RARITY_MAP } from './constants.js';      // Adjust path

const logger = console;

/**
 * Extracts basic character information from Hakush data.
 * @param {string | number} char_id - Character ID.
 * @returns {object | null} Object containing basic info (name, rarity, element, profession, camp) or null if data missing.
 */
export function getCharacterBasicInfo(char_id) {
    const data = getHakushCharacterData(char_id); // Use data loader
    if (!data) {
        logger.warn(`[CharacterCalculator] Hakush data not found for getCharBasicInfo ID: ${char_id}`);
        return null; // Return null instead of default object
    }

    try {
        // Extract element, profession, camp based on Hakush structure
        // Assumes the first key in these objects is the relevant one
        const elementKey = Object.keys(data.ElementType || {})[0];
        const professionKey = Object.keys(data.WeaponType || {})[0];
        const campKey = Object.keys(data.Camp || {})[0];
        const campName = data.Camp?.[campKey] || '?'; // Default camp name

        return {
            id: data.Id,
            name: data.Name || `角色${char_id}`, // Fallback name
            full_name: data.PartnerInfo?.FullName || data.CodeName || data.Name, // Best available full name
            rarity: HAKUSH_RARITY_MAP[data.Rarity] || 'A', // Map rarity using constant
            element_type: parseInt(elementKey) || 0, // Ensure numeric type
            element_name: data.ElementType?.[elementKey] || '未知',
            avatar_profession: parseInt(professionKey) || 0, // Ensure numeric type
            profession_name: data.WeaponType?.[professionKey] || '未知',
            camp_name_mi18n: campName,
            // Icon paths are handled by url_builder, not needed here
        };
    } catch (error) {
        logger.error(`[CharacterCalculator] Error processing basic info for ID ${char_id}:`, error);
        return null;
    }
}
