/* Mock for @anthropic-ai/sdk — simulates streaming messages.stream() */

async function* makeAnthropicChunks(texts: string[]) {
  for (const text of texts) {
    yield {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text },
    };
  }
}

const mockStream = (texts: string[] = ['mock chunk']) => makeAnthropicChunks(texts);

const mockMessages = {
  stream: jest.fn().mockImplementation(() => mockStream(['Hello', ' World'])),
};

const MockAnthropic = jest.fn().mockImplementation(() => ({
  messages: mockMessages,
}));

(MockAnthropic as any).default = MockAnthropic;

module.exports = MockAnthropic;
module.exports.default = MockAnthropic;
module.exports.__mockMessages = mockMessages;
module.exports.__mockStream = mockStream;
