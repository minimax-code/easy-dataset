/**
 * LangChain Agent adapter — compatible with LangChain AgentExecutor HTTP endpoint.
 */
import { BaseRAGClient } from '../endpoint-client';

export class LangChainClient extends BaseRAGClient {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.agentId = config.agentId || '';
  }

  async sendQuestion(question, options = {}) {
    const timeout = options.timeout || 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

      const url = this.agentId ? `${this.baseUrl}/agents/${this.agentId}/invoke` : `${this.baseUrl}/invoke`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          input: { question },
          session_id: options.sessionId || undefined
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${await res.text()}`);
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
      const headers = {};
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

      const res = await fetch(`${this.baseUrl}/health`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, message: 'Connected successfully', latency_ms: Date.now() - start };
    } catch (error) {
      return { success: false, message: error.message, latency_ms: Date.now() - start };
    }
  }

  normalizeResponse(raw) {
    const output = raw.output || raw;
    return {
      answer: typeof output === 'string' ? output : output.answer || output.response || JSON.stringify(output),
      context: output.context || raw.context || '',
      retrievedChunkIds: output.retrieved_chunk_ids || raw.retrieved_chunk_ids || [],
      trace: raw.intermediate_steps || output.tool_calls || [],
      sessionId: raw.session_id || output.session_id || '',
      rawResponse: raw
    };
  }
}
