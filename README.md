# Lembretes com Login

Projeto simples com tela de login e uma area protegida onde o usuario pode apenas adicionar lembretes para comprovar conhecimentos do Item 02 – BAREMA. Os lembretes ficam salvos apenas em memoria. Ao reiniciar o container, a lista de lembretes e apagada. Isso mantem o projeto simples e focado em autenticacao propria com sessao e Docker.

## Requisitos atendidos

- Aplicacao funcional em Node.js/Express.
- Conteinerizacao com `Dockerfile`.
- Execucao com `docker-compose.yml`.
- Login proprio com sessao usando `express-session`.
- Usuario padrao documentado para teste.

## Login padrao

Use este unico usuario da aplicacao na tela de login:

- Usuario: `demo`
- Senha: `demo123`

## Como executar

Execute:

```bash
docker compose up --build
```

Depois acesse:

- Aplicacao: http://localhost:3000

## Como testar

1. Abra http://localhost:3000.
2. Entre com o usuario `demo` e a senha `demo123`.
4. Apos o login, voce sera redirecionado para a tela de lembretes.
5. Digite um lembrete e clique em **Adicionar**.
6. Use **Sair** para encerrar a sessao.

## Arquivos principais

- `Dockerfile`: cria a imagem da aplicacao.
- `docker-compose.yml`: sobe a aplicacao.
- `src/server.js`: implementa login proprio, sessao e lembretes.
