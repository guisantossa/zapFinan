-- ZapGastos - Schema Simplificado (Sem Planos e Pagamentos)

DROP TABLE IF EXISTS categories CASCADE;
-- Tabela de Categorias
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('despesa', 'receita'))
);

-- Insere categorias padrão
INSERT INTO categories (nome, tipo) VALUES
  -- 🧾 Despesas
  ('🛒 Mercado', 'despesa'),
  ('🥗 Alimentação', 'despesa'),
  ('🚗 Automóvel', 'despesa'),
  ('🎉 Lazer', 'despesa'),
  ('📺 Contas a Pagar', 'despesa'),
  ('📚 Educação', 'despesa'),
  ('💊 Saúde', 'despesa'),
  ('🏋️ Academia', 'despesa'),
  ('🐶 Pets', 'despesa'),
  ('📄 Aluguéis', 'despesa'),
  ('🎁 Presentes', 'despesa'),
  ('📌 Outros', 'despesa'),

  -- 💰 Receitas
  ('💼 Salário', 'receita'),
  ('🏦 Rendimentos', 'receita'),
  ('💵 Renda Extra', 'receita'),
  ('💳 Reembolso', 'receita'),
  ('📌 Outras', 'receita');

DROP TABLE IF EXISTS users CASCADE;
-- Tabela de Usuários (Simplificada)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senha VARCHAR(255) NOT NULL, -- Senha criptografada
    telefone VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100),
    email VARCHAR(100),
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    token UUID DEFAULT gen_random_uuid()
);

-- Insere um usuário de teste
INSERT INTO users (senha, telefone, nome, email)
VALUES (
  '$2b$12$1kOPLMx83g0vMEzEUJHeHuupFL5/8tC/b5Ge91nvfmPNVlgZIhvWO', -- Senha: 'minhasenhasecreta'
  '5521999839393',
  'Guilherme Sá',
  'gui.santos.sa@gmail.com'
);

DROP TABLE IF EXISTS transactions CASCADE;
-- Tabela de Transações (Despesas e Receitas)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mensagem_original TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('despesa', 'receita')),
    canal VARCHAR(20) CHECK (canal IN ('audioMessage', 'conversation', 'imageMessage')),
    categoria_id INTEGER REFERENCES categories(id),
    data_transacao DATE DEFAULT CURRENT_DATE,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS reports CASCADE;
-- Tabela de Relatórios
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL, -- 'mensal', 'semanal', 'anual'
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    total_receitas NUMERIC(10,2) DEFAULT 0,
    total_despesas NUMERIC(10,2) DEFAULT 0,
    saldo NUMERIC(10,2) DEFAULT 0,
    enviado_whatsapp BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_transactions_usuario_data ON transactions(usuario_id, data_transacao);
CREATE INDEX idx_transactions_categoria ON transactions(categoria_id);
CREATE INDEX idx_reports_usuario_periodo ON reports(usuario_id, periodo_inicio, periodo_fim);