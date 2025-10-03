# Configuração de API Key para Integração N8N

## 📋 Visão Geral

Este guia explica como configurar a autenticação API Key para a integração do ZapGastos com N8N (webhooks WhatsApp).

### Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuário envia mensagem no WhatsApp                      │
│     "Gastei 50 reais no almoço"                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. WhatsApp → Webhook → N8N                                │
│     Contém: telefone, lid, mensagem                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. N8N processa com AI                                     │
│     Extrai: valor, tipo, descrição, categoria               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. N8N chama API ZapGastos                                 │
│     Header: X-API-Key (System Key)                          │
│     Body: telefone do usuário                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Backend valida:                                         │
│     ✅ API Key do N8N                                       │
│     ✅ Identifica usuário pelo telefone                     │
│     ✅ Valida plano daquele usuário                         │
│     ✅ Cria transação                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Gerando a System API Key

Existem **2 formas** de gerar a System Key:

### Opção 1: Via Script CLI (Recomendado)

```bash
cd backend
python -m scripts.create_system_key --user-id <seu-uuid>
```

**Exemplo:**
```bash
python -m scripts.create_system_key --user-id f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Saída:**
```
======================================================================
 ZapGastos - Gerador de System API Key para N8N
======================================================================

👤 Usuário ID: f47ac10b-58cc-4372-a567-0e02b2c3d479
📝 Nome da Key: N8N System Key

🔨 Gerando nova System API Key...

✅ System API Key criada com sucesso!

======================================================================
🔑 API KEY (SALVE EM LOCAL SEGURO - NUNCA SERÁ MOSTRADA NOVAMENTE):
======================================================================

zpg_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7

======================================================================

📋 Informações da Key:
   ID:          uuid-da-key
   Prefix:      zpg_1a2b
   Scopes:      transactions, budgets, commitments, reports
   Expira em:   Nunca
   Criada em:   2025-10-03 10:30:00

⚙️  Configuração no N8N:
----------------------------------------------------------------------
1. Acesse as configurações do N8N
2. Adicione variável de ambiente:

   Nome:  ZAPGASTOS_API_KEY
   Valor: zpg_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7

3. Nos HTTP Request nodes, adicione header:

   Nome:  X-API-Key
   Valor: {{$env.ZAPGASTOS_API_KEY}}
----------------------------------------------------------------------

