/**
 * Custom Schema adapter — user-defined request body template with $variable substitution
 * and JSONPath response mapping.
 */
import { BaseRAGClient } from '../endpoint-client';

function resolveValue(obj, path) {
  const parts = path.replace(/^\$\.?/, '').split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function substitute(template, vars) {
  if (typeof template === 'string') {
    return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? '');
  }
  if (Array.isArray(template)) {
    return template.map(item => substitute(item, vars));
  }
  if (typeof template === 'object' && template !== null) {
    const result = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = substitute(value, vars);
    }
    return result;
  }
  return template;
}

export class CustomSchemaClient extends BaseRAGClient {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.customHeaders = config.customHeaders || {};
    this.requestTemplate = config.requestTemplate || {};
    this.responseMap = config.responseMapping || {};
  }

  async sendQuestion(question, options = {}) {
    const timeout = options.timeout || 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const vars = { question, sessionId: options.sessionId || '', timestamp: Date.now() };
    const body = substitute(this.requestTemplate, vars);

    const headers = { 'Content-Type': 'application/json', ...this.customHeaders };

    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
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
      // Send a minimal test request using the template
      const vars = { question: 'test', sessionId: '', timestamp: Date.now() };
      const body = substitute(this.requestTemplate, vars);
      const headers = { 'Content-Type': 'application/json', ...this.customHeaders };

      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, message: 'Connected successfully', latency_ms: Date.now() - start };
    } catch (error) {
      return { success: false, message: error.message, latency_ms: Date.now() - start };
    }
  }

  normalizeResponse(raw) {
    const map = this.responseMap;
    return {
      answer: map.answer ? resolveValue(raw, map.answer) || '' : JSON.stringify(raw),
      context: map.context ? resolveValue(raw, map.context) || '' : '',
      retrievedChunkIds: map.retrievedChunkIds ? resolveValue(raw, map.retrievedChunkIds) || [] : [],
      trace: map.trace ? resolveValue(raw, map.trace) || [] : [],
      sessionId: map.sessionId ? resolveValue(raw, map.sessionId) || '' : '',
      rawResponse: raw
    };
  }
}
