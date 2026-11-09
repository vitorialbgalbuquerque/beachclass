# Site Beach Class (BC01)

Dois endereços, mesmo banco de dados:

- `index.html`  página pública do hóspede: calendário de dias livres e botão de WhatsApp. Só leitura.
- `painel.html` painel de vocês, com e-mail e senha: calendário, reservas, bloqueios, diárias por temporada, limpeza fixa e finanças.

O hóspede nunca vê nomes, valores ou pagamentos. Ele só chama uma função que devolve flat e datas ocupadas.
Sem login, ninguém consegue editar nada.

Abrindo os arquivos agora, sem configurar nada, o site roda em MODO DEMONSTRAÇÃO (dados de exemplo, só no seu navegador).

## Passo a passo para colocar no ar (cerca de 15 minutos, tudo gratuito)

### 1. Banco de dados e login (Supabase)
1. Crie uma conta em supabase.com e um projeto novo (região São Paulo). Anote a senha do banco.
2. Menu SQL Editor > New query > cole o conteúdo de `supabase/setup.sql` > Run.
3. Menu Authentication > Sign In / Providers: desligue "Allow new users to sign up" (assim ninguém além de vocês cria conta).
4. Authentication > Users > Add user > Create new user: crie um usuário para você e outro para o Eduardo (e-mail e senha, marque "Auto Confirm User").
5. Settings > API: copie o "Project URL" e a chave "anon public".

### 2. Configurar
Abra `config.js` e cole as duas informações em SUPABASE_URL e SUPABASE_ANON_KEY.
A chave anon pode ficar no site: ela não dá acesso às reservas, a segurança está nas regras do passo 1.

### 3. Publicar (Netlify)
1. Crie conta em netlify.com > Add new site > Deploy manually.
2. Arraste a pasta `site` inteira para a área indicada.
3. O Netlify gera um endereço. A página dos hóspedes é a raiz, o painel é `/painel.html`.
4. Opcional: em Domain management, troque o nome (ex.: beachclass01.netlify.app) ou conecte um domínio próprio.

### 4. Usar
Entre em `/painel.html` com o e-mail e a senha criados. Preencha a aba Diárias (diária base, limpeza e temporadas) antes de lançar reservas.
Cada reserva ou bloqueio que vocês lançam aparece na hora na página dos hóspedes.

## Segurança em uma linha
Tabelas protegidas por login (RLS). O público só executa `availability()`, que devolve apenas flat e datas.
