// skill_processor.js
/**
 * Processes raw skill data (from Hakush) and levels (from Enka)
 * to generate the formatted skill list for the MYS data structure.
 */
import _ from 'lodash';
import { ENKA_INDEX_TO_HAKUSH_SKILL_KEY, ID_TO_PROP_NAME } from './constants.js'; // Adjust path
// Assuming getHakushCharacterData is available if needed, but preferable to pass data in.

const logger = console;

/**
 * Cleans skill description text by removing common formatting tags.
 * @param {string} text - The raw description text.
 * @returns {string} Cleaned text.
 */
function cleanDescriptionText(text) {
    if (!text) return '';
    return text
        .replace(/<color=#[0-9A-Fa-f]+>/gi, '') // Remove color start tags
        .replace(/<\/color>/gi, '')            // Remove color end tags
        .replace(/<IconMap:[^>]+>/g, '')     // Remove icon placeholders
        // Simplify layout tags like {LAYOUT_CONSOLECONTROLLER#A}{LAYOUT_FALLBACK#B} to B
        .replace(/{LAYOUT_CONSOLECONTROLLER#[^}]+}{LAYOUT_FALLBACK#([^}]+)}/g, '$1')
        // Remove any other {} tags as a fallback
        .replace(/{[^}]+}/g,'')
        .trim();
}

/**
 * Calculates and formats a skill multiplier based on level and Hakush param data.
 * @param {object} paramInfo - The parameter object from Hakush skill data.
 * @param {number} currentLevel - The current skill level from Enka data.
 * @returns {{name: string, value: string} | null} Formatted multiplier name and value, or null if invalid.
 */
function processSkillMultiplier(paramInfo, currentLevel) {
    try {
        if (paramInfo.Param) {
            const paramDict = paramInfo.Param;
            // Find the first (and usually only) key in the Param object, which holds the values
            const effectKey = Object.keys(paramDict)[0];
            if (effectKey && paramDict[effectKey]) {
                const skillValue = paramDict[effectKey]; // Contains { Main, Growth, Format }
                const mainValue = Number(skillValue.Main) || 0;
                const growthValue = Number(skillValue.Growth) || 0;
                // Calculate raw value based on level
                let finalValueRaw = mainValue + growthValue * (currentLevel - 1);
                let displayValue = '';
                const format = skillValue.Format || '';

                // Determine formatting based on Hakush 'Format' string
                if (format.includes('%') || format.includes('P')) { // Assume 'P' means percent
                    // Hakush values often 100x for percent, divide by 100
                    displayValue = (finalValueRaw / 100).toFixed(1) + '%';
                } else if (format === 'I' || format === '' || format.includes('{0:0.#}') || format.includes('F')) { // Assume integer or float needing rounding
                    // Special case for damage/stun multipliers (often shown as % despite format)
                    if (paramInfo.Name?.includes('伤害倍率') || paramInfo.Name?.includes('失衡倍率')) {
                        displayValue = (finalValueRaw / 100).toFixed(1) + '%';
                    } else {
                        // Default integer rounding (assuming 100x internal value)
                        displayValue = String(Math.round(finalValueRaw / 100));
                    }
                } else {
                    // Default fallback - might need adjustment based on observed data
                    displayValue = String(finalValueRaw); // Or maybe finalValueRaw / 100?
                    logger.warn(`[SkillProcessor] Unknown format '${format}' for skill param '${paramInfo.Name}'. Using raw value: ${displayValue}`);
                }

                return { name: paramInfo.Name || '数值', value: displayValue };
            }
        }
    } catch (error) {
        logger.error(`[SkillProcessor] Error processing multiplier for param: ${JSON.stringify(paramInfo)}`, error);
    }
    return null; // Return null if multiplier cannot be processed
}


/**
 * Generates the array of skill objects in the MYS format.
 * @param {object} hakushCharData - Character data object from Hakush (containing `Skill`).
 * @param {object} enkaSkillLevels - An object mapping Enka skill index (string) to level (number).
 * @param {string} char_id - Character ID for logging purposes.
 * @returns {Array<object>} Formatted skills array.
 */
export function processSkills(hakushCharData, enkaSkillLevels, char_id) {
    const skillsForModel = [];
    const hakushSkills = hakushCharData?.Skill;
    const skillOrder = [0, 1, 2, 3, 5, 6]; // Standard skill order

    if (!hakushSkills) {
        logger.warn(`[SkillProcessor] Missing Hakush skill data for char ID: ${char_id}`);
        // Optionally return a default "data missing" structure for all possible skills
        return [];
    }

    for (const enkaIndex of skillOrder) {
        const enkaIndexStr = String(enkaIndex);
        const currentLevel = enkaSkillLevels[enkaIndexStr];
        if (currentLevel === undefined) continue; // Skip if Enka doesn't provide a level

        const hakushSkillKey = ENKA_INDEX_TO_HAKUSH_SKILL_KEY[enkaIndex];
        const hakushSkillDetail = hakushSkills[hakushSkillKey];

        if (hakushSkillKey && hakushSkillDetail) {
            const skillItems = [];
            (hakushSkillDetail.Description || []).forEach(descItem => {
                let currentDescriptionText = descItem.Desc || '';
                const multipliers = [];
                let simpleParamsText = ''; // For simple Name: Desc params

                // Process multipliers and simple text params
                if (descItem.Param && Array.isArray(descItem.Param)) {
                    descItem.Param.forEach(paramInfo => {
                        const multiplier = processSkillMultiplier(paramInfo, currentLevel);
                        if (multiplier) {
                            multipliers.push(multiplier);
                            // Substitute placeholder in description if exists
                            if (paramInfo.Desc && currentDescriptionText.includes(paramInfo.Desc)) {
                                currentDescriptionText = currentDescriptionText.replace(paramInfo.Desc, `<color=#FED663>${multiplier.value}</color>`);
                            }
                        } else if (paramInfo.Desc && !paramInfo.Param && paramInfo.Name) {
                            // Handle simple text parameters (append if not already present)
                            if (!currentDescriptionText.includes(paramInfo.Name)) {
                                simpleParamsText += (simpleParamsText ? '\n' : '') + `${paramInfo.Name}: ${paramInfo.Desc}`;
                            }
                        }
                    });
                }

                // Clean description and combine parts
                const processedText = cleanDescriptionText(currentDescriptionText);
                const multiplierText = multipliers.map(m => `${m.name}: ${m.value}`).join('\n');
                let combinedText = processedText;
                if(simpleParamsText) combinedText += (combinedText ? '\n\n' : '') + simpleParamsText;
                if(multiplierText) combinedText += (combinedText ? '\n\n' : '') + multiplierText;


                // Add item if it has content
                if (descItem.Name || combinedText) {
                    skillItems.push({
                        title: descItem.Name || '',
                        text: combinedText
                    });
                }
            });

            // Fallback if parsing failed but description exists
            if (skillItems.length === 0 && hakushSkillDetail.Description?.length > 0) {
                const firstDesc = hakushSkillDetail.Description[0];
                skillItems.push({
                    title: firstDesc.Name || `技能 ${enkaIndex}`,
                    text: cleanDescriptionText(firstDesc.Desc || '')
                });
            }

            skillsForModel.push({
                level: currentLevel,
                skill_type: enkaIndex,
                items: skillItems.filter(item => item.title || item.text),
            });

        } else {
            // Handle missing Hakush skill data for this specific skill index
            logger.warn(`[SkillProcessor] Hakush skill data missing for Index ${enkaIndex} (Key: ${hakushSkillKey}) on char ${char_id}`);
            skillsForModel.push({
                level: currentLevel,
                skill_type: enkaIndex,
                items: [{ title: `未知技能 ${enkaIndex}`, text: '技能描述数据缺失' }]
            });
        }
    }

    // Already sorted by skillOrder loop
    // skillsForModel.sort((a, b) => a.skill_type - b.skill_type);
    return skillsForModel;
}
