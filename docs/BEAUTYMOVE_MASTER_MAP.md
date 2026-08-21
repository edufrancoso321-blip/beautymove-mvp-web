# BeautyMove — Mapa Mestre de Desenvolvimento

> Rota oficial do projeto. O mapa é comparado com o estado real do GitHub e atualizado após cada etapa finalizada e validada.

## Regras de controle

**Implementar → Testar → Validar → Registrar → Avançar.**

- 🟢 CONCLUÍDO E VALIDADO
- 🟡 EXISTE / PARCIAL / PRECISA VALIDAÇÃO
- 🟠 EM DESENVOLVIMENTO
- 🔴 PENDÊNCIA / CORREÇÃO
- ⚪ NÃO INICIADO
- 🔵 PLANEJADO / DEPENDÊNCIA FUTURA
- ⛔ BLOQUEADO

Uma tela ou arquivo existente **não** é considerado funcionalidade concluída. Para 🟢, a função precisa estar implementada, persistir corretamente quando aplicável, respeitar permissões, passar teste funcional e, quando aplicável, teste de segurança/regressão.

## Fonte de verdade do mapa

- Repositório: `edufrancoso321-blip/beautymove-mvp-web`
- Branch de referência desta fotografia: `main`
- Último commit auditado: `1f5078546150207c228b77206e954326d6bdd048`
- Data da fotografia: 2026-08-21
- Estado do código: GitHub é a referência do código versionado.
- Se uma alteração estiver somente no Lovable/Preview e ainda não estiver sincronizada no GitHub, ela **não entra como concluída** no mapa.

## Posição atual — AUDITORIA BASELINE

**Etapa atual:** 01. FUNDAÇÃO

**Subetapa de maior risco:** 01.2 Banco de dados / persistência

**Ponto técnico atual:** o projeto usa Firebase Authentication + Cloud Firestore como backend documentado, mas a Agenda ainda possui persistência operacional em `localStorage` e várias camadas de Agenda. A fundação precisa consolidar uma única fonte de verdade antes de considerar a Agenda pronta para produção.

**Regra de progresso:** os percentuais abaixo são **progresso validado contra o repositório**, não quantidade de código nem quantidade de telas. Onde a auditoria ainda não permite concluir, o item permanece 🟡/🔴 e não recebe crédito de conclusão.

---

# 01. FUNDAÇÃO

## 01.1 Arquitetura — 🟡 PARCIAL

- 🟢 Estrutura de páginas estáticas
- 🟢 Separação inicial por papel: salão / profissional / cliente
- 🟢 Firebase como backend documentado
- 🟡 Fronteira/adaptador de dados precisa ser consolidada
- 🟡 Agenda possui múltiplas camadas de JS/CSS com responsabilidade sobreposta
- 🔴 Arquitetura operacional única ainda não consolidada

**Progresso validado:** 50%

## 01.2 Banco de dados / persistência — 🟡 PARCIAL — PONTO ATUAL

Contrato de dados documentado:

- 🟢 `users/{uid}`
- 🟢 `salons/{salonId}`
- 🟢 `professionals/{professionalId}`
- 🟢 `clients/{clientId}`
- 🟢 `appointments/{appointmentId}`
- 🟢 `opportunities/{opportunityId}`
- 🟢 `transactions/{transactionId}`
- 🟡 Regras de integridade de campos precisam ser consolidadas
- 🟡 Relações entre entidades precisam ser validadas ponta a ponta
- 🔴 Agenda ainda grava estado operacional em `localStorage`
- 🔴 Fonte única de verdade da Agenda ainda não está consolidada
- 🔴 Teste real de persistência compartilhada ainda não está registrado no GitHub

**Progresso validado:** 50%

## 01.3 Autenticação — 🟡 PARCIAL

- 🟢 Cadastro com Firebase Auth
- 🟢 Login com Firebase Auth
- 🟢 Persistência de sessão Firebase
- 🟢 Recuperação/restauração de sessão implementada
- 🟡 Recuperação de senha não está evidenciada na rota atual
- 🟡 Verificação de e-mail não está evidenciada como fluxo concluído
- 🟡 Testes negativos/abuso precisam ser validados

