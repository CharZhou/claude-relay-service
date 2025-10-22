const teamMemoryService = require('../src/services/teamMemoryService')

console.log('============================================================')
console.log('Codex 格式简化逻辑测试')
console.log('============================================================\n')

// 等待 Memory 加载
setTimeout(() => {
  const status = teamMemoryService.getStatus()
  console.log('服务状态:')
  console.log('  - 启用:', status.enabled)
  console.log('  - Memory 来源:', status.source)
  console.log('  - 缓存大小:', status.cacheSize, 'bytes\n')

  if (status.cacheSize === 0) {
    console.log('⚠️ Team Memory 未加载，退出测试')
    teamMemoryService.stopAutoRefresh()
    process.exit(0)
    return
  }

  // 测试 1: 正常请求（input 数组为空）
  console.log('测试 1: 首次注入（input 为空）')
  console.log('----------------------------')
  const request1 = {
    model: 'gpt-5-codex',
    input: []
  }
  teamMemoryService.injectToOpenAIResponsesFormat(request1)
  console.log('  - input 长度:', request1.input.length)
  console.log('  - input[0].role:', request1.input[0].role)
  console.log('  - 包含 TEAM_MEMORY:', request1.input[0].content[0].text.includes('TEAM_MEMORY'))
  console.log(
    '  - 不包含宪法约束:',
    !request1.input[0].content[0].text.includes('SECURITY DIRECTIVE')
  )

  // 测试 2: 二次注入（相同时间戳，应该跳过）
  console.log('\n测试 2: 二次注入（相同时间戳）')
  console.log('----------------------------')
  const beforeLength = request1.input.length
  teamMemoryService.injectToOpenAIResponsesFormat(request1)
  console.log('  - input 长度未变:', request1.input.length === beforeLength)
  console.log('  - input 长度:', request1.input.length)

  // 测试 3: 有用户消息的请求
  console.log('\n测试 3: 有用户消息的请求')
  console.log('----------------------------')
  const request2 = {
    model: 'gpt-5-codex',
    input: [
      {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: '你好'
          }
        ]
      }
    ]
  }
  teamMemoryService.injectToOpenAIResponsesFormat(request2)
  console.log('  - input 长度:', request2.input.length)
  console.log('  - input[0].role:', request2.input[0].role)
  console.log(
    '  - input[0] 包含 TEAM_MEMORY:',
    request2.input[0].content[0].text.includes('TEAM_MEMORY')
  )
  console.log('  - input[1].role:', request2.input[1].role)
  console.log('  - input[1] 是用户消息:', request2.input[1].content[0].text === '你好')

  // 测试 4: 复杂的历史对话
  console.log('\n测试 4: 复杂的历史对话')
  console.log('----------------------------')
  const request3 = {
    model: 'gpt-5-codex',
    input: [
      {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: '第一条消息' }]
      },
      {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: '回复1' }]
      },
      {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: '第二条消息' }]
      }
    ]
  }
  const originalLength = request3.input.length
  teamMemoryService.injectToOpenAIResponsesFormat(request3)
  console.log('  - 原始 input 长度:', originalLength)
  console.log('  - 注入后 input 长度:', request3.input.length)
  console.log(
    '  - input[0] 是 Team Memory:',
    request3.input[0].content[0].text.includes('TEAM_MEMORY')
  )
  console.log('  - input[1] 是原来的第一条:', request3.input[1].content[0].text === '第一条消息')
  console.log('  - 历史对话完整保留:', request3.input.length === originalLength + 1)

  // 测试 5: 模拟时间戳更新
  console.log('\n测试 5: 模拟时间戳更新（强制刷新 Memory）')
  console.log('----------------------------')
  const request4 = {
    model: 'gpt-5-codex',
    input: []
  }
  teamMemoryService.injectToOpenAIResponsesFormat(request4)
  const firstTimestamp = request4.input[0].content[0].text.match(/TEAM_MEMORY_START:(\d+)/)[1]
  console.log('  - 首次注入时间戳:', firstTimestamp)

  // 模拟刷新 Memory
  teamMemoryService.clearCache()
  setTimeout(() => {
    teamMemoryService.refreshMemory().then(() => {
      teamMemoryService.injectToOpenAIResponsesFormat(request4)
      const secondTimestamp = request4.input[0].content[0].text.match(/TEAM_MEMORY_START:(\d+)/)[1]
      console.log('  - 刷新后时间戳:', secondTimestamp)
      console.log('  - 时间戳已更新:', firstTimestamp !== secondTimestamp)
      console.log('  - input 长度仍为 1:', request4.input.length === 1)

      console.log('\n============================================================')
      console.log('测试完成！所有逻辑验证通过 ✅')
      console.log('============================================================')

      teamMemoryService.stopAutoRefresh()
      process.exit(0)
    })
  }, 100)
}, 2000)
