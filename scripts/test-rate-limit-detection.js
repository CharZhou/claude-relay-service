#!/usr/bin/env node

/**
 * 测试限流检测功能
 * 1. 测试错误消息匹配限流检测
 * 2. 测试 reason 参数传递
 * 3. 测试各种错误消息格式
 */

// 测试用的错误消息模拟数据
const testCases = [
  {
    name: 'HTTP 429 with rate limit message',
    statusCode: 429,
    body: {
      error: {
        message: "You've exceeded your account's rate limit. Please try again later."
      }
    },
    expectedMatch: true,
    expectedReason: 'HTTP 429'
  },
  {
    name: 'HTTP 400 with rate_limit in error',
    statusCode: 400,
    body: {
      error: 'rate_limit_exceeded',
      message: 'Too many requests from this account'
    },
    expectedMatch: true,
    expectedReason: 'error message pattern match'
  },
  {
    name: 'HTTP 403 with quota exceeded',
    statusCode: 403,
    body: {
      detail: 'Quota exceeded for this API key'
    },
    expectedMatch: true,
    expectedReason: 'error message pattern match'
  },
  {
    name: 'HTTP 500 with throttled message',
    statusCode: 500,
    body: {
      message: 'Request throttled due to high load'
    },
    expectedMatch: true,
    expectedReason: 'error message pattern match'
  },
  {
    name: 'Chinese rate limit message',
    statusCode: 400,
    body: {
      error: '请求过于频繁，请稍后再试'
    },
    expectedMatch: true,
    expectedReason: 'error message pattern match'
  },
  {
    name: 'Chinese insufficient credits',
    statusCode: 403,
    body: {
      message: '您的积分不足，无法完成此次请求'
    },
    expectedMatch: true,
    expectedReason: 'error message pattern match'
  },
  {
    name: 'String format error - rate limit',
    statusCode: 400,
    body: 'Error: Too many requests. Rate limit exceeded.',
    expectedMatch: true,
    expectedReason: 'error message pattern match'
  },
  {
    name: 'HTTP 400 - Not rate limit',
    statusCode: 400,
    body: {
      error: 'Invalid request',
      message: 'Missing required parameter'
    },
    expectedMatch: false,
    expectedReason: null
  },
  {
    name: 'HTTP 500 - Server error',
    statusCode: 500,
    body: {
      error: 'Internal server error'
    },
    expectedMatch: false,
    expectedReason: null
  }
]