**Progresso validado:** 55%

## 01.4 Autorização / papéis — 🟡 PARCIAL

- 🟢 Papéis `salao`, `profissional`, `cliente`
- 🟢 Login pode validar o papel esperado
- 🟢 Regras Firestore usam papel em oportunidades
- 🟡 Controle de alteração indevida de papel precisa de teste dedicado
- 🟡 Proteção de todas as rotas precisa de regressão completa

**Progresso validado:** 60%

## 01.5 Segurança — 🟡 PARCIAL

- 🟢 Firestore Security Rules versionadas
- 🟢 Regras baseadas em `request.auth` e ownership
- 🟡 S.O.S. e Agenda precisam de testes de acesso cruzado
- 🟡 Validação de campos nas Rules precisa ser endurecida onde necessário
- 🔴 Auditoria final de segurança ainda não executada
- 🔴 Testes automatizados das Rules ainda não evidenciados

**Progresso validado:** 45%

## 01.6 Qualidade da base — 🟡 PARCIAL

- 🟢 GitHub Actions de qualidade existentes
- 🟢 Controle de versões por commit
- 🟡 Quality workflow atualmente não substitui testes funcionais de navegador
- 🔴 Cobertura E2E/regressão ainda insuficiente

**Progresso validado:** 45%

### 📍 PONTO DE PARADA OFICIAL

**01.2 BANCO DE DADOS / PERSISTÊNCIA**

Antes de avançar estruturalmente, devemos consolidar a persistência da Agenda e validar a relação entre Firestore, estado local e fluxos de S.O.S./agendamento.

---

# 02. ÁREA PÚBLICA

## 02.1 Página inicial — 🟡
- 🟢 `index.html` existe
- 🟢 CTA para entrada/cadastro existe
- 🟡 Fluxo completo ainda precisa de teste E2E

## 02.2 Login — 🟡
- 🟢 `login.html` existe
- 🟢 Firebase Auth conectado
- 🟡 Fluxos de erro/recuperação precisam de validação completa

## 02.3 Cadastro — 🟡
- 🟢 `cadastro.html` existe
- 🟢 Cadastro por perfil
- 🟢 Especialidades iniciais presentes
- 🟡 Persistência e onboarding completo precisam de validação

**Progresso da etapa:** 60% validado

---

# 03. IDENTIDADE DO USUÁRIO

## 03.1 Escolha de perfil — 🟢 EXISTE / 🟡 NÃO VALIDADO COMPLETAMENTE
- 🟢 Salão
- 🟢 Profissional
- 🟢 Cliente

## 03.2 Onboarding — 🟡
- 🟢 Dados básicos
- 🟢 Especialidade no cadastro profissional
- 🟡 Dados específicos completos por papel ainda precisam ser fechados

## 03.3 Troca de perfil — 🔴
- 🔴 Regra de troca/bloqueio precisa de validação formal

**Progresso da etapa:** 55% validado

---

# 04. AGENDA — CORAÇÃO OPERACIONAL

> A Agenda é um núcleo do produto, não apenas uma página.

## 04.1 Motor de agenda — 🟡
- 🟢 Grade visual
- 🟢 Navegação por data
- 🟢 Intervalos de 30/45/60 min
- 🟢 Horário configurável por dia
- 🟡 Regras de conflito precisam ser validadas no backend
- 🔴 Persistência operacional ainda usa `localStorage` no controlador principal

## 04.2 Disponibilidade — 🟡
- 🟢 Configuração de horários da agenda
- 🟡 Disponibilidade real do profissional ainda precisa de fonte compartilhada
- 🔴 Exceções/bloqueios robustos ainda não validados

## 04.3 Serviços — 🟡
- 🟢 Catálogo visual
- 🟢 Nome, especialidade, preço, duração, ativo/inativo
- 🟡 Persistência compartilhada precisa ser validada

