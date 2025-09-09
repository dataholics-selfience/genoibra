# Gen.OI - Plataforma de Inovação Aberta

## 🔥 Configuração do Firebase

O projeto está configurado para usar o Firebase project: **genoibra-5ed82**

- Project ID: `genoibra-5ed82`
- Auth Domain: `genoibra-5ed82.firebaseapp.com`
- Storage Bucket: `genoibra-5ed82.firebasestorage.app`

## 🔧 Configuração do MailerSend

### 1. Instalar a extensão oficial do MailerSend

#### Via Console Firebase:
1. Acesse o [Firebase Console](https://console.firebase.google.com/project/genoibra-5ed82)
2. Selecione seu projeto `genoibra-5ed82`
3. Vá em **Extensions** no menu lateral
4. Clique em **Browse Hub**
5. Procure por "MailerSend" ou acesse diretamente: [MailerSend Extension](https://extensions.dev/extensions/mailersend/mailersend-email)
6. Clique em **Install**

#### Via Firebase CLI:
```bash
firebase ext:install mailersend/mailersend-email --project=genoibra-5ed82
```

### 2. Configuração durante a instalação

Durante a instalação, você será solicitado a configurar os seguintes parâmetros:

- **MAILERSEND_API_KEY**: `mlsn.sua_api_key_aqui`
- **EMAIL_COLLECTION**: `emails`
- **DEFAULT_FROM_EMAIL**: `noreply@genoi.com.br`
- **DEFAULT_FROM_NAME**: `Gen.OI - Inovação Aberta`

### 3. Configurar domínio no MailerSend

1. Acesse o [painel do MailerSend](https://app.mailersend.com/)
2. Vá em **Domains** > **Add Domain**
3. Adicione o domínio `genoi.com.br`
4. Configure os registros DNS conforme instruído:
   - **TXT** para verificação
   - **CNAME** para DKIM
   - **MX** (se necessário)

### 4. Obter API Key

1. No painel do MailerSend, vá em **API Tokens**
2. Clique em **Create Token**
3. Selecione as permissões: **Email Send**
4. Copie a API key (formato: `mlsn.xxxxx`)

## 📧 Como funciona

### Envio de Email
1. O usuário preenche o formulário na interface
2. O sistema adiciona um documento na coleção `emails` do Firestore
3. A extensão do MailerSend detecta automaticamente o novo documento
4. O email é enviado via MailerSend
5. O status é atualizado no documento

### Estrutura do documento de email:
```javascript
{
  to: [{ email: 'destinatario@exemplo.com', name: 'Nome' }],
  from: { email: 'noreply@genoi.com.br', name: 'Gen.OI' },
  subject: 'Assunto do email',
  html: 'Conteúdo HTML formatado',
  text: 'Conteúdo em texto simples',
  reply_to: { email: 'noreply@genoi.com.br', name: 'Gen.OI - Suporte' },
  tags: ['crm', 'startup-interaction'],
  metadata: { startupId: 'xxx', userId: 'xxx' }
}
```

## 🎯 Vantagens desta abordagem

✅ **Mais confiável**: Extensão oficial mantida pelo MailerSend  
✅ **Mais simples**: Sem código de Functions para manter  
✅ **Mais segura**: API key protegida na configuração da extensão  
✅ **Monitoramento automático**: Logs e status integrados  
✅ **Retry automático**: Tentativas automáticas em caso de falha  
✅ **Webhooks automáticos**: Eventos de entrega configurados automaticamente  

## 🚀 Deploy

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
firebase deploy --project=genoibra-5ed82
```

## 📊 Monitoramento

### Logs da extensão
- Acesse **Extensions** > **MailerSend** > **Logs** no Firebase Console
- Monitore envios, falhas e status de entrega

### Métricas no MailerSend
- Dashboard com estatísticas de envio
- Taxa de entrega, abertura e cliques
- Relatórios detalhados

## 🔧 Troubleshooting

### Email não enviado
1. Verifique se a extensão está instalada e ativa
2. Confirme se a API key está correta
3. Verifique se o domínio está verificado no MailerSend
4. Consulte os logs da extensão no Firebase Console

### Domínio não verificado
1. Confirme os registros DNS no seu provedor
2. Aguarde a propagação (pode levar até 24h)
3. Use a ferramenta de verificação do MailerSend

## 🔒 Sistema de Controle de Acesso por IP

### Visão Geral
A plataforma possui um sistema robusto de controle de acesso baseado em endereços IP, garantindo que apenas usuários autorizados possam acessar o sistema.

### Como Funciona

#### 1. Verificação Automática
- **Momento**: A cada login e acesso ao painel administrativo
- **Método**: Netlify Function segura (`/.netlify/functions/verify-ip`)
- **Suporte**: IPv4 e IPv6 completos
- **Headers verificados**: `x-forwarded-for`, `x-real-ip`, `x-nf-client-connection-ip`

#### 2. Armazenamento Seguro
- **Collection Firebase**: `allowedIPs`
- **Campos**:
  - `ip`: Endereço IP (IPv4 ou IPv6)
  - `description`: Descrição do IP (ex: "Escritório principal")
  - `addedBy`: Email do administrador que adicionou
  - `addedAt`: Timestamp de criação
  - `type`: "ipv4" ou "ipv6"
  - `active`: Status ativo/inativo

#### 3. Configuração de Acesso Público
- **Collection**: `systemConfig/publicAccess`
- **Função**: Desabilita temporariamente todas as restrições de IP
- **Uso**: Para manutenção ou acesso emergencial

### Gerenciamento via Interface

#### Acesso ao Painel
1. Login como Sudo Admin (`daniel.mendes@dataholics.io`)
2. Navegar para `/sudo-admin`
3. Selecionar aba "Controle de IP"

#### Funcionalidades Disponíveis
- ✅ **Visualizar IP atual** do administrador
- ✅ **Adicionar IPs** com validação automática de formato
- ✅ **Remover IPs** com confirmação de segurança
- ✅ **Toggle de Acesso Público** para emergências
- ✅ **Detecção automática** de IPv4 e IPv6
- ✅ **Validação em tempo real** de formatos

### Exemplos de IPs Válidos

#### IPv4
```
192.168.1.1      # Rede local
203.0.113.1      # IP público
127.0.0.1        # Localhost
10.0.0.1         # Rede privada
```

#### IPv6
```
2001:db8::1      # IPv6 padrão
::1              # IPv6 localhost
fe80::1          # Link-local
2001:db8:85a3::8a2e:370:7334  # IPv6 completo
```

### Fluxo de Segurança

1. **Usuário tenta acessar** → Netlify Function extrai IP real
2. **Verificação no Firebase** → Busca IP na collection `allowedIPs`
3. **Decisão de acesso**:
   - ✅ **IP autorizado** → Acesso liberado
   - ❌ **IP não autorizado** → Página de acesso negado
   - 🌍 **Acesso público ativo** → Bypass das restrições

### Logs e Auditoria
- Todas as tentativas de acesso são logadas
- IPs bloqueados são registrados com timestamp
- Alterações na configuração são auditadas
- Logs disponíveis no console do Netlify Functions

### Configuração de Emergência

#### Habilitar Acesso Público Temporário
1. Acessar painel Sudo Admin
2. Ativar toggle "Acesso Público"
3. Sistema permite qualquer IP temporariamente
4. Desabilitar após resolver problema de acesso

#### Recuperação de Acesso
Se o administrador perder acesso:
1. Usuário vê página de "Acesso Negado"
2. Botão para contato via WhatsApp com dados do IP
3. Administrador pode adicionar IP remotamente
4. Ou ativar acesso público temporariamente

### Segurança Implementada
- 🔒 **Verificação server-side** via Netlify Functions
- 🔒 **Não confia no front-end** para validação
- 🔒 **Headers múltiplos** para detecção de IP real
- 🔒 **Validação rigorosa** de formatos IPv4/IPv6
- 🔒 **Logs completos** para auditoria
- 🔒 **Fallback seguro** em caso de erro (nega acesso)

### Troubleshooting

#### IP não detectado
- Verificar configuração do Netlify
- Confirmar headers de proxy
- Testar em ambiente de produção

#### Formato inválido
- Usar validador de IP online
- Verificar se é IPv4 ou IPv6 válido
- Remover espaços e caracteres especiais

#### Acesso negado inesperado
- Verificar se IP mudou (conexões dinâmicas)
- Confirmar se acesso público está desabilitado
- Verificar logs da Netlify Function