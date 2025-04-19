// constants.js
/**
 * 存储项目中使用的常量、映射关系和列表。
 */

// --- 基础 URL ---

/** 基础域名 (例如用于拼接图片 URL) */
export const BASE_URL = 'enka.network';

/** 基础图片 URL */
export const BASE_IMAGE_URL = `https://${BASE_URL}`;

// --- 属性 ID 与名称映射 ---

/**
 * 映射内部属性 ID (来自 Enka/Hakush?) 到中文显示名称。
 * 注意：同一个中文名可能对应多个 ID (例如基础值、固定值、百分比)。
 */
export const ID_TO_PROP_NAME = {
    '11101': '生命值',       // 基础生命值 (通常角色/武器主属性)
    '11103': '生命值',       // 固定生命值 (通常圣遗物主/副属性)
    '11102': '生命值百分比', // 生命值百分比
    '12101': '攻击力',       // 基础攻击力
    '12103': '攻击力',       // 固定攻击力
    '12102': '攻击力百分比', // 攻击力百分比
    '13101': '防御力',       // 基础防御力
    '13103': '防御力',       // 固定防御力
    '13102': '防御力百分比', // 防御力百分比
    '12203': '冲击力',       // 固定冲击力
    '12201': '冲击力',       // 基础冲击力 (角色自带)
    '12202': '冲击力百分比', // 冲击力百分比 (稀有)
    '20103': '暴击率',       // 暴击率 (通常圣遗物主/副属性)
    '20101': '暴击率',       // 基础暴击率 (角色自带)
    '21103': '暴击伤害',     // 暴击伤害 (通常圣遗物主/副属性)
    '21101': '暴击伤害',     // 基础暴击伤害 (角色自带)
    '31403': '异常掌控',     // 固定异常掌控
    '31401': '异常掌控',     // 基础异常掌控
    '31402': '异常掌控百分比',// 异常掌控百分比 (稀有) - 注意：原映射都指向"异常掌控", 这里区分开
    '31203': '异常精通',     // 固定异常精通
    '31201': '异常精通',     // 基础异常精通
    // '31202': '异常精通百分比' (ID 31202 在原映射中指向"异常精通", 但通常没有百分比精通, 保持原样或修正需确认)
    '31202': '异常精通',
    '23103': '穿透率',       // 穿透率
    '23101': '穿透率',       // 基础穿透率
    '23203': '穿透值',       // 穿透值
    '23201': '穿透值',       // 基础穿透值
    '30503': '能量自动回复', // 固定能量回复 (通常圣遗物主/副属性) - 单位可能是点数/秒?
    '30501': '能量自动回复', // 基础能量回复 (角色自带)
    '30502': '能量回复效率', // 能量回复效率百分比 - 注意：原映射为"能量回复百分比", 改为更标准的"效率"
    '31503': '物理伤害加成',
    '31603': '火属性伤害加成',
    '31703': '冰属性伤害加成',
    '31803': '雷属性伤害加成',
    '31903': '以太属性伤害加成',
    // 注意: 伤害加成类没有 ID 结尾为 1 的基础值定义
};

/**
 * 映射中文显示名称到一个主要的内部属性 ID。
 * 用于需要从名称反查 ID 的场景。
 * 选择逻辑：优先选择以 '3' (固定值) 或 '2' (百分比) 结尾的 ID，
 * 如果没有，则选择遇到的第一个（通常是基础值 ID）。
 * 这个映射可能不完美，取决于具体使用场景。
 */
export const PROP_NAME_TO_ID = {};
for (const id in ID_TO_PROP_NAME) {
    const name = ID_TO_PROP_NAME[id];
    if (!PROP_NAME_TO_ID[name] || id.endsWith('3') || id.endsWith('2')) {
        PROP_NAME_TO_ID[name] = id;
    }
}

/**
 * 映射内部属性 ID 到英文/内部变量名 (用于 PropertyCalculator 或其他计算逻辑)。
 */
