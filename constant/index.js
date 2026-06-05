/**
 * 全局常量
 */

export const FILE = {
  MAX_FILE_SIZE: 300 * 1024 * 1024 // 300MB in bytes
};

export const TASK = {
  STATUS: {
    PROCESSING: 0,
    COMPLETED: 1,
    FAILED: 2
  },
  TYPES: {
    RAG_EVALUATION: 'rag-evaluation',
    RAG_TESTSET_GENERATION: 'rag-testset-generation',
    FEISHU_WIKI_SYNC: 'feishu-wiki-sync',
    FEISHU_WIKI_PROCESS: 'feishu-wiki-process'
  }
};
