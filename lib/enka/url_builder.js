// url_builder.js
/**
 * 负责构建游戏中各种资源的 URL，例如角色图标、武器图标、装备图标等。
 */
import { BASE_IMAGE_URL } from './constants.js'; // 从常量模块导入基础 URL
import { getOldAvatarIconData } from './data_loader.js'; // 从数据加载模块导入旧图标数据获取函数

const logger = console; // 替换为你项目使用的 logger

/**
 * 默认的角色圆形图标 URL (备用)。
 */
export const DEFAULT_CIRCLE_ICON_URL = ''; // 或者提供一个默认占位图 URL

/**
 * 默认的角色方形/基础图标 URL (备用)。
 */
export const DEFAULT_BASE_ICON_URL = ''; // 或者提供一个默认占位图 URL

/**
 * 默认的武器图标 URL (备用)。
 */
export const DEFAULT_WEAPON_ICON_URL = ''; // 或者提供一个默认占位图 URL

/**
 * 默认的音擎（驱动盘）图标 URL (备用)。
 */
export const DEFAULT_DRIVE_ICON_URL = ''; // 或者提供一个默认占位图 URL


/**
 * 根据 Hakush 数据中提供的相对路径构建资源的完整图标 URL。
 * 主要用于武器、音擎套装图标等。
 * @param {string | null | undefined} relativePath - Hakush 数据中的图标相对路径 (通常以 'UI/' 开头)。
 * @returns {string} 完整的图标 URL，如果路径无效则返回空字符串或默认备用 URL。
 */
export function constructIconUrlFromHakushPath(relativePath) {
    // 检查路径是否有效且以 'UI/' 开头
    if (!relativePath || typeof relativePath !== 'string' || !relativePath.startsWith('UI/')) {
        logger.warn(`[UrlBuilder] Invalid Hakush relative path provided: ${relativePath}`);
        return ''; // 或者返回一个默认图标 URL
    }

    // 移除开头的 'UI/' 并清理 '/UnPacker/' (如果存在)
    const pathSuffix = relativePath.substring(3); // 从第4个字符开始取
    const finalPath = pathSuffix.replace('/UnPacker', ''); // 移除 UnPacker

    // 拼接基础 URL 和处理后的路径
    return `${BASE_IMAGE_URL}/ui${finalPath}`;
}

/**
 * [旧逻辑兼容] 根据旧的 avatars.json 数据获取角色圆形图标 URL。
 * @param {string | number} char_id - 角色 ID。
 * @returns {string} 完整的圆形图标 URL，如果找不到则返回 DEFAULT_CIRCLE_ICON_URL。
 */
export function getCharCircleIconUrlFromOldAvatars(char_id) {
    const charIdStr = String(char_id);
    const avatarIconData = getOldAvatarIconData(); // 获取旧数据

    // 字段名可能为 'CircleIcon' 或其他，根据你的 avatars.json 确认
    const iconPathField = 'CircleIcon';

    if (avatarIconData[charIdStr]?.[iconPathField] && typeof avatarIconData[charIdStr][iconPathField] === 'string') {
        const iconPath = avatarIconData[charIdStr][iconPathField];
        // 检查路径是否以 '/' 开头，如果是则直接拼接，否则也拼接（兼容可能存在的错误格式）
        if (iconPath.startsWith('/')) {
            return BASE_IMAGE_URL + iconPath;
        } else {
            // 如果路径不是以 / 开头，可能需要警告，但为了兼容性依然拼接
            logger.warn(`[UrlBuilder] Non-standard path format in old avatars.json for char ${charIdStr}, field ${iconPathField}: "${iconPath}". Assuming relative to root.`);
            return `${BASE_IMAGE_URL}/${iconPath}`; // 尝试拼接为根路径
        }
    } else {
        logger.debug(`[UrlBuilder] Circle icon path not found in old avatars.json for char ${charIdStr}. Returning default.`);
        return DEFAULT_CIRCLE_ICON_URL; // 返回默认备用 URL
    }
}

/**
 * [旧逻辑兼容] 根据旧的 avatars.json 数据获取角色方形/基础图标 URL。
 * @param {string | number} char_id - 角色 ID。
 * @returns {string} 完整的方形图标 URL，如果找不到则返回 DEFAULT_BASE_ICON_URL。
 */
export function getCharBaseIconUrlFromOldAvatars(char_id) {
    const charIdStr = String(char_id);
    const avatarIconData = getOldAvatarIconData(); // 获取旧数据

    // 字段名可能为 'Image', 'IconPath', 'SquareIcon' 等, 根据你的 avatars.json 确认
    const iconPathField = 'Image'; // 假设基础图标路径存储在 'Image' 字段

    if (avatarIconData[charIdStr]?.[iconPathField] && typeof avatarIconData[charIdStr][iconPathField] === 'string') {
        const iconPath = avatarIconData[charIdStr][iconPathField];
        // 检查路径是否以 '/' 开头
        if (iconPath.startsWith('/')) {
            return BASE_IMAGE_URL + iconPath;
        } else {
            logger.warn(`[UrlBuilder] Non-standard path format in old avatars.json for char ${charIdStr}, field ${iconPathField}: "${iconPath}". Assuming relative to root.`);
            return `${BASE_IMAGE_URL}/${iconPath}`;
        }
    } else {
        logger.debug(`[UrlBuilder] Base icon path not found in old avatars.json for char ${charIdStr}. Returning default.`);
        return DEFAULT_BASE_ICON_URL; // 返回默认备用 URL
    }
}

// 你可以根据需要添加更多特定类型的 URL 构建函数，例如：
// export function getWeaponIconUrl(weaponData) { ... }
// export function getDriveSetIconUrl(driveSetData) { ... }
// 这些函数内部可以调用 constructIconUrlFromHakushPath
