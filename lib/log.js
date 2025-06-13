import log4js from 'log4js'
import path from 'path'
const _path = process.cwd()

// 正确引入 layouts 模块
const { errors } = log4js
const layouts = log4js.layouts // 独立获取 layouts 对象

// 系统常量
const LOG_DIR = path.join(_path, 'logs')
const DEFAULT_LOG_PATTERN = '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}][%p]%] %m'

// 智能日志分级配置
const configureLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production'

  log4js.configure({
    appenders: {
      stdout: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: DEFAULT_LOG_PATTERN.replace('%z', 'MAIN')
        }
      },
      errorFile: {
        type: 'dateFile',
        filename: path.join(LOG_DIR, 'error.log'),
        pattern: 'yyyy-MM-dd',
        keepFileExt: true,
        compress: true,
        layout: layouts
      },
      hierarchyError: {
        type: 'logLevelFilter',
        appender: 'errorFile',
        level: 'error'
      }
    },
    categories: {
      default: {
        appenders: ['stdout', 'hierarchyError'],
        level: 'mark',
        enableCallStack: !isProduction
      },
      // 新增独立错误分类
      error: {
        appenders: ['stdout', 'hierarchyError'],
        level: 'error',
        enableCallStack: !isProduction
      }
    }
  })
}

// 初始化日志系统
configureLogger()

// 获取核心日志实例和独立错误日志实例
const baseLogger = log4js.getLogger()
const errorLogger = log4js.getLogger('error')

// 动态元数据增强（扩展错误处理）
const enrichLogContext = (loggerInstance) => {
  const enhancedLogger = Object.create(loggerInstance)
  
  const sharedContext = {}

  enhancedLogger.addContext = function(key, value) {
    log4js.getLogger().addContext(key, value)
    errorLogger.addContext(key, value)
    sharedContext[key] = value
    return this
  }

  enhancedLogger.addTraceId = function(id) {
    this.addContext('traceId', id)
    errorLogger.addContext('traceId', id) // 同步到错误日志
    return this
  }

  enhancedLogger.trackRequest = function(req) {
    this.addContext('ip', req.ip)
    this.addContext('userAgent', req.headers['user-agent'])
    return this
  }

  // 重写 error 方法
  const originalError = enhancedLogger.error
  enhancedLogger.error = function(...args) {
    // 使用独立错误日志记录器（已包含同步的上下文）
    errorLogger.error(...args)
    
    // 保留原始错误记录（可选）
    if (this.level.isLessThanOrEqualTo(log4js.levels.ERROR)) {
      originalError.apply(this, args)
    }
    return this
  }

  return enhancedLogger
}

// 开发环境堆栈追踪优化
const configureDevStackTraces = () => {
  if (process.env.NODE_ENV === 'development') {
    baseLogger.setParseCallStackFunction((error) => {
      const stack = errors.parseError(error)
      return {
        functionName: stack[0]?.functionName || 'anonymous',
        fileName: path.relative(_path, stack[0]?.fileName || ''),
        lineNumber: stack[0]?.lineNumber,
        columnNumber: stack[0]?.columnNumber,
        callStack: stack.slice(1).map(frame => 
          `${path.basename(frame.fileName)}:${frame.lineNumber}`
        ).join('\n')
      }
    })
  }
}

// 初始化增强功能
const enhancedLogger = enrichLogContext(baseLogger)
configureDevStackTraces()

// 全局错误处理挂钩
process.on('uncaughtException', (err) => {
  enhancedLogger.error('未捕获异常:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  enhancedLogger.error('未处理的Promise拒绝:', reason)
})

export { enhancedLogger as logger }