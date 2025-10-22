const teamMemoryService = require('../src/services/teamMemoryService')

// 模拟 OpenAI Responses (Codex) 格式请求（无 system 消息）
const codexRequest = {
  model: 'gpt-5-codex',
  instructions: 'You are a coding agent running in the Codex CLI...',
  input: [
    {
      type: 'message',
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: 'Hello'
        }
      ]
    }
  ],
  tools: [],
  reasoning: {
    effort: 'high',
    summary: 'auto'
  }
}

// 模拟已有 system 消息的 Codex 请求
const codexWithSystemRequest = {
  model: 'gpt-5-codex',
  instructions: 'You are a coding agent...',
  input: [
    {
      type: 'message',
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: 'Existing system context'
        }
      ]
    },
    {
      type: 'message',
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: 'Hello'
        }
      ]
    }
  ]
}

console.log('============================================================')
console.log('OpenAI Responses (Codex) 格式测试')
console.log('============================================================\n')

// 1. 测试格式识别
console.log('1. 格式识别测试')
console.log('----------------------------')
console.log('Codex 请求识别:')
console.log(
  '  - isOpenAIResponsesFormatRequest:',
  teamMemoryService.isOpenAIResponsesFormatRequest(codexRequest)
)

console.log('\nCodex (含 system) 请求识别:')
console.log(
  '  - isOpenAIResponsesFormatRequest:',
  teamMemoryService.isOpenAIResponsesFormatRequest(codexWithSystemRequest)
)

// 2. 测试 Memory 注入
console.log('\n2. Team Memory 注入测试')
console.log('----------------------------')

// 等待一下让 Memory 加载完成
setTimeout(() => {
  const status = teamMemoryService.getStatus()
  console.log('服务状态:')
  console.log('  - 启用:', status.enabled)
  console.log('  - Memory 来源:', status.source)
  console.log('  - 缓存大小:', status.cacheSize, 'bytes')

  if (status.cacheSize > 0) {
    console.log('\n测试情况 1: Codex 格式注入（无 system 消息）')
    const codexCopy = JSON.parse(JSON.stringify(codexRequest))
    const originalInputLength = codexCopy.input.length

    teamMemoryService.injectToOpenAIResponsesFormat(codexCopy)

    console.log('  - 原始 input 长度:', originalInputLength)
    console.log('  - 注入后 input 长度:', codexCopy.input.length)
    console.log('  - input[0] 角色:', codexCopy.input[0].role)
    console.log(
      '  - input[0] 包含 TEAM_MEMORY:',
      codexCopy.input[0].content[0].text.includes('TEAM_MEMORY')
    )
    console.log(
      '  - input[0] 包含宪法约束:',
      codexCopy.input[0].content[0].text.includes('SECURITY DIRECTIVE')
    )

    console.log('\n测试情况 2: Codex 格式注入（已有 system 消息）')
    const codexWithSystemCopy = JSON.parse(JSON.stringify(codexWithSystemRequest))
    const originalSystemText = codexWithSystemCopy.input[0].content[0].text

    teamMemoryService.injectToOpenAIResponsesFormat(codexWithSystemCopy)

    console.log('  - 原始 system 文本长度:', originalSystemText.length)
    console.log('  - 注入后 system 文本长度:', codexWithSystemCopy.input[0].content[0].text.length)
    console.log('  - input[0] 角色:', codexWithSystemCopy.input[0].role)
    console.log(
      '  - system 消息包含 TEAM_MEMORY:',
      codexWithSystemCopy.input[0].content[0].text.includes('TEAM_MEMORY')
    )
    console.log(
      '  - system 消息保留原有内容:',
      codexWithSystemCopy.input[0].content[0].text.includes('Existing system context')
    )

    console.log('\n测试情况 3: 二次注入（时间戳检查）')
    const codexCopy2 = JSON.parse(JSON.stringify(codexRequest))
    teamMemoryService.injectToOpenAIResponsesFormat(codexCopy2)
    const firstInjectionText = codexCopy2.input[0].content[0].text

    // 再次注入，应该跳过
    teamMemoryService.injectToOpenAIResponsesFormat(codexCopy2)
    const secondInjectionText = codexCopy2.input[0].content[0].text

    console.log('  - 首次注入和二次注入内容相同:', firstInjectionText === secondInjectionText)
  } else {
    console.log('\n⚠️ Team Memory 未加载，跳过注入测试')
  }

  console.log('\n============================================================')
  console.log('测试完成！')
  console.log('============================================================')

  // 清理定时器并退出
  teamMemoryService.stopAutoRefresh()
  process.exit(0)
}, 2000)
