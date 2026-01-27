const redis = require('../models/redis')
const pricingService = require('../services/pricingService')
const CostCalculator = require('./costCalculator')
const { extractErrorMessage } = require('./errorSanitizer')

// 🚫 统一的限流关键词列表（合并所有服务的关键词）
const RATE_LIMIT_PATTERNS = [
  // 英文关键词
  'rate limit',
  'rate_limit',
  'ratelimit',
  'too many requests',
  'request limit',
  'quota exceeded',
  'quota',
  'insufficient_quota',
  'exceeded your current quota',
  'limit exceeded',
  'billing hard limit',
  'throttled',
  'overloaded',
  'slow down',
  // 中文关键词
  '请求过于频繁',
  '频率限制',
  '积分不足',
  '压力过大',
  '额度已用完',
  'Internal server error'
]

/**
 * 🔍 检查响应数据是否包含限流错误（通用版本）
 * @param {string|object} responseData - 响应数据（字符串或对象）
 * @returns {boolean} 是否为限流错误
 */
function isRateLimitError(responseData) {
  try {
    const errorMessage = extractErrorMessage(responseData)

    if (!errorMessage) {
      return false
    }

    const lowerMessage = errorMessage.toLowerCase()
    return RATE_LIMIT_PATTERNS.some((pattern) => lowerMessage.includes(pattern))
  } catch (error) {
    return false
  }
}

/**
 * 🔍 检查响应是否为限流错误（带状态码版本，用于 OpenAI 等服务）
 * @param {number} statusCode - HTTP 状态码
 * @param {string|object} body - 响应体
 * @returns {boolean} 是否为限流错误
 */
function isRateLimitErrorWithStatus(statusCode, body) {
  // 429 直接判定为限流
  if (statusCode === 429) {
    return true
  }

  if (!body) {
    return false
  }

  // 检查错误消息
  const message = extractErrorMessage(body)
  if (message) {
    const lowerMessage = message.toLowerCase()
    if (RATE_LIMIT_PATTERNS.some((pattern) => lowerMessage.includes(pattern))) {
      return true
    }
  }

  // 检查 error.code / error.type 字段（OpenAI 格式）
  if (typeof body === 'object' && body.error && typeof body.error === 'object') {
    const candidateValues = [body.error.code, body.error.type, body.error.error]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())

    if (
      candidateValues.some((value) => RATE_LIMIT_PATTERNS.some((pattern) => value.includes(pattern)))
    ) {
      return true
    }
  }

  return false
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

// keyId 和 accountType 用于计算倍率成本
async function updateRateLimitCounters(
  rateLimitInfo,
  usageSummary,
  model,
  keyId = null,
  accountType = null
) {
  if (!rateLimitInfo) {
    return { totalTokens: 0, totalCost: 0, ratedCost: 0 }
  }

  const client = redis.getClient()
  if (!client) {
    throw new Error('Redis 未连接，无法更新限流计数')
  }

  const inputTokens = toNumber(usageSummary.inputTokens)
  const outputTokens = toNumber(usageSummary.outputTokens)
  const cacheCreateTokens = toNumber(usageSummary.cacheCreateTokens)
  const cacheReadTokens = toNumber(usageSummary.cacheReadTokens)

  const totalTokens = inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens

  if (totalTokens > 0 && rateLimitInfo.tokenCountKey) {
    await client.incrby(rateLimitInfo.tokenCountKey, Math.round(totalTokens))
  }

  let totalCost = 0
  const usagePayload = {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_creation_input_tokens: cacheCreateTokens,
    cache_read_input_tokens: cacheReadTokens
  }

  try {
    const costInfo = pricingService.calculateCost(usagePayload, model)
    const { totalCost: calculatedCost } = costInfo || {}
    if (typeof calculatedCost === 'number') {
      totalCost = calculatedCost
    }
  } catch (error) {
    // 忽略此处错误，后续使用备用计算
    totalCost = 0
  }

  if (totalCost === 0) {
    try {
      const fallback = CostCalculator.calculateCost(usagePayload, model)
      const { costs } = fallback || {}
      if (costs && typeof costs.total === 'number') {
        totalCost = costs.total
      }
    } catch (error) {
      totalCost = 0
    }
  }

  // 计算倍率成本（用于限流计数）
  let ratedCost = totalCost
  if (totalCost > 0 && keyId) {
    try {
      const apiKeyService = require('../services/apiKeyService')
      const serviceRatesService = require('../services/serviceRatesService')
      const service = serviceRatesService.getService(accountType, model)
      ratedCost = await apiKeyService.calculateRatedCost(keyId, service, totalCost)
    } catch (error) {
      // 倍率计算失败时使用真实成本
      ratedCost = totalCost
    }
  }

  if (ratedCost > 0 && rateLimitInfo.costCountKey) {
    await client.incrbyfloat(rateLimitInfo.costCountKey, ratedCost)
  }

  return { totalTokens, totalCost, ratedCost }
}

module.exports = {
  updateRateLimitCounters,
  isRateLimitError,
  isRateLimitErrorWithStatus,
  RATE_LIMIT_PATTERNS
}
