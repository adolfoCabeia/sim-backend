# Integração — Ação Social

## 1. Migração
1. Acrescentem os modelos de `prisma-schema-acao-social.prisma` ao `schema.prisma`.
2. Confirmem que `Direcao` e `Utilizador` já existem (reaproveitados, tal como nos módulos de Logística e RH).
3. `npx prisma migrate dev --name acao_social`

## 2. Permissões novas — propositadamente granulares
Este módulo tem mais permissões do que os anteriores porque a sensibilidade
varia muito dentro dele. Não simplifiquem para uma permissão só —
é isso que permite dar acesso aos casos sensíveis a duas ou três pessoas
específicas, sem lhes dar automaticamente acesso a tudo o resto (ou
vice-versa).

| Permissão | Para quê |
|---|---|
| `acao-social:centros:consultar` / `:gerir` | Centros de acolhimento |
| `acao-social:beneficiarios:consultar` / `:gerir` | Cadastro geral de beneficiários e zonas sensíveis |
| `acao-social:casos-sensiveis:consultar` | Ver casos sensíveis (crianças em risco) — atribuir com critério |
| `acao-social:casos-sensiveis:gerir` | Criar/editar casos sensíveis |
| `acao-social:casos-sensiveis:auditoria` | Ver quem acedeu a um caso — recomendo dar só à supervisão, **não** à mesma equipa operacional |
| `acao-social:casos-sensiveis:eliminados` | Ver/restaurar casos eliminados (soft delete) — ainda mais restrita do que `:auditoria` |
| `acao-social:pedidos:consultar` / `:resolver` | Pedidos de microcrédito/habitação/idoso/cesta básica |
| `acao-social:distribuicao:consultar` / `:gerir` | Distribuição de kits |
| `acao-social:programas:gerir` | Programas sociais e inscrições |
| `acao-social:indicadores:consultar` | Painel agregado |

## 3. Rotas a registar

