// 定价数据源配置
// 优先级: PRICE_MIRROR_REPO > GITHUB_REPOSITORY (GitHub Actions自动设置) > 默认仓库
// Fork用户: 将自动使用 GITHUB_REPOSITORY,或设置 PRICE_MIRROR_REPO 环境变量
const repository =
  process.env.PRICE_MIRROR_REPO || process.env.GITHUB_REPOSITORY || 'Wei-Shaw/claude-relay-service'
const branch = process.env.PRICE_MIRROR_BRANCH || 'price-mirror'
const pricingFileName = process.env.PRICE_MIRROR_FILENAME || 'model_prices_and_context_window.json'
const hashFileName = process.env.PRICE_MIRROR_HASH_FILENAME || 'model_prices_and_context_window.sha256'

const baseUrl = process.env.PRICE_MIRROR_BASE_URL
  ? process.env.PRICE_MIRROR_BASE_URL.replace(/\/$/, '')
  : `https://raw.githubusercontent.com/${repository}/${branch}`

module.exports = {
  pricingFileName,
  hashFileName,
  pricingUrl:
    process.env.PRICE_MIRROR_JSON_URL || `${baseUrl}/${pricingFileName}`,
  hashUrl: process.env.PRICE_MIRROR_HASH_URL || `${baseUrl}/${hashFileName}`
}
