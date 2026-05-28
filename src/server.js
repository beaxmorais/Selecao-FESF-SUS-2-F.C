const crypto = require("crypto");
const express = require("express");
const session = require("express-session");

const app = express();
const remindersByUser = new Map();

const config = {
  port: Number(process.env.PORT || 3000),
  sessionSecret: process.env.SESSION_SECRET || "troque-este-segredo",
  authUser: process.env.AUTH_USER || "demo",
  authPassword: process.env.AUTH_PASSWORD || "demo123"
};

function escapeHtml(value) {
  return String(value).replace(/[<>&"]/g, (char) => {
    const entities = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
    return entities[char];
  });
}

function safeCompare(value, expected) {
  const valueBuffer = Buffer.from(String(value));
  const expectedBuffer = Buffer.from(String(expected));

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function authenticateUser(username, password) {
  return safeCompare(username, config.authUser) && safeCompare(password, config.authPassword);
}

function page(title, body) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, Arial, Helvetica, sans-serif;
      background: #f3f4f6;
      color: #111827;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      font-size: 14px;
    }

    main {
      width: min(820px, 100%);
    }

    h1 {
      font-size: 24px;
      margin-top: 0;
      color: #111827;
    }

    h2 {
      font-size: 18px;
      margin: 0;
    }

    a,
    button {
      border: 0;
      border-radius: 10px;
      background: #2563eb;
      color: #ffffff;
      cursor: pointer;
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      padding: 10px 14px;
      text-decoration: none;
    }

    form {
      display: flex;
      gap: 10px;
      margin: 0;
    }

    input {
      border: 1px solid #d1d5db;
      border-radius: 10px;
      flex: 1;
      font-size: 14px;
      padding: 12px 16px;
    }

    label {
      display: grid;
      font-weight: 700;
      gap: 6px;
    }

    .hint {
      background: #fff8df;
      border: 1px solid #ffe08a;
      border-radius: 14px;
      padding: 12px 14px;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      box-shadow: 0 18px 45px rgba(17, 24, 39, 0.08);
      margin-top: 16px;
      padding: 24px;
    }

    .topbar {
      align-items: center;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .login-form {
      align-items: stretch;
      flex-direction: column;
    }

    .error {
      background: #ffecec;
      border: 1px solid #ffb8b8;
      border-radius: 14px;
      color: #8a1f1f;
      padding: 12px 14px;
    }

    .add-form {
      align-items: center;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }

    .task-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 16px;
    }

    .task-header {
      align-items: flex-start;
      display: flex;
      gap: 16px;
      justify-content: space-between;
    }

    .task-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
    }

    .task-meta {
      color: #6b7280;
      font-size: 12px;
      margin: 6px 0 0;
    }

    .status {
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 10px;
      white-space: nowrap;
    }

    .status.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .task-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .secondary {
      background: #eef2ff;
      color: #3730a3;
    }

    .danger {
      background: #fee2e2;
      color: #991b1b;
    }

    .empty {
      color: #6b7280;
      margin: 0;
      text-align: center;
    }

    @media (max-width: 640px) {
      .add-form,
      .task-header,
      .topbar {
        align-items: stretch;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }

  return next();
}

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/lembretes");
  }

  const errorMessage = req.query.error ? '<p class="error">Usuario ou senha invalidos.</p>' : "";

  return res.send(
    page(
      "Login - Lembretes",
      `<section class="card">
        <h1>Lembretes com Login</h1>
        <p>Entre para acessar sua area protegida e adicionar lembretes.</p>
        ${errorMessage}
        <form class="login-form" method="post" action="/login">
          <label>
            Usuario
            <input name="username" autocomplete="username" required autofocus>
          </label>
          <label>
            Senha
            <input name="password" type="password" autocomplete="current-password" required>
          </label>
          <button type="submit">Entrar</button>
        </form>
      </section>`
    )
  );
});

app.post("/login", (req, res, next) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!authenticateUser(username, password)) {
    return res.redirect("/?error=1");
  }

  return req.session.regenerate((error) => {
    if (error) {
      return next(error);
    }

    req.session.user = {
      id: username,
      name: username
    };

    return res.redirect("/lembretes");
  });
});

app.get("/lembretes", requireLogin, (req, res) => {
  const userKey = req.session.user.id;
  const reminders = remindersByUser.get(userKey) || [];
  const reminderItems = reminders.length
    ? reminders
        .map((reminder, index) => {
          const text = typeof reminder === "string" ? reminder : reminder.text;
          const createdAt = typeof reminder === "string" ? new Date() : new Date(reminder.createdAt);

          return `<article class="task-item">
            <div class="task-header">
              <div>
                <p class="task-title">${escapeHtml(text)}</p>
                <p class="task-meta">Criado em ${createdAt.toLocaleString("pt-BR")}</p>
              </div>
              <span class="status pending">Pendente</span>
            </div>
            <div class="task-actions">
              <form method="post" action="/lembretes/${index}/excluir">
                <button class="danger" type="submit">Excluir</button>
              </form>
            </div>
          </article>`;
        })
        .join("")
    : '<p class="empty">Nenhum lembrete cadastrado ainda.</p>';

  return res.send(
    page(
      "Meus Lembretes",
      `<section class="card">
        <div class="topbar">
          <div>
            <h1>Meus Lembretes</h1>
            <p>Ola, <strong>${escapeHtml(req.session.user.name)}</strong>. Aqui voce pode apenas adicionar lembretes.</p>
          </div>
          <a href="/logout">Sair</a>
        </div>
        <form class="add-form" method="post" action="/lembretes">
          <input name="text" maxlength="120" placeholder="Digite um lembrete" required autofocus>
          <button type="submit">Adicionar</button>
        </form>
      </section>

      <section class="card">
        <h2>Lista de lembretes</h2>
        <div class="task-list">${reminderItems}</div>
      </section>`
    )
  );
});

app.post("/lembretes", requireLogin, (req, res) => {
  const text = String(req.body.text || "").trim();

  if (text) {
    const userKey = req.session.user.id;
    const reminders = remindersByUser.get(userKey) || [];
    reminders.push({
      text,
      createdAt: new Date().toISOString()
    });
    remindersByUser.set(userKey, reminders);
  }

  return res.redirect("/lembretes");
});

app.post("/lembretes/:index/excluir", requireLogin, (req, res) => {
  const userKey = req.session.user.id;
  const reminders = remindersByUser.get(userKey) || [];
  const index = Number(req.params.index);

  if (Number.isInteger(index) && index >= 0 && index < reminders.length) {
    reminders.splice(index, 1);
    remindersByUser.set(userKey, reminders);
  }

  return res.redirect("/lembretes");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send("Erro interno da aplicacao.");
});

app.listen(config.port, () => {
  console.log(`Aplicacao rodando em http://localhost:${config.port}`);
});