## 04.4 Especialidades — 🟡
- 🟢 Especialidades aparecem em cadastro e Agenda
- 🟡 Relação profissional ↔ especialidade ↔ serviço precisa ser consolidada

## 04.5 Horários — 🟡
- 🟢 Geração de slots
- 🟢 Horário inicial/final configurável
- 🔴 Reserva atômica contra dupla marcação ainda não validada

## 04.6 Agendamentos — 🟡
- 🟢 Criar/editar/visualizar na UI
- 🟢 Cliente/profissional/serviço/status presentes
- 🟡 Persistência compartilhada precisa ser consolidada

## 04.7 Status — 🟡
- 🟢 Agendado
- 🟢 Em andamento
- 🟢 Finalizado
- 🟢 Cancelado
- 🟡 Máquina de estados definitiva ainda precisa ser formalizada

## 04.8 Conflitos — 🔴
- 🔴 Não considerar a validação visual suficiente
- 🔴 Bloqueio transacional/servidor ainda precisa ser construído e testado

**Progresso da etapa:** 40% validado

---

# 05. S.O.S. — NÚCLEO DIFERENCIAL

## 05.1 Criação — 🟢 EXISTE / 🟡 PARCIAL
- 🟢 Especialidade
- 🟢 Serviço
- 🟢 Data
- 🟢 Horário
- 🟢 Duração
- 🟢 Raio
- 🟢 Observações

## 05.2 Matching — 🟡
- 🟢 Lista/seleção visual de profissionais
- 🟡 Matching real por disponibilidade/especialidade ainda não consolidado
- 🔴 Geolocalização real ainda não implementada

## 05.3 Interesse — 🟡
- 🟢 Fluxo de interesse existe no MVP
- 🟡 Persistência compartilhada precisa ser validada

## 05.4 Seleção pelo salão — 🟡
- 🟢 Conceito e interface presentes
- 🟡 Conversão real precisa ser validada

## 05.5 S.O.S. → Agenda — 🔴
- 🔴 Conversão robusta e atômica ainda não validada
- 🔴 Conflito de horário ainda não garantido no backend

## 05.6 Estados do S.O.S. — 🟡
- 🟢 Aberto / aceito / encerrado aparecem no código
- 🟡 Máquina de estados definitiva precisa ser formalizada

## 05.7 Segurança do S.O.S. — 🟡
- 🟢 Rules existentes
- 🔴 Testes de acesso por papel ainda não concluídos

**Progresso da etapa:** 35% validado

---

# 06. SALÃO

## 06.1 Cadastro — 🟢 EXISTE / 🟡 VALIDAR COMPLETO
- 🟢 Responsável
- 🟢 Nome
- 🟢 Telefone
- 🟢 Endereço
- 🟡 CEP precisa ser confirmado no fluxo atual

## 06.2 Perfil — 🟡
- 🟢 Dados básicos
- 🟡 Perfil operacional completo precisa de validação

## 06.3 Agenda — 🟡
- 🟢 Interface forte e integrada ao S.O.S.
- 🔴 Backend compartilhado ainda não consolidado

## 06.4 Serviços — 🟢 EXISTE / 🟡 PERSISTÊNCIA
- 🟢 Cadastro
- 🟢 Preço
- 🟢 Duração
- 🟢 Oferta profissional
- 🟢 Ativo/inativo
- 🟡 Persistência/integração com Agenda precisa de validação

## 06.5 Profissionais — 🟡
- 🟢 Filtro/listagem inicial
- 🟡 Cadastro/associação real ainda precisa ser fechado

## 06.6 S.O.S. — 🟢 UI / 🟡 FLUXO
- 🟢 Tela dedicada
- 🟢 Integração visual com Agenda
- 🟡 Backend/matching ainda incompleto

## 06.7 Clientes — 🔴
- 🔴 Tela operacional completa ainda não implementada

**Progresso da etapa:** 45% validado

---

# 07. PROFISSIONAL