export const ID_TO_EN = {
     '30501': 'ENERGY_REGEN_RATE_BASE', // 速率基础值
     '30503': 'ENERGY_REGEN_RATE',      // 速率固定值
     '30502': 'ENERGY_REGEN_EFF',       // 效率百分比
    '11101': 'HP_BASE', // 基础生命 (角色+武器) - 注意: 与原定义不同，明确区分
    '11103': 'HP_FLAT', // 固定生命
    '11102': 'HP%',     // 生命百分比
    '12101': 'ATK_BASE',// 基础攻击 (角色+武器)
    '12103': 'ATK_FLAT',// 固定攻击
    '12102': 'ATK%',    // 攻击百分比
    '13101': 'DEF_BASE',// 基础防御 (角色+武器)
    '13103': 'DEF_FLAT',// 固定防御
    '13102': 'DEF%',    // 防御百分比
    '12203': 'IMPACT',  // 固定冲击力 (圣遗物) - 调整命名与基础区分
    '12201': 'IMPACT_BASE', // 基础冲击力 (角色)
    '12202': 'IMPACT%', // 冲击力百分比
    '20103': 'CRIT_RATE', // 暴击率
    '20101': 'CRIT_RATE_BASE', // 基础暴击率 (角色)
    '21103': 'CRIT_DMG',  // 暴击伤害
    '21101': 'CRIT_DMG_BASE',  // 基础暴击伤害 (角色)
    '31403': 'ANOMALY_MASTERY', // 固定异常掌控
    '31401': 'ANOMALY_MASTERY_BASE', // 基础异常掌控
    '31402': 'ANOMALY_MASTERY%', // 异常掌控百分比
    '31203': 'ANOMALY_PROFICIENCY', // 固定异常精通
    '31201': 'ANOMALY_PROFICIENCY_BASE', // 基础异常精通
    // '31202': 'ElementMysteryPercent', // ID 31202 不常用，暂保持原样或移除
    '31202': 'ANOMALY_PROFICIENCY',
    '23103': 'PEN_RATIO', // 穿透率
    '23101': 'PEN_RATIO_BASE', // 基础穿透率
    '23203': 'PEN_VALUE', // 穿透值
    '23201': 'PEN_VALUE_BASE', // 基础穿透值

    '31503': 'PHYS_DMG', // 物理伤害加成
    '31603': 'FIRE_DMG', // 火属性伤害加成
    '31703': 'ICE_DMG',  // 冰属性伤害加成
    '31803': 'ELEC_DMG', // 雷属性伤害加成
    '31903': 'ETHER_DMG',// 以太伤害加成
};

/**
 * 需要进行百分比格式化显示的属性 ID 列表。
 */
const derivedPercentIds = Object.keys(ID_TO_PROP_NAME)
    .filter(id =>
        ID_TO_PROP_NAME[id]?.includes('百分比') ||
        ID_TO_PROP_NAME[id]?.includes('加成') ||
        ID_TO_PROP_NAME[id]?.includes('暴击') || // 暴击率、暴击伤害
        ID_TO_PROP_NAME[id]?.includes('穿透率') ||
        ID_TO_PROP_NAME[id]?.includes('能量回复效率') // 使用更新后的名称
        // ID 30503 (能量自动回复) 通常是数值，不是百分比
        // ID 30501 (基础能量自动回复) 通常是数值，不是百分比
    );
// 手动确保基础百分比ID包含在内 (基于原 name_convert.txt 逻辑)
if (!derivedPercentIds.includes('11102')) derivedPercentIds.push('11102');
if (!derivedPercentIds.includes('12102')) derivedPercentIds.push('12102');
if (!derivedPercentIds.includes('13102')) derivedPercentIds.push('13102');
if (!derivedPercentIds.includes('12202')) derivedPercentIds.push('12202'); // 冲击力百分比
if (!derivedPercentIds.includes('31402')) derivedPercentIds.push('31402'); // 异常掌控百分比
// 确认 ID 30502 是否是百分比 - 是的，能量回复效率
if (!derivedPercentIds.includes('30502')) derivedPercentIds.push('30502');

export const PERCENT_ID_LIST = [...new Set(derivedPercentIds)]; // 去重确保唯一

// --- 音擎 (圣遗物) 相关常量 ---

/**
 * 音擎主词条每档（3级）的基础数值增长量。
 * 用于在 enka_to_mys.js 中估算并显示音擎面板上的主词条数值。
 * 注意：这个值可能不是绝对精确的，仅用于展示。
 * 键是属性 ID，值是增加的原始数值 (乘以 100 或 10000 的整数)。
 */
export const MAIN_PROP_BASE_INCREASE = {
    // 固定值
    '11103': 330,  // 生命值
    '12103': 47.4, // 攻击力 - 注意：这个值很奇怪，通常攻击力是整数，这里可能是原始数据或计算错误，暂时保留
    '13103': 27.6, // 防御力 - 同上，数值奇怪
    '12203': 270,  // 冲击力
    '31203': 13,   // 异常精通
    '31403': 450,  // 异常掌控 - 单位?
    '23203': 36,   // 穿透值

    // 百分比值 (内部值，需除以 100 或 10000 得到百分比)
    '11102': 450,  // 生命值百分比 (4.50%)
    '12102': 450,  // 攻击力百分比 (4.50%)
    '13102': 720,  // 防御力百分比 (7.20%)
    '20103': 360,  // 暴击率 (3.60%)
    '21103': 720,  // 暴击伤害 (7.20%)
    '23103': 360,  // 穿透率 (3.60%)
    '30502': 900,  // 能量回复效率 (9.00%)
    '31503': 450,  // 物理伤害加成 (4.50%)
    '31603': 450,  // 火属性伤害加成 (4.50%)
    '31703': 450,  // 冰属性伤害加成 (4.50%)
    '31803': 450,  // 雷属性伤害加成 (4.50%)
    '31903': 450,  // 以太伤害加成 (4.50%)

    // 特殊/其他
    '30503': 900,  // 能量自动回复 (固定值) - 单位?

    // 基础值 ID 不应出现在这里，因为它们不由圣遗物等级增长
    // '11101': 330, '12101': 47.4, '13101': 27.6, etc. - 移除
};

