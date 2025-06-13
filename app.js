// app.js
import http from 'http';
import url from 'url';
import _ from 'lodash';
import DataGenerator from "./DataGenerator.js"; // 确认路径 './DataGenerator.js' 正确
const PORT = 63636; // 保持端口一致
const generator = new DataGenerator(); // 实例化 DataGenerator
import {logger} from './lib/log.js'

// --- Helper: 从请求体或URL中提取 UID ---
function extractUidFromRequest(requestData) {
    if (requestData?.apiUrl?.query) {
        try {
            const queryParams = new URLSearchParams(requestData.apiUrl.query);
            const roleIdQuery = queryParams.get('role_id'); // Enka API 请求中的 role_id 通常是 UID
            if (roleIdQuery && /^\d+$/.test(roleIdQuery)) {
                logger.mark(`[Mock Server] 正在为${roleIdQuery} 使用Enka更新面板数据`)
                logger.debug(`[Server] Extracted UID from apiUrl.query.role_id: ${roleIdQuery}`);
                return roleIdQuery;
            }
        } catch (e) {
            logger.warn('[Server] Failed to parse apiUrl.query for role_id (UID)');
        }
    }
    if (requestData?.cookie) {
        const cookieMatchLtuid = requestData.cookie.match(/ltuid=(\d+)/);
        if (cookieMatchLtuid && cookieMatchLtuid[1]) {
            logger.debug(`[Server] Extracted UID from cookie.ltuid: ${cookieMatchLtuid[1]}`);
            return cookieMatchLtuid[1];
        }
        const cookieMatchAccId = requestData.cookie.match(/account_id=(\d+)/);
        if (cookieMatchAccId && cookieMatchAccId[1]) {
            logger.debug(`[Server] Extracted UID from cookie.account_id: ${cookieMatchAccId[1]}`);
            return cookieMatchAccId[1];
        }
    }
    logger.warn('[Server] Could not extract UID from request.');
    return null;
}

// --- Helper: 从请求中提取请求的 *目标* 角色ID ---
function extractTargetRoleId(requestData) {
    if (requestData?.apiUrl?.query) {
        try {
            const queryParams = new URLSearchParams(requestData.apiUrl.query);
            // 优先尝试 id_list[]
            const idListParam = queryParams.get('id_list[]'); // MYS 获取角色详情用这个参数
            if (idListParam && /^\d+$/.test(idListParam)) {
                logger.debug(`[Server] Extracted Target Role ID from id_list[]: ${idListParam}`);
                return idListParam;
            }
             // 备选：如果 URL 路径包含 /avatar/ID (虽然 MYS API 不这样用，但你的 handler 里可能用到了)
             if (requestData.apiUrl.url) {
                 const urlMatch = requestData.apiUrl.url.match(/\/avatar\/(\d+)/);
                 if (urlMatch && urlMatch[1]) {
                     logger.debug(`[Server] Extracted Target Role ID from URL path (fallback): ${urlMatch[1]}`);
                     return urlMatch[1];
                 }
             }
        } catch (e) {
            logger.warn('[Server] Failed to parse apiUrl.query for target role ID');
        }
    }
    logger.warn('[Server] Could not extract Target Role ID from request.');
    return null;
}