## 07.1 Perfil — 🟡
## 07.2 Especialidades — 🟡
## 07.3 Serviços executados — 🟡
## 07.4 Disponibilidade — 🔴
## 07.5 Agenda — 🟡
## 07.6 S.O.S. — 🟡

O dashboard profissional existe e já apresenta oportunidades, agenda e financeiro simples, mas ainda depende do estado local para parte relevante do fluxo.

**Progresso da etapa:** 35% validado

---

# 08. CLIENTE

## 08.1 Perfil — 🟡
## 08.2 Busca — 🟢 UI / 🟡 DADOS
## 08.3 Escolha — 🟢 UI / 🟡 DISPONIBILIDADE REAL
## 08.4 Agendamento — 🟡
## 08.5 Histórico — 🟡

O cliente possui busca e modal de agendamento, mas os profissionais exibidos ainda estão definidos em dados do frontend e a disponibilidade real precisa ser conectada ao núcleo da Agenda.

**Progresso da etapa:** 40% validado

---

# 09. NOTIFICAÇÕES — 🔴

- 🔴 Sistema real de notificações não validado
- 🟡 Indicador visual existe na UI do salão
- 🔴 E-mail/push não concluídos

**Progresso:** 15% validado

---

# 10. HISTÓRICO / AUDITORIA — 🔴

- 🔴 Histórico completo de alterações não concluído
- 🔴 Auditoria de eventos críticos não concluída
- 🔴 Trilha de S.O.S. → agendamento não consolidada

**Progresso:** 10% validado

---

# 11. BACKEND / REGRAS DE NEGÓCIO — 🟡

- 🟢 Firebase Auth
- 🟢 Firestore
- 🟢 Security Rules versionadas
- 🟡 Adaptador de dados
- 🟡 Regras de Agenda
- 🟡 Regras de S.O.S.
- 🔴 Operações críticas atômicas
- 🔴 Idempotência de operações críticas

**Progresso:** 40% validado

---

# 12. SEGURANÇA COMPLETA — 🟡

- 🟢 Auth
- 🟢 Firestore Rules
- 🟡 Ownership por papel
- 🟡 Validação de dados nas Rules
- 🔴 Testes automatizados das Rules
- 🔴 Auditoria de acesso cruzado
- 🔴 Auditoria final de produção

**Progresso:** 40% validado

---

# 13. TESTES — 🔴

- 🟢 Verificação de sintaxe JavaScript existe no workflow de qualidade
- 🔴 Testes E2E completos
- 🔴 Testes de Agenda
- 🔴 Testes S.O.S.
- 🔴 Testes de conflito
- 🔴 Testes de persistência compartilhada
- 🔴 Testes de Security Rules
- 🔴 Testes mobile/desktop automatizados

**Progresso:** 15% validado

---

# 14. EXPERIÊNCIA / INTERFACE — 🟡

- 🟢 Desktop básico
- 🟢 Componentes visuais principais
- 🟡 Mobile precisa de revisão completa
- 🟡 Estados de erro/loading precisam de revisão
- 🟡 Acessibilidade precisa de auditoria

**Progresso:** 45% validado

---

# 15. PERFORMANCE — 🔴

- 🔴 Queries reais ainda precisam de auditoria
- 🔴 Índices/consultas Firestore precisam de revisão
- 🔴 Performance de Agenda precisa de teste
- 🔴 Monitoramento ainda não concluído

**Progresso:** 10% validado

---

# 16. INTEGRAÇÕES — 🟡

- 🟢 Firebase Auth
- 🟢 Firestore
- 🔵 Storage, se necessário
- 🔵 Push
- 🔵 Mapas/geolocalização
- 🔵 Pagamentos — somente quando aprovado

**Progresso:** 35% validado

---

# 17. ADMINISTRAÇÃO / OPERAÇÃO — 🔴

- 🔴 Gestão administrativa completa
- 🔴 Moderação
- 🔴 Auditoria operacional
- 🔴 Ferramentas de suporte

