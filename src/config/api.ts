export const API_CONFIG = {
  webhook: {
    url: 'https://webhook.genoiapp.com/webhook/production',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  adminWebhooks: {
    test: {
      list: '/api/admin-api/webhook-test/capta-startups',
      delete: '/api/admin-api/webhook-test/deleta-startups',
      search: '/api/admin-api/webhook-test/busca-startups'
    },
    production: {
      list: '/api/admin-api/webhook/capta-startups',
      delete: '/api/admin-api/webhook/deleta-startups',
      search: '/api/admin-api/webhook/busca-startups'
    }
  }
};

export const PLAN_URLS = {
  jedi: import.meta.env.VITE_PLAN_JEDI_URL,
  mestreJedi: import.meta.env.VITE_PLAN_MESTRE_JEDI_URL,
  mestreYoda: import.meta.env.VITE_PLAN_MESTRE_YODA_URL
};