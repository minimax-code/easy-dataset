/**
 * Base RAG Agent client — all endpoint adapters extend this.
 */

export class BaseRAGClient {
  constructor(config) {
    this.config = config;
  }

  /**
   * Send a question to the RAG Agent and return a normalized response.
   * @param {string} question
   * @param {{ sessionId?: string, timeout?: number }} options
   * @returns {Promise<{ answer: string, context: string, sources: object[], retrievedChunkIds: string[], trace: object[], sessionId: string, rawResponse: object }>}
   */
  async sendQuestion(question, options = {}) {
    throw new Error('sendQuestion() must be implemented by subclass');
  }

  /**
   * Test connectivity to the endpoint.
   * @returns {Promise<{ success: boolean, message: string, latency_ms: number }>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  /**
   * Normalize raw response into standard format.
   */
  normalizeResponse(raw) {
    return {
      answer: '',
      context: '',
      sources: [],
      retrievedChunkIds: [],
      trace: [],
      sessionId: '',
      rawResponse: raw
    };
  }
}

/**
 * Factory: instantiate the correct client based on endpoint config.
 */
export function createRAGClient(endpoint) {
  const type = endpoint.endpointType;
  const authConfig = typeof endpoint.authConfig === 'string' ? JSON.parse(endpoint.authConfig) : endpoint.authConfig;
  const requestMapping =
    typeof endpoint.requestMapping === 'string' ? JSON.parse(endpoint.requestMapping) : endpoint.requestMapping;
  const responseMapping =
    typeof endpoint.responseMapping === 'string' ? JSON.parse(endpoint.responseMapping) : endpoint.responseMapping;
  const tokenMapping =
    typeof endpoint.tokenMapping === 'string' ? JSON.parse(endpoint.tokenMapping) : endpoint.tokenMapping;

  const config = {
    baseUrl: endpoint.baseUrl,
    ...authConfig,
    requestMapping,
    responseMapping,
    tokenMapping
  };

  switch (type) {
    case 'innopaas': {
      const { InnoPaasClient } = require('./providers/innopaas');
      return new InnoPaasClient(config);
    }
    case 'openai-compatible': {
      const { OpenAICompatibleClient } = require('./providers/openai-compatible');
      return new OpenAICompatibleClient(config);
    }
    case 'langchain': {
      const { LangChainClient } = require('./providers/langchain');
      return new LangChainClient(config);
    }
    case 'custom': {
      const { CustomSchemaClient } = require('./providers/custom-schema');
      return new CustomSchemaClient(config);
    }
    default:
      throw new Error(`Unknown endpoint type: ${type}`);
  }
}
