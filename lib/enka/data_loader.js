// data_loader.js
/**
 * 负责加载和缓存项目所需的静态 JSON 数据文件。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = console; // 替换为你项目使用的 logger

// --- 数据文件路径配置 ---
// 假设你的项目结构是 .../src/lib/enka/data_loader.js
// 那么资源文件在 .../resources/
const RESOURCES_PATH = path.join(__dirname, '..', '..', 'resources'); // 根据实际结构调整
const HAKUSH_DATA_PATH = path.join(RESOURCES_PATH, 'hakush_data'); // 新的 Hakush 数据
const OLD_ENKA_DATA_PATH = path.join(RESOURCES_PATH, 'enka');    // 旧的 Enka 格式数据

// --- 文件名常量 ---
const HAKUSH_EQUIP_FILE = path.join(HAKUSH_DATA_PATH, 'equipment.json');
const HAKUSH_CHAR_DIR = path.join(HAKUSH_DATA_PATH, 'characters');
const HAKUSH_WEAPON_DIR = path.join(HAKUSH_DATA_PATH, 'weapons');
const OLD_AVATAR_ICON_FILE = path.join(OLD_ENKA_DATA_PATH, 'avatars.json'); // 用于旧图标路径
const DRIVE_LEVEL_TEMPLATE_FILE = path.join(OLD_ENKA_DATA_PATH, 'EquipmentLevelTemplateTb.json'); // 音擎等级数据
const DRIVE_SET_DATA_FILE = path.join(OLD_ENKA_DATA_PATH, 'EquipId2Data.json'); // 音擎套装数据

// --- 缓存 ---
const characterCache = new Map();
const weaponCache = new Map();
let hakushEquipmentDataCache = null;
let oldAvatarIconDataCache = null;
let driveLevelMapCache = null;
let driveSetDataCache = null;

/**
 * 通用 JSON 文件加载函数
 * @param {string} filePath 文件绝对路径
 * @param {boolean} ignoreError 是否忽略读取或解析错误 (返回 null)
 * @returns {object | null} 解析后的 JSON 对象或 null
 */
function loadJsonFile(filePath, ignoreError = false) {
    try {
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(rawData);
        } else {
            if (!ignoreError) {
                 logger.warn(`[DataLoader] File not found: ${filePath}`);
            }
            return null;
        }
    } catch (error) {
        if (!ignoreError) {
            logger.error(`[DataLoader] Error loading or parsing file ${filePath}:`, error);
        }
        return null;
    }
}

/**
 * 获取 Hakush 格式的装备（音擎套装）数据。
 * @returns {object} equipment.json 的内容
 */
export function getHakushEquipmentData() {
    if (hakushEquipmentDataCache === null) {
        hakushEquipmentDataCache = loadJsonFile(HAKUSH_EQUIP_FILE) || {};
        if (Object.keys(hakushEquipmentDataCache).length > 0) {
            logger.info('[DataLoader] Loaded Hakush equipment data.');
        }
    }
    return hakushEquipmentDataCache;
}

/**
 * 获取指定 ID 的 Hakush 格式角色详细数据 (带缓存)。
 * @param {string | number} id 角色 ID
 * @returns {object | null} 角色数据或 null
 */
export function getHakushCharacterData(id) {
    const charId = String(id);
    if (characterCache.has(charId)) {
        return characterCache.get(charId);
    }
    const filePath = path.join(HAKUSH_CHAR_DIR, `${charId}.json`);
    const data = loadJsonFile(filePath);
    if (data) {
        characterCache.set(charId, data);
    }
    return data;
}

/**
 * 获取指定 ID 的 Hakush 格式武器详细数据 (带缓存)。
 * @param {string | number} id 武器 ID
 * @returns {object | null} 武器数据或 null
 */
export function getHakushWeaponData(id) {
    const weaponId = String(id);
    if (weaponCache.has(weaponId)) {
        return weaponCache.get(weaponId);
    }
    const filePath = path.join(HAKUSH_WEAPON_DIR, `${weaponId}.json`);
    const data = loadJsonFile(filePath);
    if (data) {
        weaponCache.set(weaponId, data);
    }
    return data;
}

/**
 * 获取旧格式的 avatars.json 数据 (主要用于图标)。
 * @returns {object} avatars.json 的内容
 */
export function getOldAvatarIconData() {
    if (oldAvatarIconDataCache === null) {
        oldAvatarIconDataCache = loadJsonFile(OLD_AVATAR_ICON_FILE) || {};
        if (Object.keys(oldAvatarIconDataCache).length > 0) {
            logger.info('[DataLoader] Loaded old avatar icon data.');
        }
    }
    return oldAvatarIconDataCache;
}

/**
 * 获取并处理音擎等级模板数据，生成 Map 方便查找。
 * @returns {object} 处理后的音擎等级数据 Map { rarity: { level: entry } }
 */
export function getDriveLevelMap() {
    if (driveLevelMapCache === null) {
        const rawData = loadJsonFile(DRIVE_LEVEL_TEMPLATE_FILE);
        const tempMap = {};
        if (rawData?.GHFLHABGNDH) { // 注意这里的 key 可能需要根据你的实际文件确认
            rawData.GHFLHABGNDH.forEach(entry => {
                // GPEHNHPCIDC: Rarity (e.g., 4 for A, 5 for S? Needs confirmation)
                // CPEGDKBNGDH: Level
                const rarity = entry.GPEHNHPCIDC; // 获取稀有度 Key
                const level = entry.CPEGDKBNGDH;  // 获取等级 Key
                if (rarity === undefined || level === undefined) {
                    logger.warn('[DataLoader] Invalid entry in EquipmentLevelTemplateTb.json:', entry);
                    return;
                }
                if (!tempMap[rarity]) {
                    tempMap[rarity] = {};
                }
                tempMap[rarity][level] = entry; // 存储整个条目
            });
            logger.info('[DataLoader] Processed drive level template data.');
        } else {
            logger.error("[DataLoader] EquipmentLevelTemplateTb.json structure error or file not found.");
        }
        driveLevelMapCache = tempMap;
    }
    return driveLevelMapCache;
}

/**
 * 获取旧格式的音擎套装数据 (EquipId2Data.json)。
 * @returns {object | null}
 */
export function getDriveSetData() {
    if (driveSetDataCache === null) {
        driveSetDataCache = loadJsonFile(DRIVE_SET_DATA_FILE) || {};
         if (Object.keys(driveSetDataCache).length > 0) {
             logger.info('[DataLoader] Loaded drive set data (EquipId2Data).');
         }
    }
    return driveSetDataCache;
}

// 清理缓存 (如果需要)
export function clearCache() {
    characterCache.clear();
    weaponCache.clear();
    hakushEquipmentDataCache = null;
    oldAvatarIconDataCache = null;
    driveLevelMapCache = null;
    driveSetDataCache = null;
    logger.info('[DataLoader] All caches cleared.');
}
