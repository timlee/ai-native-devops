/* Mock for openai SDK — simulates streaming chat.completions.create() */

async function* makeOpenAiChunks(texts: string[]) {
  for (const text of texts) {
    yield {
      choices: [{ delta: { content: text }, finish_reason: null }],
    };
  }
}

const mockCreate = jest.fn().mockImplementation(() => makeOpenAiChunks(['mock ', 'openai response']));

const MockOpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
}));

(MockOpenAI as any).default = MockOpenAI;

module.exports = MockOpenAI;
module.exports.default = MockOpenAI;
module.exports.__mockCreate = mockCreate;
