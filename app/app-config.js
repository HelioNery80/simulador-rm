/* ===== CONFIGURAÇÃO DO APP (edite antes de publicar) ===== */
window.APP_CONFIG = {
  /* Chaves PÚBLICAS do SDK do RevenueCat (Project settings > API keys). Enquanto forem 'REPLACE_*', o app NÃO libera nada premium. */
  rcKeyAndroid: 'REPLACE_GOOGLE_PUBLIC_SDK_KEY',   // começa com goog_
  rcKeyIos:     'REPLACE_APPLE_PUBLIC_SDK_KEY',    // começa com appl_
  webLimited: true,   /* PWA gratuita: bloqueia premium e mostra aviso (sem compra); não afeta o app nativo */
  entitlement:  'premium',                          // identificador do "Entitlement" no RevenueCat
  trialText:    '7 dias grátis',                    // exibido se a loja não informar o período de teste
  /* Regiões liberadas sem assinatura (ids de REGIONS). Todas as demais + Lab de Imagem + Estúdio exigem assinatura. */
  freeRegions:  ['cranio', 'coluna', 'joelho', 'ombro'],
  lockLab: true, lockStudio: true,
  privacyUrl:   'https://helionery80.github.io/simulador-rm/privacidade.html',
  termsUrl:     'https://helionery80.github.io/simulador-rm/termos.html',
  supportEmail: 'nery.helio@gmail.com'
};