// --- Hakush 数据相关映射 ---

/** 映射 Hakush 元素类型 ID 到中文名 */
export const HAKUSH_ELEMENT_MAP = { '203': '电', '205': '以太', '202': '冰', '200': '物理', '201': '火' };

/** 映射 Hakush 职业类型 ID 到中文名 */
export const HAKUSH_PROFESSION_MAP = { '2': '击破', '3': '强攻', '1': '强攻', '5': '异常', '4': '支援', '6': '防御' };
// 注意: ID 1 和 3 都映射到 '强攻', 这是基于原代码, 需确认是否正确

/** 映射 Hakush 数字稀有度到字母等级 (A/S) */
export const HAKUSH_RARITY_MAP = { 3: 'A', 4: 'S' }; // S级 应该是 5星? 这个映射可能需要调整

// --- Enka/Hakush 技能映射 ---

/** 映射 Enka SkillLevelList 中的 Index 到 Hakush 角色数据中的技能 Key */
export const ENKA_INDEX_TO_HAKUSH_SKILL_KEY = {
    0: 'Basic',    // 普通攻击
    1: 'Special',  // 特殊技
    2: 'Dodge',    // 闪避/冲刺攻击/闪避反击
    3: 'Chain',    // 连携技/终结技
    5: 'Ultimate', // 核心被动 (原代码映射到 Ultimate, 但内容是核心被动) - **这个映射需要确认**
    6: 'Assist'    // 支援技
};

// --- 米游社 API 相关常量 ---

/**
 * 映射中文统计名称到米游社 API (MYS) 使用的 property_id。
 * 用于最终输出符合米游社格式的面板数据。
 */
export const MYSAPI_PROP_ID = {
    '生命值': 1,
    '攻击力': 2,
    '防御力': 3,
    '冲击力': 4,
    '暴击率': 5,
    '暴击伤害': 6,
    '异常掌控': 7,
    '异常精通': 8,
    '穿透率': 9,
    // '能量自动回复': 11, // MYS API 11 通常是 能量回复效率
    '能量回复效率': 11,
    '穿透值': 232,
    '物理伤害加成': 315,
    '火属性伤害加成': 316,
    '冰属性伤害加成': 317,
    '雷属性伤害加成': 318,
    '以太属性伤害加成': 319,
};
/**
 * 映射内部属性 ID 到英文/内部变量名 (用于 PropertyCalculator 或其他计算逻辑)。
 */
// export const ID_TO_EN = {
//     '11101': 'HP_BASE', '11103': 'HP_FLAT', '11102': 'HP%',
//     '12101': 'ATK_BASE', '12103': 'ATK_FLAT', '12102': 'ATK%',
//     '13101': 'DEF_BASE', '13103': 'DEF_FLAT', '13102': 'DEF%',
//     '12201': 'IMPACT_BASE', '12203': 'IMPACT', '12202': 'IMPACT%', // Changed order for clarity
//     '20101': 'CRIT_RATE_BASE', '20103': 'CRIT_RATE',
//     '21101': 'CRIT_DMG_BASE', '21103': 'CRIT_DMG',
//     '31401': 'ANOMALY_MASTERY_BASE', '31403': 'ANOMALY_MASTERY', '31402': 'ANOMALY_MASTERY%',
//     '31201': 'ANOMALY_PROFICIENCY_BASE', '31203': 'ANOMALY_PROFICIENCY', '31202': 'ANOMALY_PROFICIENCY', // ID 31202 remains ambiguous
//     '23101': 'PEN_RATIO_BASE', '23103': 'PEN_RATIO',
//     '23201': 'PEN_VALUE_BASE', '23203': 'PEN_VALUE',
//     '30501': 'ENERGY_REGEN_BASE', '30503': 'ENERGY_REGEN', '30502': 'ENERGY_REGEN%',
//     '31501': 'PHYS_DMG_BASE', '31503': 'PHYS_DMG',
//     '31601': 'FIRE_DMG_BASE', '31603': 'FIRE_DMG',
//     '31701': 'ICE_DMG_BASE', '31703': 'ICE_DMG',
//     '31801': 'ELEC_DMG_BASE', '31803': 'ELEC_DMG',
//     '31901': 'ETHER_DMG_BASE', '31903': 'ETHER_DMG',
// };

