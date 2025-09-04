export const API_CONFIG = {
  webhook: {
    url: 'https://webhook.genoiapp.com/webhook/genoibra',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  adminWebhooks: {
    test: {
      list: 'https://webhook.genoiapp.com/admin-api/webhook-test/capta-startups',
      delete: 'https://webhook.genoiapp.com/admin-api/webhook-test/deleta-startups',
      search: 'https://webhook.genoiapp.com/admin-api/webhook-test/busca-startups'
    },
    production: {
      list: 'https://webhook.genoiapp.com/admin-api/webhook/capta-startups',
      delete: 'https://webhook.genoiapp.com/admin-api/webhook/deleta-startups',
      search: 'https://webhook.genoiapp.com/admin-api/webhook/busca-startups'
    }
  }
};

export const PLAN_URLS = {
  jedi: import.meta.env.VITE_PLAN_JEDI_URL,
  mestreJedi: import.meta.env.VITE_PLAN_MESTRE_JEDI_URL,
  mestreYoda: import.meta.env.VITE_PLAN_MESTRE_YODA_URL
};