```typescript
// Centros
app.post("/acao-social/centros", { ...criarCentroDocs, preHandler: [autenticar, autorizar("acao-social:centros:gerir")] }, criarCentroController);
app.get("/acao-social/centros/:id", { ...obterCentroDocs, preHandler: [autenticar, autorizar("acao-social:centros:consultar")] }, obterCentroController);
app.patch("/acao-social/centros/:id", { ...atualizarCentroDocs, preHandler: [autenticar, autorizar("acao-social:centros:gerir")] }, atualizarCentroController);
app.get("/acao-social/centros", { ...listarCentrosDocs, preHandler: [autenticar, autorizar("acao-social:centros:consultar")] }, listarCentrosController);

// Zonas sensíveis + beneficiários
app.post("/acao-social/zonas-sensiveis", { ...criarZonaSensivelDocs, preHandler: [autenticar, autorizar("acao-social:beneficiarios:gerir")] }, criarZonaSensivelController);
app.get("/acao-social/zonas-sensiveis", { ...listarZonasSensiveisDocs, preHandler: [autenticar, autorizar("acao-social:beneficiarios:consultar")] }, listarZonasSensiveisController);
app.post("/acao-social/beneficiarios", { ...criarBeneficiarioDocs, preHandler: [autenticar, autorizar("acao-social:beneficiarios:gerir")] }, criarBeneficiarioController);
app.get("/acao-social/beneficiarios/:id", { ...obterBeneficiarioDocs, preHandler: [autenticar, autorizar("acao-social:beneficiarios:consultar")] }, obterBeneficiarioController);
app.patch("/acao-social/beneficiarios/:id", { ...atualizarBeneficiarioDocs, preHandler: [autenticar, autorizar("acao-social:beneficiarios:gerir")] }, atualizarBeneficiarioController);
app.get("/acao-social/beneficiarios", { ...listarBeneficiariosDocs, preHandler: [autenticar, autorizar("acao-social:beneficiarios:consultar")] }, listarBeneficiariosController);

// Casos sensíveis — reparem que cada rota tem a SUA permissão própria
app.post("/acao-social/casos-sensiveis", { ...criarCasoSensivelDocs, preHandler: [autenticar, autorizar("acao-social:casos-sensiveis:gerir")] }, criarCasoSensivelController);
app.get("/acao-social/casos-sensiveis/:id", { ...obterCasoSensivelDocs, preHandler: [autenticar, autorizar("acao-social:casos-sensiveis:consultar")] }, obterCasoSensivelController);
app.patch("/acao-social/casos-sensiveis/:id", { ...atualizarCasoSensivelDocs, preHandler: [autenticar, autorizar("acao-social:casos-sensiveis:gerir")] }, atualizarCasoSensivelController);
app.get("/acao-social/casos-sensiveis", { ...listarCasosSensiveisDocs, preHandler: [autenticar, autorizar("acao-social:casos-sensiveis:consultar")] }, listarCasosSensiveisController);
app.get("/acao-social/casos-sensiveis/:id/acessos", { ...listarAcessosDoCasoDocs, preHandler: [autenticar, autorizar("acao-social:casos-sensiveis:auditoria")] }, listarAcessosDoCasoController);
app.delete("/acao-social/casos-sensiveis/:id", { ...eliminarCasoSensivelDocs, preHandler: [autenticar, autorizar("acao-social:casos-sensiveis:gerir")] }, eliminarCasoSensivelController);
app.post("/acao-social/casos-sensiveis/:id/restaurar", { ...restaurarCasoSensivelDocs, preHandler: [autenticar, autorizar("acao-social:casos-sensiveis:eliminados")] }, restaurarCasoSensivelController);
app.get("/acao-social/casos-sensiveis/eliminados", { ...listarCasosSensiveisEliminadosDocs, preHandler: [autenticar, autorizar("acao-social:casos-sensiveis:eliminados")] }, listarCasosSensiveisEliminadosController);

// Pedidos de apoio
app.post("/acao-social/pedidos", { ...criarPedidoApoioDocs, preHandler: [autenticar, autorizar("acao-social:pedidos:consultar")] }, criarPedidoApoioController);
app.get("/acao-social/pedidos/:id", { ...obterPedidoApoioDocs, preHandler: [autenticar, autorizar("acao-social:pedidos:consultar")] }, obterPedidoApoioController);
app.post("/acao-social/pedidos/:id/resolver", { ...resolverPedidoApoioDocs, preHandler: [autenticar, autorizar("acao-social:pedidos:resolver")] }, resolverPedidoApoioController);
app.post("/acao-social/pedidos/:id/cancelar", { ...cancelarPedidoApoioDocs, preHandler: [autenticar, autorizar("acao-social:pedidos:resolver")] }, cancelarPedidoApoioController);
app.get("/acao-social/pedidos", { ...listarPedidosApoioDocs, preHandler: [autenticar, autorizar("acao-social:pedidos:consultar")] }, listarPedidosApoioController);

// Distribuição de kits
app.post("/acao-social/distribuicoes", { ...criarDistribuicaoKitDocs, preHandler: [autenticar, autorizar("acao-social:distribuicao:gerir")] }, criarDistribuicaoKitController);
app.get("/acao-social/distribuicoes", { ...listarDistribuicoesDocs, preHandler: [autenticar, autorizar("acao-social:distribuicao:consultar")] }, listarDistribuicoesController);

// Programas
app.post("/acao-social/programas", { ...criarProgramaDocs, preHandler: [autenticar, autorizar("acao-social:programas:gerir")] }, criarProgramaController);
app.get("/acao-social/programas/:id", { ...obterProgramaDocs, preHandler: [autenticar, autorizar("acao-social:programas:gerir")] }, obterProgramaController);
app.patch("/acao-social/programas/:id", { ...atualizarProgramaDocs, preHandler: [autenticar, autorizar("acao-social:programas:gerir")] }, atualizarProgramaController);
app.post("/acao-social/programas/:id/participantes", { ...inscreverParticipanteDocs, preHandler: [autenticar, autorizar("acao-social:programas:gerir")] }, inscreverParticipanteController);
app.delete("/acao-social/programas/:id/participantes/:participanteId", { ...removerParticipanteDocs, preHandler: [autenticar, autorizar("acao-social:programas:gerir")] }, removerParticipanteController);
app.get("/acao-social/programas", { ...listarProgramasDocs, preHandler: [autenticar, autorizar("acao-social:programas:gerir")] }, listarProgramasController);

// Indicadores
app.get("/acao-social/indicadores", { ...obterIndicadoresDocs, preHandler: [autenticar, autorizar("acao-social:indicadores:consultar")] }, obterIndicadoresController);
```

## 4. Regras de negócio aplicadas
| Regra | Onde |
|---|---|
| Ocupação de um centro não pode exceder a capacidade máxima | `centro.service.ts` |
| Zona sensível referenciada num beneficiário tem de existir | `beneficiario.service.ts` |
| **Nenhuma leitura de caso sensível sem gravar auditoria** | `caso-sensivel.service.ts` — ver o comentário no topo do ficheiro |
| Listagem de casos sensíveis audita cada item devolvido, não só o pedido | `listarCasosSensiveis` |
| Pedido de apoio só resolvido uma vez (EM_ANALISE → DEFERIDO/INDEFERIDO) | `pedido-apoio.service.ts` |
| Indeferimento exige motivo | `resolverPedidoApoioSchema` |
| Participante não se inscreve duas vezes no mesmo programa | `@@unique([programaId, beneficiarioId])` + `inscreverParticipante` |
| Indicadores nunca expõem descrição/identidade de casos sensíveis, só contagens | `indicadores.service.ts` |