// --- 新增: 属性 ID 配置信息 ---
/**
 * 提供每个属性 ID 的详细配置，包括英文名和计算类型。
 * 类型说明:
 *   - base: 基础属性 (角色/武器提供，作为百分比计算的基础)
 *   - flat: 固定值加成 (主要来自装备词条)
 *   - percent: 百分比加成 (主要来自装备词条)
 *   - special_percent: 特殊百分比类 (暴击、爆伤、穿透率、元素伤、能效等，通常直接累加内部值)
 *   - other_flat: 其他固定值 (冲击力、异常精通/掌控、穿透值、固定能量回复等)
 */
export const PROP_ID_CONFIG = {
    // HP
    '11101': { en: 'HP_BASE', type: 'base' },
    '11103': { en: 'HP_FLAT', type: 'flat' },
    '11102': { en: 'HP%', type: 'percent' },
    // ATK
    '12101': { en: 'ATK_BASE', type: 'base' },
    '12103': { en: 'ATK_FLAT', type: 'flat' },
    '12102': { en: 'ATK%', type: 'percent' },
    // DEF
    '13101': { en: 'DEF_BASE', type: 'base' },
    '13103': { en: 'DEF_FLAT', type: 'flat' },
    '13102': { en: 'DEF%', type: 'percent' },
    // Impact
    '12201': { en: 'IMPACT_BASE', type: 'other_flat' }, // Base impact treated as other_flat
    '12203': { en: 'IMPACT', type: 'other_flat' },
    '12202': { en: 'IMPACT%', type: 'percent' },
    // Crit
    '20101': { en: 'CRIT_RATE_BASE', type: 'special_percent' }, // Base crit also adds directly
    '20103': { en: 'CRIT_RATE', type: 'special_percent' },
    '21101': { en: 'CRIT_DMG_BASE', type: 'special_percent' }, // Base crit dmg also adds directly
    '21103': { en: 'CRIT_DMG', type: 'special_percent' },
    // Anomaly Mastery
    '31401': { en: 'ANOMALY_MASTERY_BASE', type: 'other_flat' },
    '31403': { en: 'ANOMALY_MASTERY', type: 'other_flat' },
    '31402': { en: 'ANOMALY_MASTERY%', type: 'percent' },
    // Anomaly Proficiency
    '31201': { en: 'ANOMALY_PROFICIENCY_BASE', type: 'other_flat' },
    '31203': { en: 'ANOMALY_PROFICIENCY', type: 'other_flat' },
    '31202': { en: 'ANOMALY_PROFICIENCY', type: 'other_flat' }, // Still ambiguous, treat as flat
    // Penetration
    '23101': { en: 'PEN_RATIO_BASE', type: 'special_percent' },
    '23103': { en: 'PEN_RATIO', type: 'special_percent' },
    '23201': { en: 'PEN_VALUE_BASE', type: 'other_flat' },
    '23203': { en: 'PEN_VALUE', type: 'other_flat' },
    // Energy Regen
    '30501': { en: 'ENERGY_REGEN_RATE_BASE', type: 'other_flat' }, // 改为 other_flat, EN 名区分
    '30503': { en: 'ENERGY_REGEN_RATE', type: 'other_flat' },      // 改为 other_flat, EN 名区分
    '30502': { en: 'ENERGY_REGEN_EFF', type: 'percent' },        // 效率是百分比, EN 名区分
    // Elemental Damage Bonuses
    '31501': { en: 'PHYS_DMG_BASE', type: 'special_percent'}, // Base Damage % (if any from char?)
    '31503': { en: 'PHYS_DMG', type: 'special_percent' },
    '31601': { en: 'FIRE_DMG_BASE', type: 'special_percent'},
    '31603': { en: 'FIRE_DMG', type: 'special_percent' },
    '31701': { en: 'ICE_DMG_BASE', type: 'special_percent'},
    '31703': { en: 'ICE_DMG', type: 'special_percent' },
    '31801': { en: 'ELEC_DMG_BASE', type: 'special_percent'},
    '31803': { en: 'ELEC_DMG', type: 'special_percent' },
    '31901': { en: 'ETHER_DMG_BASE', type: 'special_percent'},
    '31903': { en: 'ETHER_DMG', type: 'special_percent' },
};

// Helper to get config, ensures defaults
export function getPropConfig(id) {
    return PROP_ID_CONFIG[id] || { en: `UNKNOWN_${id}`, type: 'unknown' };
}



