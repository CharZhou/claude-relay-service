#!/usr/bin/env node

/**
 * 测试统一的 Team Memory Service
 * 验证 Claude 和 OpenAI 格式的请求注入功能
 */

const teamMemoryService = require('../src/services/teamMemoryService')

console.log('='.repeat(60))
console.log('Team Memory Service 功能测试')
console.log('='.repeat(60))
console.log()

// 测试状态
console.log('1. 获取服务状态')
const status = teamMemoryService.getStatus()
console.log('服务状态:', JSON.stringify(status, null, 2))
console.log()

// 测试 Claude 格式请求识别
console.log('2. 测试 Claude 格式请求识别')
const claudeRequest = {
  model: 'claude-sonnet-4-20250514',
  system: [
    {
      type: 'text',
      text: "You are Claude Code, Anthropic's official CLI for Claude.",
      cache_control: { type: 'ephemeral' }
    }
  ],
  messages: [
    {
      role: 'user',
      content: 'Hello'
    }
  ]
}
console.log('是否是 Claude Code 请求:', teamMemoryService.isRealClaudeCodeRequest(claudeRequest))
console.log('是否是 OpenAI 格式请求:', teamMemoryService.isOpenAIFormatRequest(claudeRequest))
console.log()

// 测试 OpenAI 格式请求识别
console.log('3. 测试 OpenAI 格式请求识别')
const openaiRequest = {
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant.'
    },
    {
      role: 'user',
      content: 'Hello'
    }
  ]
}
console.log('是否是 Claude Code 请求:', teamMemoryService.isRealClaudeCodeRequest(openaiRequest))
console.log('是否是 OpenAI 格式请求:', teamMemoryService.isOpenAIFormatRequest(openaiRequest))
console.log()

// 测试统一注入方法
console.log('4. 测试明确的注入方法（推荐方式）')
console.log()

console.log('4.1 使用 injectToClaudeFormat 注入 Claude 格式请求')
const claudeTestRequest = JSON.parse(JSON.stringify(claudeRequest))
teamMemoryService.injectToClaudeFormat(claudeTestRequest)
console.log('注入后的 system 数组长度:', claudeTestRequest.system?.length || 0)
if (claudeTestRequest.system && claudeTestRequest.system.length > 1) {
  console.log(
    'system[1] 包含 TEAM_MEMORY:',
    claudeTestRequest.system[1].text?.includes('TEAM_MEMORY')
  )
}
console.log()

console.log('4.2 使用 injectToOpenAIFormat 注入 OpenAI 格式请求')
const openaiTestRequest = JSON.parse(JSON.stringify(openaiRequest))
teamMemoryService.injectToOpenAIResponsesFormat(openaiTestRequest)
console.log('注入后的 messages 数组长度:', openaiTestRequest.messages?.length || 0)
if (openaiTestRequest.messages && openaiTestRequest.messages.length > 0) {
  const systemMessage = openaiTestRequest.messages.find((m) => m.role === 'system')
  console.log('system 消息包含 TEAM_MEMORY:', systemMessage?.content?.includes('TEAM_MEMORY'))
}
console.log()

console.log('='.repeat(60))
console.log('测试完成！')
console.log('='.repeat(60))
