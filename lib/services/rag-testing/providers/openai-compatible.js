/**
 * OpenAI Chat Completions compatible adapter.
 * POST {baseUrl}/chat/completions with Bearer apiKey
 */
import { BaseRAGClient } from '../endpoint-client';

export class OpenAICompatibleClient extends BaseRAGClient {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.modelName = config.modelName || 'gpt-3.5-turbo';
  }

  async sendQuestion(question, options = {}) {
    const timeout = options.timeout || 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: question }]
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.status} ${await res.text()}`);
      }

      const raw = await res.json();
      return this.normalizeResponse(raw);
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection() {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, message: 'Connected successfully', latency_ms: Date.now() - start };
    } catch (error) {
      return { success: false, message: error.message, latency_ms: Date.now() - start };
    }
  }

  normalizeResponse(raw) {
    const choice = raw.choices?.[0];
    return {
      answer: choice?.message?.content || '',
      context: '',
      retrievedChunkIds: [],
      trace: [],
      sessionId: raw.id || '',
      rawResponse: raw
    };
  }
}
