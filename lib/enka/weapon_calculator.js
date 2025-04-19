// weapon_calculator.js
/**
 * Calculates weapon properties for display purposes, based on Hakush data structure.
 */
import { getHakushWeaponData } from './data_loader.js'; // Adjust path
import { PROP_NAME_TO_ID } from './constants.js';      // Adjust path

const logger = console;

/**
 * Calculates weapon main and random property RAW values based on level and break level.
 * Mimics the logic from the old 'render_weapon_detail'.
 * @param {string | number} weapon_id - Weapon ID.
 * @param {number} weapon_level - Weapon level (1-80).
 * @param {number} weapon_break_level - Weapon promotion/break level (0-5).
 * @returns {object} Object with { baseValue, randValue, basePropId, randPropId } or default values on error.
 */
export function renderWeaponDetailForDisplay(weapon_id, weapon_level, weapon_break_level) {
    const weaponData = getHakushWeaponData(weapon_id); // Use data loader

    // Validate required data structures from Hakush data
    if (!weaponData || !weaponData.Level || !weaponData.Stars || !weaponData.BaseProperty) {
        logger.error(`[WeaponCalculator] Missing required Hakush data fields for weapon_id: ${weapon_id}`);
        return { baseValue: 0, randValue: 0, basePropId: null, randPropId: null };
    }

    // Get scaling factors for the specific level and break level
    const levelData = weaponData.Level[String(weapon_level)];
    const starData = weaponData.Stars[String(weapon_break_level)];

    if (!levelData || !starData) {
        logger.warn(`[WeaponCalculator] Missing level/star data in Hakush for weapon ${weapon_id}. Lvl:${weapon_level}, Break:${weapon_break_level}`);
        // Fallback to base values if scaling data is missing? Or return error?
        // Let's return 0 for scaled values for safety.
        return { baseValue: 0, randValue: 0, basePropId: null, randPropId: null };
    }

    let baseValue = 0;
    let basePropId = null;
    let randValue = 0;
    let randPropId = null;

    try {
        // Calculate Base Property value
        let baseStatRaw = Number(weaponData.BaseProperty.Value) || 0;
        const levelRate = Number(levelData.Rate) || 0;
        const starRate = Number(starData.StarRate) || 0;
        // Formula based on previous code: Base * (1 + LevelRate/10000 + StarRate/10000)
        baseValue = baseStatRaw + baseStatRaw * ((levelRate + starRate) / 10000);
        // Get Base Property ID using mapping
        const basePropNameClean = weaponData.BaseProperty.Name.replace('基础', ''); // Remove '基础' prefix if present
        basePropId = PROP_NAME_TO_ID[basePropNameClean] || null; // Use constant mapping

        // Calculate Random Property value (if it exists)
        if (weaponData.RandProperty && weaponData.RandProperty.Value !== undefined && weaponData.RandProperty.Name2) {
            let randStatRaw = Number(weaponData.RandProperty.Value) || 0;
            if (randStatRaw > 0 && starData.RandRate !== undefined) {
                const randStarRate = Number(starData.RandRate) || 0;
                // Formula: RandBase * (1 + RandStarRate/10000) - Assumption based on previous code
                randValue = randStatRaw + randStatRaw * (randStarRate / 10000);
            } else {
                randValue = randStatRaw; // Use base value if no scaling rate
            }
            // Get Random Property ID using mapping (Name2 seems to be the stat name)
            randPropId = PROP_NAME_TO_ID[weaponData.RandProperty.Name2] || null;
        }

        // Return floor values as the original code did
        return {
            baseValue: Math.floor(baseValue),
            randValue: Math.floor(randValue),
            basePropId: basePropId,
            randPropId: randPropId
        };

    } catch (error) {
        logger.error(`[WeaponCalculator] Error calculating weapon details for ${weapon_id}:`, error);
        return { baseValue: 0, randValue: 0, basePropId: null, randPropId: null };
    }
}