**Progresso:** 0%

---

# 18. PRODUÇÃO — 🟡

- 🟢 GitHub Pages / publicação estática existente
- 🟢 Firebase configurado no código
- 🟡 Backend de produção precisa ser confirmado
- 🔴 Smoke test de produção
- 🔴 Backup/recuperação formal
- 🔴 Monitoramento
- 🔴 Rollback validado

**Progresso:** 25% validado

---

# 19. AUDITORIA FINAL — 🔴 NÃO INICIADA

Checklist obrigatório:

- 🔴 Banco
- 🔴 Auth
- 🔴 Rules
- 🔴 Acesso cruzado
- 🔴 Agenda
- 🔴 S.O.S.
- 🔴 Conflitos
- 🔴 Dados de teste
- 🔴 PII
- 🔴 Mobile
- 🔴 Desktop
- 🔴 Performance
- 🔴 Backup
- 🔴 Rollback

**Veredito:** ainda não pode ser APROVADO.

---

# 20. PUBLICAÇÃO / ENTREGA — 🔴 BLOQUEADA

Só liberar quando a Etapa 19 receber 🟢 APROVADO.

---

# PROTOCOLO DE ATUALIZAÇÃO DO MAPA

Quando o usuário disser **“FINALIZEI”**, **“TERMINAMOS”**, **“ETAPA CONCLUÍDA”** ou equivalente:

1. Reconsultar o GitHub.
2. Identificar o commit/estado atual.
3. Comparar o código com o mapa.
4. Verificar testes/evidências disponíveis.
5. Atualizar os status.
6. Recalcular os percentuais com a mesma regra.
7. Registrar o ponto exato de parada.
8. Registrar o próximo passo.
9. Atualizar este arquivo no GitHub.
10. Nunca marcar 🟢 sem evidência.

Se a alteração estiver somente no Lovable/Preview e não estiver no GitHub, registrar como:

**⛔ NÃO AUDITÁVEL NO GITHUB — NÃO CONSIDERAR CONCLUÍDO.**

# FORMATO DE RESPOSTA PARA “ONDE ESTAMOS?”

```text
📍 POSIÇÃO ATUAL
Etapa: XX
Subetapa: XX.X
Status: XXXXX
Progresso: XX%

🟢 CONCLUÍDO
- ...

🟡 PARCIAL / PRECISA VALIDAÇÃO
- ...

🔴 PENDÊNCIAS
- ...

➡️ PRÓXIMO PASSO
- ...

⛔ BLOQUEIOS
- ...

📌 ÚLTIMO COMMIT AUDITADO
- SHA: ...
```

# REGRA DE NÃO-DESVIO

Nenhuma nova funcionalidade deve ser iniciada fora do mapa sem registrar sua posição e dependências.

Não redesenhar o aplicativo inteiro quando uma correção localizada resolver o problema.

Não apagar código legado apenas pelo nome do arquivo; primeiro rastrear referências e responsabilidade.

Não tratar frontend como autoridade de segurança.

Não tratar `localStorage` como fonte de verdade de dados operacionais compartilhados.

Não considerar uma interface pronta como fluxo pronto.

# FLUXO CENTRAL DO PRODUTO

```text
AGENDA
  ↕
S.O.S.
  ↕
SALÃO
  ↕
PROFISSIONAL
  ↕
SERVIÇO / ESPECIALIDADE
  ↕
DISPONIBILIDADE
  ↕
CLIENTE
  ↕
AGENDAMENTO
  ↕
STATUS / HISTÓRICO
```

**A Agenda e o S.O.S. são tratados como núcleos operacionais do produto.**

---

## Referências técnicas

- Firebase Security Rules: https://firebase.google.com/docs/rules/get-started
- Firestore Rules e condições: https://firebase.google.com/docs/firestore/security/rules-conditions
- GitHub — branches: https://docs.github.com/en/pull-requests/reference/branches
- GitHub — commits: https://docs.github.com/en/pull-requests/reference/commits