// --- 创建 HTTP 服务器 ---
const server = http.createServer(async (req, res) => { // 标记为 async
    const logPrefix = '[Mock Server]';
    logger.info(`${logPrefix} Received request: ${req.method} ${req.url}`);

    if (req.method === 'POST' && req.url === '/getData') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });

        // 使用 async 处理 end 事件回调
        req.on('end', async () => {
            logger.info(`${logPrefix} Received request body: ${body}`);
            let requestData;
            let uid = null;
            let apiType = null;
            let targetRoleId = null; // 请求详情的目标角色ID
            let statusCode = 200; // 默认成功状态码
            let responseToSend = null;

            try {
                requestData = JSON.parse(body);
                uid = extractUidFromRequest(requestData); // 提取查询主体（玩家）的 UID

                const originalApiUrl = requestData?.apiUrl?.url;
                if (originalApiUrl) {
                    const parsedUrl = url.parse(originalApiUrl);
                    const pathSegments = parsedUrl.pathname.split('/');
                    apiType = pathSegments.filter(Boolean).pop(); // 获取 API 类型 (basic, info 等)
                    logger.info(`${logPrefix} Detected API type: ${apiType}`);

                    if (apiType === 'info' || apiType === 'zzzAvatarInfo') {
                        targetRoleId = extractTargetRoleId(requestData); // 提取要查询详情的角色 ID
                        logger.info(`${logPrefix} Target Role ID for info request: ${targetRoleId}`);
                    }
                } else {
                    throw new Error("Cannot determine API type from request body's apiUrl");
                }

                if (!uid) throw new Error("Could not determine UID from request");
                if (!apiType) throw new Error("Could not determine API type from request");

                // --- 调用 DataGenerator 获取数据 ---
                const generatedData = await generator.getMysFormattedData(uid);

                // 检查生成器是否返回错误
                if (generatedData?.error) {
                    logger.error(`${logPrefix} Data generation failed for UID ${uid}: ${generatedData.error}`);
                    // 根据 Enka 返回的状态码或其他错误信息设置 statusCode
                    statusCode = generatedData.status || (generatedData.retcode === -4041 ? 404 : 500);
                    responseToSend = { retcode: generatedData.retcode || -500, message: generatedData.error };
                }
                // 再次检查返回的是否是数组 (成功时应返回数组)
                else if (!Array.isArray(generatedData)) {
                     logger.error(`${logPrefix} Data generator returned unexpected format for UID ${uid}`);
                     statusCode = 500;
                     responseToSend = { retcode: -500, message: 'Internal server error: Invalid data format from generator' };
                }
                // --- 数据生成成功，根据 API 类型构造响应 ---
                else {
                    if (apiType === 'basic' || apiType === 'zzzAvatarList') {
                        // 构造 zzzAvatarList 响应 (只包含基础信息)
                        responseToSend = {
                            retcode: 0,
                            message: "OK",
                            data: {
                                avatar_list: generatedData.map(char => ({
                                    id: char.id,
                                    level: char.level,
                                    name_mi18n: char.name_mi18n,
                                    full_name_mi18n: char.full_name_mi18n,
                                    element_type: char.element_type,
                                    camp_name_mi18n: char.camp_name_mi18n,
                                    avatar_profession: char.avatar_profession,
                                    rarity: char.rarity,
                                    group_icon_path: char.group_icon_path || '', // 使用 DataGenerator 提供的值或默认空
                                    hollow_icon_path: char.hollow_icon_path || '', // 同上
                                    rank: char.rank,
                                    is_chosen: char.is_chosen !== undefined ? char.is_chosen : false,
                                    role_square_url: char.role_square_url || '', // 同上
                                    sub_element_type: char.sub_element_type || 0
                                }))
                            },
                            api: "zzzAvatarList" // 可以加上 API 标识
                        };
                        logger.info(`${logPrefix} Responding with dynamically generated zzzAvatarList data for UID: ${uid}.`);

                    } else if (apiType === 'info' || apiType === 'zzzAvatarInfo') {
                        if (!targetRoleId) {
                            throw new Error("Target Role ID missing for info request");
                        }
                        // 在生成的 MYS 格式数据中查找对应的角色
                        const targetCharacter = generatedData.find(char => String(char.id) === String(targetRoleId));

                        if (!targetCharacter) {
                            logger.warn(`${logPrefix} Target Role ID ${targetRoleId} not found in generated data for UID ${uid}.`);
                            statusCode = 404; // Not Found
                            responseToSend = { retcode: -404, message: `Character with ID ${targetRoleId} not found in player (UID: ${uid}) data` };
                        } else {
                            // 构造 zzzAvatarInfo 响应 (包含完整信息)
                            responseToSend = {
                                retcode: 0,
                                message: "OK",
                                data: {
                                    avatar_list: [targetCharacter], // MYS 格式要求是列表，即使只有一个
                                    // 添加空的 wiki 对象，如果客户端需要
                                    equip_wiki: {},
                                    weapon_wiki: {},
                                    avatar_wiki: {},
                                    strategy_wiki: {},
                                    // cultivate_index 和 cultivate_equip 通常也需要，如果转换逻辑没生成就为空
                                    cultivate_index: targetCharacter.cultivate_index || {},
                                    cultivate_equip: targetCharacter.cultivate_equip || {},
                                },
                                api: "zzzAvatarInfo" // 可以加上 API 标识
                            };
                            logger.info(`${logPrefix} Responding with dynamically generated zzzAvatarInfo data for UID: ${uid}, Role ID: ${targetRoleId}.`);
                        }
                    } else {
                        logger.warn(`${logPrefix} Unknown or unhandled API type: ${apiType}. Returning default error.`);
                        statusCode = 404;
                        responseToSend = { retcode: -404, message: `Mock data not found for API type: ${apiType}` };
                    }
                }

            } catch (err) { // 捕获 JSON 解析、UID/类型提取、数据生成中的同步/异步错误
                logger.error(`${logPrefix} Error processing request:`, err);
                if (!res.headersSent) { // 确保只发送一次响应头
                   statusCode = (err.message.includes("UID") || err.message.includes("API type") || err.message.includes("Target Role ID")) ? 400 : 500;
                   responseToSend = { retcode: -1, message: err.message || 'Internal Server Error' };
                   res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                   res.end(JSON.stringify(responseToSend));
                }
                return; // 提前退出 end 回调
            }

            // --- 发送最终响应 ---
            if (!res.headersSent) {
                 logger.info(`[Mock Server] Preparing response for ID ${targetRoleId || uid} with status ${statusCode}:`, JSON.stringify(responseToSend, null, 2)); // 打印将发送的内容
                 res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                 res.end(JSON.stringify(responseToSend));
                 logger.info(`${logPrefix} Sent response with status ${statusCode}.`);
                 logger.mark(`${logPrefix} ${uid} 的面板数据更新完成`)
            }

        });
        req.on('error', (err) => {
            logger.error('[Mock Server] Request error:', err);
            if (!res.headersSent) {
                res.writeHead(500);
                res.end('Server error handling request');
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

// --- 启动服务器 ---
server.listen(PORT, () => {
    logger.mark(`[Mock Server] Running at http://localhost:${PORT}`);
    logger.mark('[Mock Server] Ready to provide dynamically generated game data via POST /getData');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`[Mock Server] Error: Port ${PORT} is already in use. Choose a different port.`);
    } else {
        logger.error('[Mock Server] Server error:', err);
    }
    process.exit(1);
});

// --- 不再需要写死的 Mock 数据 ---
// const mockZzzAvatarListResponse = ... (可以删除)
// const mockZzzAvatarInfoResponse_1031 = ... (可以删除)
//
// import http from 'http';
// import url from 'url'; // 用于解析 URL
// import _ from 'lodash';
// import DataGenerator from "./DataGenerate"; // 需要安装 lodash: npm install lodash
//
// const PORT = 63636; // 保持端口一致
// const generator = new DataGenerator();
// // --- 预设的成功响应数据 ---
//
// // zzzAvatarList 的成功响应 (来自你的日志)
// const mockZzzAvatarListResponse =
//     {
//   "retcode": 0,
//   "message": "OK",
//   "data": {
//     "avatar_list": [
//
//       {
//         "id": 1031,
//         "level": 1,
//         "name_mi18n": "妮可",
//         "full_name_mi18n": "妮可·德玛拉",
//         "element_type": 205,
//         "camp_name_mi18n": "狡兔屋",
//         "avatar_profession": 4,
//         "rarity": "A",
//         "group_icon_path": "https://act-webstatic.mihoyo.com/darkmatter/nap/prod_gf_cn/item_icon_u44f0b/de15a641e7205798bc8ae14aa083099b.png",
//         "hollow_icon_path": "https://act-webstatic.mihoyo.com/darkmatter/nap/prod_gf_cn/item_icon_u44f0b/af8a0787568bc5fcbb011b4a6c50eb4b.png",
//         "rank": 1,
//         "is_chosen": false,
//         "role_square_url": "https://act-webstatic.mihoyo.com/game_record/zzzv2/role_square_avatar/role_square_avatar_1031.png",
//         "sub_element_type": 0
//       }
//     ]
//   },
//   "api": "zzzAvatarList"
// }
//
// // zzzAvatarInfo 的成功响应 (以安比为例，确保 ranks 数组存在且完整)
// // 请从你的日志中复制一个完整的、成功的 zzzAvatarInfo 响应到这里
// const mockZzzAvatarInfoResponse_1031 = {
//   "retcode": 0,
//   "message": "OK",
//   "data": {
//     "avatar_list": [
//       {
//         "id": 1031,
//         "level": 1,
//         "name_mi18n": "妮可",
//         "full_name_mi18n": "妮可·德玛拉",
//         "element_type": 205,
//         "camp_name_mi18n": "狡兔屋",
//         "avatar_profession": 4,
//         "rarity": "A",
//         "group_icon_path": "https://act-webstatic.mihoyo.com/darkmatter/nap/prod_gf_cn/item_icon_u44f0b/de15a641e7205798bc8ae14aa083099b.png",
//         "hollow_icon_path": "https://act-webstatic.mihoyo.com/darkmatter/nap/prod_gf_cn/item_icon_u44f0b/af8a0787568bc5fcbb011b4a6c50eb4b.png",
//         "equip": [],
//         "weapon": null,
//         "properties": [
//           {
//             "property_name": "生命值",
//             "property_id": 1,
//             "base": "",
//             "add": "",
//             "final": "655"
//           },
//           {
//             "property_name": "攻击力",
//             "property_id": 2,
//             "base": "",
//             "add": "",
//             "final": "93"
//           },
//           {
//             "property_name": "防御力",
//             "property_id": 3,
//             "base": "",
//             "add": "",
//             "final": "50"
//           },
//           {
//             "property_name": "冲击力",
//             "property_id": 4,
//             "base": "",
//             "add": "",
//             "final": "88"
//           },
//           {
//             "property_name": "暴击率",
//             "property_id": 5,
//             "base": "",
//             "add": "",
//             "final": "5.0%"
//           },
//           {
//             "property_name": "暴击伤害",
//             "property_id": 6,
//             "base": "",
//             "add": "",
//             "final": "50.0%"
//           },
//           {
//             "property_name": "异常掌控",
//             "property_id": 7,
//             "base": "",
//             "add": "",
//             "final": "90"
//           },
//           {
//             "property_name": "异常精通",
//             "property_id": 8,
//             "base": "",
//             "add": "",
//             "final": "93"
//           },
//           {
//             "property_name": "穿透率",
//             "property_id": 9,
//             "base": "",
//             "add": "",
//             "final": "0.0%"
//           },
//           {
//             "property_name": "能量自动回复",
//             "property_id": 11,
//             "base": "",
//             "add": "",
//             "final": "1.20"
//           },
//           {
//             "property_name": "穿透值",
//             "property_id": 232,
//             "base": "",
//             "add": "",
//             "final": "0"
//           },
//           {
//             "property_name": "以太伤害加成",
//             "property_id": 319,
//             "base": "",
//             "add": "",
//             "final": "0.0%"
//           }
//         ],
//         "skills": [
//           {
//             "level": 1,
//             "skill_type": 0,
//             "items": [
//               {
//                 "title": "普通攻击：狡兔连打",
//                 "text": "点按 <IconMap:Icon_Normal> 发动：\\n向前方进行至多三段的打击，造成<color=#F0D12B>物理伤害</color>。"
//               },
//               {
//                 "title": "普通攻击：为所欲为",
//                 "text": "发动<color=#FFFFFF>[特殊技]</color>、<color=#FFFFFF>[强化特殊技]</color>、<color=#FFFFFF>[连携技]</color>、<color=#FFFFFF>[终结技]</color>等招式后，能够上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，提升子弹的威力。"
//               }
//             ]
//           },
//           {
//             "level": 1,
//             "skill_type": 1,
//             "items": [
//               {
//                 "title": "特殊技：糖衣炮弹",
//                 "text": "点按 <IconMap:Icon_Special> 发动：\\n对前方敌人发动远程打击，造成<color=#FE437E>以太伤害</color>；\\n招式发动期间抗打断等级提升；\\n招式发动后自动上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，最多触发8次。"
//               },
//               {
//                 "title": "强化特殊技：夹心糖衣炮弹",
//                 "text": "能量足够时，点按 <IconMap:Icon_SpecialReady> 发动：\\n对前方敌人发动强力远程打击，并在目标处生成能量场，持续牵引敌人，造成<color=#FE437E>以太伤害</color>；\\n长按 <IconMap:Icon_SpecialReady> 可以进行蓄力，在炮口生成小型能量场，持续消耗能量并对近处的敌人造成额外伤害；\\n招式发动期间拥有无敌效果；\\n招式命中敌人时，将触发<color=#FFFFFF>[快速支援]</color>；\\n招式发动后自动上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，最多触发8次。"
//               }
//             ]
//           },
//           {
//             "level": 1,
//             "skill_type": 2,
//             "items": [
//               {
//                 "title": "闪避：脱兔",
//                 "text": "点按 <IconMap:Icon_Evade> 发动：\\n快速的冲刺闪避；\\n招式发动期间拥有无敌效果；\\n拖曳{LAYOUT_CONSOLECONTROLLER#操作杆}{LAYOUT_FALLBACK#摇杆}发动闪避时，长按 <IconMap:Icon_Evade> ，可以在闪避中途上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，最多触发8次。"
//               },
//               {
//                 "title": "冲刺攻击：惊喜开箱",
//                 "text": "拖曳{LAYOUT_CONSOLECONTROLLER#操作杆}{LAYOUT_FALLBACK#摇杆}发动闪避后，点按 <IconMap:Icon_Normal> 发动：\\n向对应方向冲刺，并对身周敌人进行打击，造成<color=#F0D12B>物理伤害</color>；\\n未拖曳{LAYOUT_CONSOLECONTROLLER#操作杆}{LAYOUT_FALLBACK#摇杆}发动闪避后，点按 <IconMap:Icon_Normal> 发动：\\n向后躲避，并对前方敌人发动远程打击，造成<color=#F0D12B>物理伤害</color>；\\n招式发动后自动上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，最多触发8次。"
//               },
//               {
//                 "title": "闪避反击：牵制炮击",
//                 "text": "触发<color=#FFFFFF>[极限闪避]</color>后，点按 <IconMap:Icon_Normal> 发动：\\n向后闪避，并对前方敌人发动远程打击，造成<color=#FE437E>以太伤害</color>；\\n招式发动期间拥有无敌效果；\\n招式发动后自动上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，最多触发8次。"
//               }
//             ]
//           },
//           {
//             "level": 1,
//             "skill_type": 3,
//             "items": [
//               {
//                 "title": "连携技：高价以太爆弹",
//                 "text": "触发<color=#FFFFFF>[连携技]</color>时，选择对应角色发动：\\n对前方小范围敌人发动强力远程打击，并在目标处生成能量场，持续牵引周围敌人，造成<color=#FE437E>以太伤害</color>；\\n招式发动期间拥有无敌效果；\\n招式命中敌人时，将触发<color=#FFFFFF>[快速支援]</color>；\\n招式发动后自动上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，最多触发8次。"
//               },
//               {
//                 "title": "终结技：特制以太榴弹",
//                 "text": "喧响等级达到<color=#FFFFFF>[极]</color>时，点按 <IconMap:Icon_UltimateReady> 发动：\\n对前方小范围敌人发动强力远程打击，并在目标处生成能量场，持续牵引周围敌人，造成<color=#FE437E>以太伤害</color>；\\n招式发动时，队伍中其他角色回复10点能量，下一名换入前场的角色额外回复20点能量；\\n招式发动期间拥有无敌效果；\\n招式命中敌人时，将触发<color=#FFFFFF>[快速支援]</color>；\\n招式发动后自动上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，最多触发8次。"
//               }
//             ]
//           },
//           {
//             "level": 1,
//             "skill_type": 5,
//             "items": [
//               {
//                 "title": "核心被动：机关箱",
//                 "text": "妮可在<color=#FFFFFF>[特殊技]</color>、<color=#FFFFFF>[强化特殊技]</color>、<color=#FFFFFF>[连携技]</color>、<color=#FFFFFF>[终结技]</color>等招式中，上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>；强化子弹或能量场命中敌人时，目标的防御力降低<color=#2BAD00>20%</color>，持续3.5秒。"
//               },
//               {
//                 "title": "额外能力：狡兔三窟",
//                 "text": "队伍中存在与自身属性或阵营相同的角色时触发：\\n妮可通过<color=#FFFFFF>[核心被动：机关箱]</color>对敌人施加减益效果时，全队对目标造成的<color=#FE437E>以太伤害</color>额外提升25%，持续3.5秒。"
//               }
//             ]
//           },
//           {
//             "level": 1,
//             "skill_type": 6,
//             "items": [
//               {
//                 "title": "快速支援：救急炮击",
//                 "text": "当前操作中的角色被击飞时，点按 <IconMap:Icon_Switch> 发动：\\n向后闪避，并对前方敌人发动远程打击，造成<color=#FE437E>以太伤害</color>；\\n招式发动期间拥有无敌效果；\\n招式发动后自动上弹并强化<color=#FFFFFF>[普通攻击]</color>与<color=#FFFFFF>[冲刺攻击]</color>，最多触发8次。"
//               },
//               {
//                 "title": "招架支援：狡兔出手！",
//                 "text": "前场角色即将被攻击时，点按 <IconMap:Icon_Switch> 发动：\\n招架敌人的攻击，累积大量失衡值；\\n招式发动期间拥有无敌效果。"
//               },
//               {
//                 "title": "支援突击：趁虚而入",
//                 "text": "发动<color=#FFFFFF>[招架支援]</color>后，点按 <IconMap:Icon_Normal> 发动：\\n向前方突进后对敌人发动炮击，造成<color=#FE437E>以太伤害</color>；\\n招式发动期间拥有无敌效果。"
//               }
//             ]
//           }
//         ],
//         "rank": 1,
//         "ranks": [
//           {
//             "id": 1,
//             "name": "增压强化弹",
//             "desc": "<color=#FFFFFF>[强化特殊技]</color>造成的伤害和累积的属性异常积蓄值提升16%；\\n发动<color=#FFFFFF>[强化特殊技]</color>时，每多蓄力0.1秒，在目标处生成的能量场持续时间提升0.15秒。",
//             "pos": 1,
//             "is_unlocked": true
//           },
//           {
//             "id": 2,
//             "name": "聚能装置",
//             "desc": "触发<color=#FFFFFF>[核心被动：机关箱]</color>的减益效果时，妮可回复5点能量，15秒内最多触发一次。",
//             "pos": 2,
//             "is_unlocked": false
//           },
//           {
//             "id": 3,
//             "name": "狡兔智慧",
//             "desc": "<color=#FFFFFF>[普通攻击]</color>、<color=#FFFFFF>[闪避]</color>、<color=#FFFFFF>[支援技]</color>、<color=#FFFFFF>[特殊技]</color>、<color=#FFFFFF>[连携技]</color> 技能等级+2",
//             "pos": 3,
//             "is_unlocked": false
//           },
//           {
//             "id": 4,
//             "name": "领域扩增",
//             "desc": "妮可发动<color=#FFFFFF>[强化特殊技]</color>、<color=#FFFFFF>[连携技]</color>、<color=#FFFFFF>[终结技]</color>时，\\n在目标处生成的能量场攻击范围提升，直径增加3米。",
//             "pos": 4,
//             "is_unlocked": false
//           },
//           {
//             "id": 5,
//             "name": "业界红人",
//             "desc": "<color=#FFFFFF>[普通攻击]</color>、<color=#FFFFFF>[闪避]</color>、<color=#FFFFFF>[支援技]</color>、<color=#FFFFFF>[特殊技]</color>、<color=#FFFFFF>[连携技]</color> 技能等级+2",
//             "pos": 5,
//             "is_unlocked": false
//           },
//           {
//             "id": 6,
//             "name": "侵蚀能量场",
//             "desc": "能量场对敌人造成伤害时，全队对该目标的暴击率提升1.5%，\\n最多叠加10层，持续12秒，每层效果单独结算持续时间。",
//             "pos": 6,
//             "is_unlocked": false
//           }
//         ],
//         "role_vertical_painting_url": "https://act-webstatic.mihoyo.com/game_record/zzzv2/role_vertical_painting/role_vertical_painting_1031.png",
//         "equip_plan_info": null,
//         "us_full_name": "Nicole Demara",
//         "vertical_painting_color": "#e6adaa",
//         "sub_element_type": 0,
//         "skin_list": [
//           {
//             "skin_id": 3110311,
//             "skin_name": "妮可·狡黠甜心",
//             "skin_vertical_painting_url": "https://act-webstatic.mihoyo.com/game_record/zzzv2/role_vertical_painting/role_vertical_painting_1031_3110311.png",
//             "skin_square_url": "https://act-webstatic.mihoyo.com/game_record/zzzv2/role_square_avatar/role_square_avatar_1031_3110311.png",
//             "skin_hollow_icon_path": "https://act-webstatic.mihoyo.com/darkmatter/nap/prod_gf_cn/item_icon_u44f0b/7a6a306e97566bf77ec1a176787bacff.png",
//             "skin_vertical_painting_color": "#e6adaa",
//             "unlocked": false,
//             "rarity": "A",
//             "is_original": false
//           },
//           {
//             "skin_id": 3110310,
//             "skin_name": "妮可·一点点俏皮",
//             "skin_vertical_painting_url": "https://act-webstatic.mihoyo.com/game_record/zzzv2/role_vertical_painting/role_vertical_painting_1031.png",
//             "skin_square_url": "https://act-webstatic.mihoyo.com/game_record/zzzv2/role_square_avatar/role_square_avatar_1031.png",
//             "skin_hollow_icon_path": "https://act-webstatic.mihoyo.com/darkmatter/nap/prod_gf_cn/item_icon_u44f0b/af8a0787568bc5fcbb011b4a6c50eb4b.png",
//             "skin_vertical_painting_color": "#e6adaa",
//             "unlocked": true,
//             "rarity": "A",
//             "is_original": true
//           }
//         ],
//         "role_square_url": "https://act-webstatic.mihoyo.com/game_record/zzzv2/role_square_avatar/role_square_avatar_1031.png"
//       }
//     ],
//     "equip_wiki": {},
//     "weapon_wiki": {},
//     "avatar_wiki": {},
//     "strategy_wiki": {},
//     "cultivate_index": {
//       "1031": "https://act.mihoyo.com/zzz/event/character-builder/index.html?game_biz=nap_cn&mhy_auth_required=1&mhy_presentation_style=fullscreen&utm_source=bbs&utm_medium=zzz&utm_campaign=zj-char#/?avatar_id=1031"
//     },
//     "cultivate_equip": {
//       "1031": "https://act.mihoyo.com/zzz/event/character-builder/index.html?game_biz=nap_cn&mhy_auth_required=1&mhy_presentation_style=fullscreen&utm_source=bbs&utm_medium=zzz&utm_campaign=zj-drive#/?avatar_id=1031"
//     }
//   },
//   "api": "zzzAvatarInfo"
// }
//
// // 创建 HTTP 服务器
// const server = http.createServer((req, res) => {
//   const logPrefix = '[Mock Server]';
//   console.log(`${logPrefix} Received request: ${req.method} ${req.url}`);
//
//   if (req.method === 'POST' && req.url === '/getData') {
//     let body = '';
//     req.on('data', chunk => { body += chunk.toString(); });
//     req.on('end', () => {
//       console.log(`${logPrefix} Received request body: ${body}`);
//       let requestData;
//       let requestedRoleId = null; // 存储请求的角色 ID
//       let apiType = null; // 存储 API 类型
//
//       try {
//         requestData = JSON.parse(body);
//         // 解析 API 类型
//         const originalApiUrl = requestData?.apiUrl?.url;
//         if (originalApiUrl) {
//             const parsedUrl = url.parse(originalApiUrl);
//             const pathSegments = parsedUrl.pathname.split('/');
//             apiType = pathSegments.filter(Boolean).pop();
//             console.log(`${logPrefix} Detected API type from apiUrl.url: ${apiType}`);
//
//             // 如果是 info 类型，尝试解析 role_id
//             if (apiType === 'info' || apiType === 'zzzAvatarInfo') {
//                 if (requestData?.apiUrl?.query) {
//                     const queryParams = new URLSearchParams(requestData.apiUrl.query);
//                     requestedRoleId = queryParams.get('id_list[]');
//                 }
//                  if (!requestedRoleId) { // 备选解析方式
//                    const match = originalApiUrl.match(/role_id=(\d+)/) || originalApiUrl.match(/avatar\/(\d+)/);
//                    if (match && match[1]) {
//                        requestedRoleId = match[1];
//                    }
//                  }
//                  console.log(`${logPrefix} Requested Role ID for info type: ${requestedRoleId}`);
//             }
//         } else {
//             console.warn(`${logPrefix} Cannot determine API type from request body's apiUrl`);
//         }
//       } catch (e) {
//         console.error(`${logPrefix} Failed to parse request body or URL:`, e);
//         res.writeHead(400, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ retcode: -1, message: 'Invalid JSON body or apiUrl' }));
//         return;
//       }
//
//       let responseToSend = null;
//
//       // 根据 API 类型选择返回的数据
//       if (apiType === 'basic' || apiType === 'zzzAvatarList') {
//         responseToSend = mockZzzAvatarListResponse;
//         console.log(`${logPrefix} Responding with mock zzzAvatarList data for type: ${apiType}.`);
//       } else if (apiType === 'info' || apiType === 'zzzAvatarInfo') {
//           // **** 修改点：复制基础数据，但修改 ID ****
//           if (requestedRoleId) {
//               // 深拷贝基础 mock 数据，避免修改原始对象
//               responseToSend = _.cloneDeep(mockZzzAvatarInfoResponse_1031);
//               // 修改响应数据中的角色 ID 为请求的 ID
//               if (responseToSend?.data?.avatar_list?.[0]) {
//                   responseToSend.data.avatar_list[0].id = parseInt(requestedRoleId, 10); // 确保是数字
//                   console.log(`${logPrefix} Responding with modified mock zzzAvatarInfo data (ID set to: ${requestedRoleId}) for API type: ${apiType}.`);
//                   // *** 再次强调：确保 mockZzzAvatarInfoResponse_1011 包含完整的 ranks 数组 ***
//               } else {
//                    console.warn(`${logPrefix} Base mock data structure for zzzAvatarInfo is invalid. Returning error.`);
//                    responseToSend = { retcode: -500, message: 'Internal mock server error: Invalid base mock data' };
//               }
//           } else {
//                console.warn(`${logPrefix} Could not determine Role ID for zzzAvatarInfo request. Returning error.`);
//                responseToSend = { retcode: -400, message: 'Missing or unparseable Role ID for zzzAvatarInfo request' };
//           }
//           // **** 修改结束 ****
//       } else {
//         console.warn(`${logPrefix} Unknown or unhandled API type: ${apiType}. Returning default error.`);
//         responseToSend = { retcode: -404, message: `Mock data not found for API type: ${apiType}` };
//       }
//
//       // 发送响应
//       console.log(`[Mock Server] 为 ID ${requestedRoleId} 准备的响应数据:`, JSON.stringify(responseToSend, null, 2)); // 打印完整对象
//       res.writeHead(200, { 'Content-Type': 'application/json' });
//       res.end(JSON.stringify(responseToSend));
//
//       console.log(`${logPrefix} Sent mock response.`);
//     });
//     req.on('error', (err) => {
//         console.error('[Mock Server] Request error:', err);
//         res.writeHead(500);
//         res.end('Server error handling request');
//     });
//   } else {
//     res.writeHead(404, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({ error: 'Not Found' }));
//   }
// });
//
// // 启动服务器
// server.listen(PORT, () => {
//   console.log(`[Mock Server] Running at http://localhost:${PORT}`);
//   console.log('[Mock Server] Ready to provide mock game data via POST /getData');
// });
//
// server.on('error', (err) => {
//     if (err.code === 'EADDRINUSE') {
//         console.error(`[Mock Server] Error: Port ${PORT} is already in use. Choose a different port.`);
//     } else {
//         console.error('[Mock Server] Server error:', err);
//     }
//     process.exit(1);
// });
// // --- Helper: 完整复制日志中的 JSON 数据到上面的变量中 ---
// // 你需要手动将日志中完整的 JSON 字符串复制并粘贴到 mockZzzAvatarListResponse 和 mockZzzAvatarInfoResponse_XXXX 变量中
// // 特别注意 mockZzzAvatarInfoResponse_1011 中的 ranks 数组必须是完整的，不能是 [ [Object] ]
