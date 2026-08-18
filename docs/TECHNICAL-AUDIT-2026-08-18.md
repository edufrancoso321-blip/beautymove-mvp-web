# BeautyMove MVP Web — Auditoria Técnica

**Data:** 2026-08-18  
**Base auditada:** `main` em `eac11b0769e95dd784194b2315813eab655bad0a`  
**Branch de trabalho:** `refactor/clean-architecture-2026-08-18`  
**Backup imutável de referência:** `backup/pre-auditoria-2026-08-18`

## 1. Decisão de segurança

Nenhum arquivo da base `main` foi apagado antes da auditoria. Foi criada uma branch de backup apontando exatamente para o commit auditado. A reorganização deve ocorrer em branch própria e somente ser incorporada ao `main` depois de validação funcional.

## 2. Diagnóstico executivo

O projeto não apresenta um problema de conceito. O problema principal é **acoplamento e duplicação de lógica**.

A Agenda passou por várias correções incrementais e hoje possui múltiplos módulos que leem e alteram o mesmo estado, especialmente `beautymove.mvp.state`, além de múltiplas camadas de CSS e JavaScript com nomes `fix`, `stable`, `final`, `correction` e `sync`.

Isso cria três riscos principais:

1. **Ordem de execução:** um script pode alterar o DOM ou registrar um listener depois de outro módulo.
2. **Regra duplicada:** duas partes podem calcular o mesmo indicador ou status de maneira diferente.
3. **Estado duplicado:** módulos escrevem diretamente no `localStorage`, em vez de usar um único limite de dados.

## 3. Evidências encontradas

### 3.1 `salao.html`

A página da Agenda carrega uma cadeia extensa de scripts especializados e de correção. Entre eles estão `agenda.js`, `agenda-ui-fixes.js`, `agenda-professional-control-stable.js`, `agenda-affected-appointments-stable.js`, `sos-opportunity-panel.js`, `agenda-sos-cell-fix.js`, `agenda-detail-actions-fix.js`, `agenda-sos-final.js`, `agenda-sos-correction.js`, `agenda-service-selection-final.js`, `agenda-sos-service-pricing-final.js` e `agenda-sos-metric-sync.js`.

Esse é o principal ponto de refatoração.

### 3.2 Estado

`agenda.js` mantém sua própria leitura/escrita de `beautymove.mvp.state`, enquanto `assets/js/data.js` já existe como adaptador de dados. A Agenda não utiliza esse adaptador como limite único.

### 3.3 S.O.S.

O S.O.S. possui lógica distribuída entre painel, célula, formulário, favoritos, serviços, aceite e métrica. Há módulos que modificam o formulário por captura de evento e outros que renderizam novamente a mesma região.

### 3.4 Métrica S.O.S.

A métrica inferior é calculada em `agenda.js` e também existe um módulo independente de sincronização que recalcula o valor a cada 300 ms. Isso é um sinal claro de regra duplicada.

### 3.5 Dados de serviços

Há pelo menos dois catálogos padrão de serviços dentro da lógica S.O.S., com pequenas diferenças. Isso permite divergência de preço, oferta e duração.

### 3.6 Autenticação

O cadastro já possui confirmação de senha e múltiplas especialidades para salão. `auth.js` também valida ambos os requisitos antes de registrar o perfil. Essa parte deve ser preservada durante a reorganização.

## 4. O que está bom e deve ser preservado

- Identidade visual BeautyMove.
- Fluxo de acesso por perfil.
- Firebase como backend principal de autenticação/perfis.
- Confirmação de senha.
- Múltiplas especialidades para salão.
- Agenda visual já construída.
- Atendimento com múltiplos serviços.
- Cálculo de duração e valor.
- Controle operacional de profissionais.
- Central S.O.S.
- Busca por profissionais.
- Favoritos.
- Indicadores da Agenda.
- Regras do Firestore existentes, sujeitas a revisão posterior.

## 5. Arquitetura-alvo

A próxima versão deve separar claramente:

```text
UI / HTML
   ↓
Controllers de tela
   ↓
Domínio / regras de negócio
   ↓
Data boundary
   ↓
LocalStorage / Firebase
```

Para a Agenda:

```text
agenda.html/markup
   └── agenda-controller
        ├── appointments
        ├── services
        ├── professionals
        ├── sos
        └── metrics
              ↓
        BeautyMoveData
              ↓
        beautymove.mvp.state
```

Nenhum módulo visual deve calcular sozinho uma regra que pertença ao domínio.

## 6. Estratégia de limpeza

### Fase A — segurança
- manter `main` intacta durante a auditoria;
- manter branch `backup/pre-auditoria-2026-08-18`;
- trabalhar em `refactor/clean-architecture-2026-08-18`.

### Fase B — inventário
- mapear páginas;
- mapear scripts carregados por página;
- mapear CSS carregado por página;
- identificar scripts órfãos e duplicados;
- mapear todas as chaves de `localStorage`;
- mapear eventos customizados.

### Fase C — consolidação
- criar um único data boundary;
- criar um controlador único da Agenda;
- consolidar S.O.S.;
- consolidar métricas;
- retirar correções redundantes do caminho ativo;
- manter arquivos antigos somente como histórico até a validação final.

### Fase D — validação
- cadastro;
- login;
- criação de atendimento;
- duração;
- alteração;
- cancelamento;
- S.O.S.;
- seleção profissional;
- acompanhamento;
- troca de data;
- atualização da página;
- persistência.

## 7. Regra de engenharia a partir desta auditoria

Não adicionar outro arquivo `fix`, `final`, `correction`, `stable` ou `sync` para resolver um comportamento existente sem antes localizar o módulo responsável pela regra.

Correções futuras devem ser feitas no proprietário da regra, não em uma camada paralela que sobrescreva o comportamento.

## 8. Critério de conclusão

A reorganização será considerada concluída somente quando:

- a Agenda tiver uma única fonte de verdade para estado;
- cada regra tiver um único proprietário;
- S.O.S. e métricas estiverem sincronizados pelo mesmo estado;
- o fluxo de atendimento sobreviver a refresh e troca de data;
- os recursos já aprovados continuarem funcionando;
- o `main` puder receber a refatoração por uma mudança revisável e reversível.
