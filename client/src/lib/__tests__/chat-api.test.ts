import { describe, it, expect } from 'vitest'

// Basic sanity tests for the chat API module
describe('ChatAPI', () => {
  it('should export chatAPI instance', async () => {
    const { chatAPI } = await import('../chat-api')
    expect(chatAPI).toBeDefined()
  })

  it('should have all CRUD methods', async () => {
    const { chatAPI } = await import('../chat-api')
    expect(typeof chatAPI.createChat).toBe('function')
    expect(typeof chatAPI.listChats).toBe('function')
    expect(typeof chatAPI.getChat).toBe('function')
    expect(typeof chatAPI.updateChat).toBe('function')
    expect(typeof chatAPI.deleteChat).toBe('function')
    expect(typeof chatAPI.getMessages).toBe('function')
    expect(typeof chatAPI.sendMessageStream).toBe('function')
  })

  it('should have document management methods', async () => {
    const { chatAPI } = await import('../chat-api')
    expect(typeof chatAPI.uploadDocuments).toBe('function')
    expect(typeof chatAPI.getChatDocuments).toBe('function')
    expect(typeof chatAPI.deleteDocument).toBe('function')
  })
})