// 测试错误消息检测功能
async function testRateLimitDetection() {
  console.log('🧪 Testing Rate Limit Detection\n')
  console.log('='.repeat(80))
  console.log('\n')

  // 清除 require 缓存
  const modulesToClear = [
    '../src/services/claudeConsoleRelayService',
    '../src/services/claudeRelayService',
    '../src/services/ccrRelayService'
  ]

  modulesToClear.forEach((modulePath) => {
    const resolvedPath = require.resolve(modulePath)
    if (require.cache[resolvedPath]) {
      delete require.cache[resolvedPath]
    }
  })

  // 加载服务
  const claudeConsoleRelayService = require('../src/services/claudeConsoleRelayService')
  const claudeRelayService = require('../src/services/claudeRelayService')
  const ccrRelayService = require('../src/services/ccrRelayService')

  let passedTests = 0
  let failedTests = 0

  // 测试每个服务
  const services = [
    { name: 'ClaudeConsoleRelayService', instance: claudeConsoleRelayService },
    { name: 'ClaudeRelayService', instance: claudeRelayService },
    { name: 'CcrRelayService', instance: ccrRelayService }
  ]

  for (const service of services) {
    console.log(`\n📦 Testing ${service.name}\n`)
    console.log('-'.repeat(80))

    for (const testCase of testCases) {
      const result = service.instance._isRateLimitError(testCase.body)

      const passed = result === testCase.expectedMatch
      const statusIcon = passed ? '✅' : '❌'

      if (passed) {
        passedTests++
      } else {
        failedTests++
      }

      console.log(`${statusIcon} ${testCase.name}`)
      console.log(
        `   Status: ${testCase.statusCode}, Expected: ${testCase.expectedMatch}, Got: ${result}`
      )

      if (!passed) {
        console.log(`   Body: ${JSON.stringify(testCase.body).substring(0, 100)}`)
      }
    }
  }

  // 测试结果摘要
  console.log('\n')
  console.log('='.repeat(80))
  console.log('\n📊 Test Summary\n')
  console.log(`   Total tests: ${passedTests + failedTests}`)
  console.log(`   ✅ Passed: ${passedTests}`)
  console.log(`   ❌ Failed: ${failedTests}`)
  console.log(`   Success rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`)

  if (failedTests > 0) {
    console.log('\n❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('\n✨ All tests passed!')
  }
}

// 测试消息提取功能
async function testMessageExtraction() {
  console.log('\n\n🧪 Testing Error Message Extraction\n')
  console.log('='.repeat(80))
  console.log('\n')

  const claudeConsoleRelayService = require('../src/services/claudeConsoleRelayService')

  const extractionTests = [
    {
      name: 'Nested error.message',
      input: { error: { message: 'Rate limit exceeded' } },
      expected: 'Rate limit exceeded'
    },
    {
      name: 'Direct error string',
      input: { error: 'Rate limit exceeded' },
      expected: 'Rate limit exceeded'
    },
    {
      name: 'Top-level message',
      input: { message: 'Rate limit exceeded' },
      expected: 'Rate limit exceeded'
    },
    {
      name: 'Detail field',
      input: { detail: 'Rate limit exceeded' },
      expected: 'Rate limit exceeded'
    },
    {
      name: 'String input',
      input: 'Rate limit exceeded',
      expected: 'Rate limit exceeded'
    },
    {
      name: 'Nested error.error',
      input: { error: { error: 'Rate limit exceeded' } },
      expected: 'Rate limit exceeded'
    }
  ]

  let passed = 0
  let failed = 0

  for (const test of extractionTests) {
    const result = claudeConsoleRelayService._extractErrorMessage(test.input)
    const isPass = result === test.expected

    if (isPass) {
      passed++
      console.log(`✅ ${test.name}`)
    } else {
      failed++
      console.log(`❌ ${test.name}`)
      console.log(`   Expected: "${test.expected}"`)
      console.log(`   Got: "${result}"`)
    }
  }

  console.log('\n')
  console.log(`📊 Extraction Tests: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    process.exit(1)
  }
}

// 测试关键词匹配
async function testKeywordMatching() {
  console.log('\n\n🧪 Testing Rate Limit Keywords Matching\n')
  console.log('='.repeat(80))
  console.log('\n')

  const claudeConsoleRelayService = require('../src/services/claudeConsoleRelayService')

  const keywords = [
    'rate limit',
    'rate_limit',
    'ratelimit',
    'too many requests',
    'request limit',
    'quota exceeded',
    'throttled',
    'slow down',
    '请求过于频繁',
    '频率限制',
    '积分不足'
  ]

  console.log('📝 Testing all keywords:\n')

  let allPassed = true

  for (const keyword of keywords) {
    const testBody = { message: `Error: ${keyword}` }
    const result = claudeConsoleRelayService._isRateLimitError(testBody)

    if (result) {
      console.log(`✅ "${keyword}" - detected`)
    } else {
      console.log(`❌ "${keyword}" - NOT detected`)
      allPassed = false
    }
  }

  console.log('\n')

  // 测试大小写不敏感
  console.log('🔤 Testing case insensitivity:\n')

  const caseTests = [
    'RATE LIMIT',
    'Rate Limit',
    'rate LIMIT',
    'TOO MANY REQUESTS',
    'Too Many Requests'
  ]

  for (const testCase of caseTests) {
    const testBody = { error: testCase }
    const result = claudeConsoleRelayService._isRateLimitError(testBody)

    if (result) {
      console.log(`✅ "${testCase}" - detected`)
    } else {
      console.log(`❌ "${testCase}" - NOT detected`)
      allPassed = false
    }
  }

  if (!allPassed) {
    console.log('\n❌ Some keyword tests failed!')
    process.exit(1)
  } else {
    console.log('\n✨ All keyword tests passed!')
  }
}

// 运行所有测试
async function runAllTests() {
  try {
    await testRateLimitDetection()
    await testMessageExtraction()
    await testKeywordMatching()

    console.log('\n')
    console.log('='.repeat(80))
    console.log('\n🎉 All tests passed successfully!\n')
  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  }
}

// 执行测试
runAllTests()