✅ Pronto! O N8N agora pode autenticar na API do ZapGastos.
```

**Opções do script:**
- `--user-id <uuid>` - UUID do usuário dono da key (obrigatório)
- `--name "Nome"` - Nome customizado (opcional)
- `--force` - Revoga key existente e cria nova

### Opção 2: Via API REST

```bash
POST /api-keys/system
Authorization: Bearer <seu-jwt-token>
```

**Resposta:**
```json
{
  "id": "uuid-da-key",
  "key": "zpg_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7",
  "key_prefix": "zpg_1a2b",
  "name": "N8N System Key",
  "scopes": ["transactions", "budgets", "commitments", "reports"],
  "is_active": true,
  "expires_at": null,
  "created_at": "2025-10-03T10:30:00Z"
}
```

⚠️ **IMPORTANTE:** A `key` completa é mostrada **APENAS UMA VEZ**! Salve imediatamente.

---

## ⚙️ Configurando no N8N

### Passo 1: Adicionar Variável de Ambiente

No arquivo `.env` do N8N ou nas configurações do ambiente:

```bash
ZAPGASTOS_API_KEY=zpg_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7
ZAPGASTOS_API_URL=https://api.zapgastos.com
```

### Passo 2: Configurar HTTP Request Node

Nos nodes que fazem requisições para a API do ZapGastos:

```
┌─────────────────────────────────────┐
│  HTTP Request Node                  │
├─────────────────────────────────────┤
│  Method: POST                       │
│  URL: {{$env.ZAPGASTOS_API_URL}}/n8n/transaction/create
│                                     │
│  Headers:                           │
│  ┌───────────────────────────────┐ │
│  │ Name:  X-API-Key              │ │
│  │ Value: {{$env.ZAPGASTOS_API_KEY}} │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ Name:  Content-Type           │ │
│  │ Value: application/json       │ │
│  └───────────────────────────────┘ │
│                                     │
│  Body (JSON):                       │
│  {                                  │
│    "telefone": "{{$json.from}}",    │
│    "valor": 50.0,                   │
│    "tipo": "despesa",               │
│    "descricao": "Almoço"            │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 📡 Endpoints Disponíveis

Todos os endpoints N8N requerem header `X-API-Key`.

### 1. Criar Transação
```http
POST /n8n/transaction/create
X-API-Key: zpg_abc123...

{
  "telefone": "+5511999999999",  // Identifica o usuário
  "valor": 150.50,
  "tipo": "despesa",
  "descricao": "Almoço restaurante",
  "mensagem_original": "Gastei 150 no almoço"
}
```

### 2. Criar Orçamento
```http
POST /n8n/budget/create
X-API-Key: zpg_abc123...

{
  "telefone": "+5511999999999",
  "valor_limite": 500.00,
  "categoria_nome": "Alimentação",
  "mes_referencia": "2025-10"
}
```

### 3. Criar Compromisso
```http
POST /n8n/compromisso/create
X-API-Key: zpg_abc123...

{
  "telefone": "+5511999999999",
  "titulo": "Reunião importante",
  "data": "2025-10-15",
  "hora_inicio": "14:00",
  "hora_fim": "15:00"
}
```

### 4. Gerar Relatório
```http
POST /n8n/relatorio/generate
X-API-Key: zpg_abc123...

{
  "telefone": "+5511999999999",
  "data_inicio": "2025-10-01",
  "data_fim": "2025-10-31",
  "tipo": "despesa"
}
```

---

## 🔒 Segurança

### Como Funciona a Autenticação

1. **N8N se autentica** com a System Key via header `X-API-Key`
2. **Backend valida** se a key é válida (ativa, não expirada, hash correto)
3. **Backend identifica** o usuário pelo `telefone` ou `lid` no body
4. **Backend valida** o plano daquele usuário específico
5. **Operação é executada** se o usuário tiver permissão

### Validação de Features

Cada endpoint valida se o **usuário do body** (não da API Key) tem permissão:

```python
# Exemplo interno do backend (você não precisa fazer isso)
user = identificar_usuario_pelo_telefone(body.telefone)

if not user.plano:
    return 403 "User has no active plan"

if not user.plano.has_feature("transactions"):
    return 402 "User plan does not support transactions"

# Prossegue com a operação...
```

### Scopes da System Key

A System Key tem **TODOS** os scopes:
- `transactions` - Criar transações
- `budgets` - Criar orçamentos
- `commitments` - Criar compromissos
- `reports` - Gerar relatórios

Mas isso **NÃO** significa que qualquer usuário pode fazer tudo! O plano de cada usuário é validado individualmente.

---

## 🛠️ Gerenciamento da Key

### Listar Keys
```bash
GET /api-keys
Authorization: Bearer <jwt-token>
```

### Revogar Key
```bash
POST /api-keys/{key_id}/revoke
Authorization: Bearer <jwt-token>
```

### Deletar Key
```bash
DELETE /api-keys/{key_id}
Authorization: Bearer <jwt-token>
```

### Recriar System Key

Se você perdeu a key ou precisa renovar:

```bash
# Via CLI (revoga e cria nova)
python -m scripts.create_system_key --user-id <uuid> --force

# Ou revogue via API e crie nova
POST /api-keys/{key_id}/revoke
POST /api-keys/system
```

---

## ❓ Troubleshooting

### Erro 401: Invalid API key

**Causa:** API Key incorreta ou inválida

**Solução:**
1. Verifique se copiou a key completa
2. Verifique se a key não foi revogada
3. Verifique se não expirou
4. Regenere a key se necessário

### Erro 402: User plan does not support feature

**Causa:** O usuário não tem permissão no plano dele

**Solução:**
1. Verifique o plano do usuário
2. Faça upgrade do plano do usuário
3. Verifique se o telefone está correto

### Erro 404: User not found

**Causa:** Telefone não encontrado no banco

**Solução:**
1. Verifique o formato do telefone (+55...)
2. Verifique se o usuário existe no sistema
3. Use `lid` ao invés de `telefone` se disponível

---

## 📝 Exemplo Completo de Workflow N8N

```json
{
  "nodes": [
    {
      "name": "WhatsApp Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "whatsapp"
      }
    },
    {
      "name": "Process with AI",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "prompt": "Extract transaction from: {{$json.body.message}}"
      }
    },
    {
      "name": "Create Transaction",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.ZAPGASTOS_API_URL}}/n8n/transaction/create",
        "authentication": "none",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "={{$env.ZAPGASTOS_API_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "telefone",
              "value": "={{$json.body.from}}"
            },
            {
              "name": "valor",
              "value": "={{$json.ai.value}}"
            },
            {
              "name": "tipo",
              "value": "={{$json.ai.type}}"
            },
            {
              "name": "descricao",
              "value": "={{$json.ai.description}}"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 🎯 Resumo Rápido

1. **Gere a key:** `python -m scripts.create_system_key --user-id <uuid>`
2. **Salve a key:** Copie e guarde em local seguro
3. **Configure N8N:** Adicione `ZAPGASTOS_API_KEY` no .env
4. **Use nos nodes:** Header `X-API-Key: {{$env.ZAPGASTOS_API_KEY}}`
5. **Envie requests:** Inclua `telefone` no body para identificar usuário

✅ **Pronto!** Seu N8N está integrado ao ZapGastos com autenticação segura.
