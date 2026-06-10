const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

export class FeishuClient {
  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.token = null;
    this.tokenExpires = 0;
  }

  async _getTenantAccessToken() {
    if (this.token && Date.now() < this.tokenExpires - 60000) {
      return this.token;
    }

    const res = await fetch(`${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret })
    });

    if (!res.ok) {
      throw new Error(`Token request failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.code !== 0) {
      throw new Error(`Token error: ${data.msg}`);
    }

    this.token = data.tenant_access_token;
    this.tokenExpires = Date.now() + (data.expire || 7200) * 1000;
    return this.token;
  }

  async _request(path, options = {}) {
    const token = await this._getTenantAccessToken();
    const url = `${FEISHU_API_BASE}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!res.ok) {
      throw new Error(`Feishu API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    if (data.code !== 0) {
      throw new Error(`Feishu API error: ${data.msg || data.code}`);
    }

    return data.data || data;
  }

  async testConnection() {
    const start = Date.now();
    try {
      await this._getTenantAccessToken();
      return { success: true, message: 'Connected successfully', latency_ms: Date.now() - start };
    } catch (error) {
      return { success: false, message: error.message, latency_ms: Date.now() - start };
    }
  }

  async listSpaces() {
    const data = await this._request('/wiki/v2/spaces?page_size=50');
    return (data.items || []).map(item => ({
      spaceId: item.space_id,
      spaceName: item.name || item.space_id
    }));
  }

  async listNodes(spaceId, pageToken = '', parentNodeToken = '') {
    let path = `/wiki/v2/spaces/${spaceId}/nodes?page_size=50`;
    if (pageToken) path += `&page_token=${pageToken}`;
    if (parentNodeToken) path += `&parent_node_token=${parentNodeToken}`;
    return await this._request(path);
  }

  async getDocumentRawContent(documentId) {
    return await this._request(`/docx/v1/documents/${documentId}/raw_content`);
  }

  async *walkWikiNodes(spaceId, parentNodeToken = '', folderPath = '') {
    let pageToken = '';
    do {
      const data = await this.listNodes(spaceId, pageToken, parentNodeToken);
      const items = data.items || [];
      for (const item of items) {
        yield { ...item, folderPath };
        if (item.has_child) {
          const childFolderPath = folderPath ? `${folderPath} / ${item.title}` : item.title;
          yield* this.walkWikiNodes(spaceId, item.node_token, childFolderPath);
        }
      }
      pageToken = data.page_token || '';
    } while (pageToken);
  }
}