## 5. Pontos em aberto — importantes, não são só notas de rodapé

### 5.1 Integração com a Logística (o problema de rutura que mencionaste)
`DistribuicaoKit.requisicaoId` é uma ligação leve e opcional — este módulo
**regista** a distribuição, mas não decrementa stock nem gera
automaticamente uma requisição de reposição. Para fechar o ciclo (o
verdadeiro objectivo da secção 8.3.3), preciso de ver o vosso model real
de `Requisicao`/stock da Logística. Duas formas típicas de o fazer, quando
partilharem esse schema:
- Decrementar stock na mesma transacção da distribuição (falha tudo junto
  se não houver kits suficientes).
- Gerar automaticamente uma `Requisicao` de reposição quando o stock cair
  abaixo de um limiar — isto é o que efectivamente previne a rutura por
  falta de planeamento.

### 5.2 Cifra em repouso de `CasoSensivel.descricao` — implementada

**Nota sobre argon2**: argon2 é uma função de hash de sentido único — ótima
para passwords (nunca se precisa do valor original de volta, só comparar),
mas **não reversível**. Uma descrição de caso tem de poder ser lida de
volta por quem tem permissão, por isso usei **AES-256-GCM** (cifra
simétrica, reversível, autenticada) em vez de argon2. Fica no ficheiro
`seguranca/campo-cifrado.ts` — **sem dependência nova**, usa só o módulo
`node:crypto` nativo.

O que muda no schema: `descricao` → `descricaoCifrada`, `encaminhadoPara`
→ `encaminhadoParaCifrado` (ambos `@db.Text`, guardam o valor já cifrado).
A API continua a falar em texto simples — `criarCasoSensivelSchema`,
`atualizarCasoSensivelSchema` e as respostas HTTP não mudaram nada; a
cifra/decifra acontece só dentro de `caso-sensivel.service.ts`.

**Antes de correr a migração, gerem a chave:**
```bash
openssl rand -base64 32
```
Guardem o resultado como `CIFRA_CAMPOS_SENSIVEIS_CHAVE` — **nunca no
`.env` versionado**. Para a vossa EC2 + Docker, a forma mais simples de
começar é um ficheiro `.env` fora do git, referenciado no
`docker-compose.yml` como `${CIFRA_CAMPOS_SENSIVEIS_CHAVE}`; para
produção a sério, AWS Secrets Manager é o próximo passo natural. Se
perderem esta chave, os dados cifrados ficam irrecuperáveis — não há
"esqueci a password" para isto.

### 5.3 Soft delete — implementado
`eliminarCasoSensivel` nunca faz `DELETE`: marca `eliminadoEm` +
`eliminadoPorId` + `motivoEliminacao` (motivo sempre obrigatório), e o
caso desaparece das listagens/leituras normais mas continua na base de
dados, auditável e restaurável (`restaurarCasoSensivel`). Ver casos
eliminados exige uma permissão à parte, `acao-social:casos-sensiveis:eliminados`
— mais restrita ainda do que `:auditoria`, porque combina duas coisas
sensíveis (o conteúdo do caso + o facto de ter sido eliminado).

Ainda não há prazo de retenção automático (isso mantém-se em aberto,
ver 5.3 original abaixo) — o soft delete resolve "não apagar por engano
ou political pressure", não "apagar ao fim de X anos por política".

### 5.4 Retenção e direito ao apagamento (ainda em aberto)

### 5.5 Quem tem `acao-social:casos-sensiveis:*`
Tecnicamente as permissões existem; a decisão de A QUEM as atribuir é
operacional. Sugiro fortemente que `:auditoria` e `:eliminados` nunca
sejam dadas às mesmas pessoas que têm `:consultar`/`:gerir` — senão a
auditoria não serve de controlo, só de registo.

## 6. Duas coisas que reparei no vosso schema completo

1. **`Documento` ainda não tem `municipioId`** — é o mesmo problema que
   sinalizei quando construímos esse módulo (isolamento multi-tenant).
   Se ainda não aplicaram essa correção, convém fazê-lo antes de irem
   para produção; os dados nesse módulo ainda não têm garantia de
   isolamento por município a nível de schema.
2. **Agora vejo `RequisicaoLogistica`** com o schema completo (categoria
   BEM/SERVICO/EMPREITADA, itens, anexos). Isto é exactamente o que
   faltava para fechar o TODO da secção 5.1 (ligar `DistribuicaoKit` ao
   stock real e prevenir a rutura de cesta básica por falta de
   planeamento). Se quiserem, faço essa integração a seguir — dá para
   decrementar stock na distribuição e/ou gerar automaticamente uma
   requisição de reposição quando o stock cair abaixo do limiar.
