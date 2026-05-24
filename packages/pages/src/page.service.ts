export const pageService = {
  createPage: async (params: any) => { return { id: 'pageId' }; },
  movePage: async (tx: any, pageId: string, newParentId: string | null, workspaceId: string) => {},
  getTree: async (dbClient: any, workspaceId: string) => { return []; }
};
