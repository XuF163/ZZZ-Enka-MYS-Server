// drive_calculator.js
/**
 * 负责计算音擎（驱动盘/圣遗物）单个词条的数值。
 * 注意：这里的计算逻辑是为了复现 enka_to_mys.js 中用于 *展示* 装备面板的计算方式，
 * 可能与 property_calculator.js 中用于计算最终角色面板的逻辑不同。
 */
import { MAIN_PROP_BASE_INCREASE } from './constants.js'; // 假设常量已移到 constants.js

const logger = console; // 替换为你项目使用的 logger

/**
 * 计算音擎主词条的数值 (基于 enka_to_mys.js 的逻辑)。
 * @param {object} mainProp - Enka 数据中的主词条对象, 包含 { PropertyId, PropertyValue }
 * @param {number} relicLevel - 音擎等级 (例如 0-15)
 * @returns {number} 计算出的主词条原始数值 (整数)
 */
export function calculateDriveMainStatValueForDisplay(mainProp, relicLevel) {
    if (!mainProp || mainProp.PropertyId === undefined || mainProp.PropertyValue === undefined) {
        logger.warn('[DriveCalculator] Invalid mainProp input for calculation:', mainProp);
        return 0;
    }

    const propIdStr = String(mainProp.PropertyId);
    const baseValue = Number(mainProp.PropertyValue) || 0;
    const relicTier = Math.floor(relicLevel / 3); // 每3级一个档位

    // 从常量中获取每档位的基础增长值
    const increasePerTier = MAIN_PROP_BASE_INCREASE[propIdStr] ?? 0;

    if (increasePerTier === 0 && propIdStr !== '12202') { // 12202 (冲击力百分比) 可能没有增长值
        logger.warn(`[DriveCalculator] MAIN_PROP_BASE_INCREASE not found or is 0 for main prop ID: ${propIdStr}`);
    }

    // 计算总值：基础值 + 每档增量 * 档位数
    const totalValueRaw = baseValue + (increasePerTier * relicTier);

    // logger.debug(`[DriveCalculator] Main Stat ${propIdStr}: Lvl=${relicLevel}(T${relicTier}), Base=${baseValue}, Inc=${increasePerTier} -> RawVal=${totalValueRaw}`);

    // 返回原始数值，格式化由调用方处理
    return Math.floor(totalValueRaw);
}

/**
 * 计算音擎副词条的数值 (基于 enka_to_mys.js 的逻辑)。
 * Enka 格式似乎直接在 PropertyValue 中提供了词条的"每跳数值"，
 * 并通过 PropertyLevel 提供了"跳数"。
 * @param {object} subProp - Enka 数据中的副词条对象, 包含 { PropertyId, PropertyValue, PropertyLevel }
 * @returns {number} 计算出的副词条原始数值 (整数)
 */
export function calculateDriveSubStatValueForDisplay(subProp) {
    if (!subProp || subProp.PropertyId === undefined || subProp.PropertyValue === undefined) {
        logger.warn('[DriveCalculator] Invalid subProp input for calculation:', subProp);
        return 0;
    }

    // PropertyLevel 代表强化次数/等级/跳数
    const propLevel = Number(subProp.PropertyLevel) || 1; // 至少为 1 级
    // PropertyValue 代表每次强化/每级增加的基础值
    const baseValuePerRoll = Number(subProp.PropertyValue) || 0;

    // 总数值 = 每次强化值 * 强化次数
    const totalSubstatValueRaw = baseValuePerRoll * propLevel;

    // logger.debug(`[DriveCalculator] Sub Stat ${subProp.PropertyId}: Val/Roll=${baseValuePerRoll}, Rolls=${propLevel} -> RawVal=${totalSubstatValueRaw}`);

    // 返回原始数值，格式化由调用方处理
    // 注意：Enka 的 PropertyValue 可能已经是最终处理过的数值，但按 enka_to_mys.js 逻辑是这样计算
    // 需要根据实际 Enka 数据确认 PropertyValue 的确切含义
    return Math.floor(totalSubstatValueRaw);
}
