/*
  仅供ZZZ面板更新使用，预期在所绑定设备被拉黑时生效，作为兜底(x)

  请确保此Handler优先级位于最后
  服务端：https://github.com/XuF163/ZZZ-Enka-MYS-Server

  参考测试流程：#扫码登录 -> 不绑定设备 一直刷 %更新面板 导致mys出🐎 ->调用Enka ->更新面板

 */

export class Handler extends plugin {
  constructor() {
    super({
      name: '小新枝',
      namespace: '小新枝API',
      priority: 100,
      handler: [{
        key: 'mys.req.err',
        fn: 'mysReqErrHandler'
      }]
    })
  }

  // 接受的参数
 async mysReqErrHandler(e, args, reject) {
    if (e.msg !== '#绝区零更新面板' || ![1034, 5003, 10035, 10041].includes(Number(args?.res?.retcode)) ) {
      return reject()
    }
    try {
      let apiUrl = {}
      if (args?.type === 'zzzAvatarInfo') {
        let { url } = await args.mysApi.getUrl(args?.type, args.data)
        apiUrl.url = url.slice(0, url.indexOf('?'));
        apiUrl.query = url.slice(url.indexOf('?'));
      } else {
        apiUrl = args.mysApi.apiTool.getUrlMap({ ...args.data, deviceId: '' })[args?.type]
      }
      const START = Date.now()
      const data = {
        cookie: args.mysApi?.cookie,
        apiUrl
      }
      //测试服务器，随时关，自部署的话换成自己的
      let res = await fetch(`http://127.0.0.1:63636/getData`, {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      })
      res = await res.json()
      logger.debug(res)
      if (res?.retcode === 0) {
        logger.info(`Enka查询耗时 ${logger.green(`${Date.now() - START}ms`)}`)

      logger.info(JSON.stringify(res, null, 2));

        return res

      }
      return reject()
    } catch (err) { logger.info(err) }
    return reject()
  }
}
