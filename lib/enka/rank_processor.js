// rank_processor.js
/**
 * Processes raw rank/talent data (from Hakush) and unlocked level (from Enka)
 * to generate the formatted ranks list for the MYS data structure.
 */

const logger = console;

/**
 * Cleans rank description text by removing common formatting tags.
 * @param {string} text - The raw description text.
 * @returns {string} Cleaned text.
 */
function cleanDescriptionText(text) {
    if (!text) return '';
    // Similar cleaning as skills, might need adjustments based on rank specific tags
    return text
        .replace(/<color=#[0-9A-Fa-f]+>/gi, '')
        .replace(/<\/color>/gi, '')
        .replace(/<IconMap:[^>]+>/g, '')
        .trim();
}

/**
 * Generates the array of rank objects in the MYS format.
 * @param {object} hakushCharData - Character data object from Hakush (containing `Talent`).
 * @param {number} enkaRankLevel - The unlocked rank level (0-6) from Enka data.
 * @returns {Array<object>} Formatted ranks array.
 */
export function processRanks(hakushCharData, enkaRankLevel) {
    const ranksForModel = [];
    const hakushTalents = hakushCharData?.Talent || {};
    const maxRank = 6; // Assuming max rank is 6

    for (let i = 1; i <= maxRank; i++) {
        const rankKey = String(i); // Hakush uses '1' to '6'
        const rankInfo = hakushTalents[rankKey];

        if (rankInfo) {
            // Use Desc or Desc2 if Desc is empty, then clean
            const description = rankInfo.Desc || rankInfo.Desc2 || '';
            const cleanedDesc = cleanDescriptionText(description);

            ranksForModel.push({
                id: i,
                name: rankInfo.Name || `影位 ${i}`, // Fallback name
                desc: cleanedDesc,
                pos: i, // Position usually matches rank number
                is_unlocked: i <= enkaRankLevel // Determine unlock status
            });
        } else {
            // Fallback if Hakush data is missing for this rank
            ranksForModel.push({
                id: i,
                name: `影位 ${i}`,
                desc: '影位数据缺失', // Indicate missing data
                pos: i,
                is_unlocked: i <= enkaRankLevel
            });
        }
    }
    return ranksForModel;
}
