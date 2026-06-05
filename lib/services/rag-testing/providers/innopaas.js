/**
 * InnoPaas RAG Agent adapter — two-step JWT auth.
 * Step 1: POST /api/v1/bot/{botId}/token with { api_key } → JWT
 * Step 2: POST /api/v1/bot/{botId}/chat/sources with Bearer JWT → { content, session_id, sources, ... }
 */
import { BaseRAGClient } from '../endpoint-client';

export class InnoPaasClient extends BaseRAGClient {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.botId = config.botId;
    this.apiKey = config.apiKey;
    this._token = null;
    this._tokenExpires = 0;
  }

  async _getToken() {
    if (this._token && Date.now() < this._tokenExpires) return this._token;

    const res = await fetch(`${this.baseUrl}/api/v1/bot/${this.botId}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: this.apiKey })
    });

    if (!res.ok) {
      throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    this._token = data.token;
    // Expire 5 minutes early for safety
    this._tokenExpires = Date.now() + (data.expires_in || 3600) * 1000 - 300000;
    return this._token;
  }

  async sendQuestion(question, options = {}) {
    const token = await this._getToken();
    const timeout = options.timeout || 60000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/bot/${this.botId}/chat/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: question,
          session_id: options.sessionId || ''
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
      await this._getToken();
      return { success: true, message: 'Connected successfully', latency_ms: Date.now() - start };
    } catch (error) {
      return { success: false, message: error.message, latency_ms: Date.now() - start };
    }
  }

  normalizeResponse(raw) {
    return {
      answer: raw.content || '',
      context: raw.context || '',
      sources: raw.sources || [],
      retrievedChunkIds: raw.retrieved_chunk_ids || [],
      trace: raw.tool_calls || [],
      sessionId: raw.session_id || '',
      rawResponse: raw
    };
  }
}
