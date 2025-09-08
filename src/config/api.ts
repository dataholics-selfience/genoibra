export const getWebhookUrl = (environment: 'production' | 'test' = 'production') => {
  return environment === 'production' 
    ? import.meta.env.VITE_WEBHOOK_URL || 'https://n8n.genoiapp.com/webhook/production'
    : 'https://n8n.genoiapp.com/webhook-test/production';
};

export const API_CONFIG = {
  webhook: {
    url: getWebhookUrl(),
    headers: {
      'Content-Type': 'application/json'
    }
  },
  adminWebhooks: {
    test: {
      list: 'https://n8n.genoiapp.com/webhook-test/capta-startups',
      delete: 'https://n8n.genoiapp.com/webhook-test/deleta-startups',
      search: 'https://n8n.genoiapp.com/webhook-test/busca-startups'
    },
    production: {
      list: 'https://n8n.genoiapp.com/webhook/capta-startups',
      delete: 'https://n8n.genoiapp.com/webhook/deleta-startups',
      search: 'https://n8n.genoiapp.com/webhook/busca-startups'
    }
  }
};

export const PLAN_URLS = {
  jedi: import.meta.env.VITE_PLAN_JEDI_URL,
  mestreJedi: import.meta.env.VITE_PLAN_MESTRE_JEDI_URL,
  mestreYoda: import.meta.env.VITE_PLAN_MESTRE_YODA_URL
};