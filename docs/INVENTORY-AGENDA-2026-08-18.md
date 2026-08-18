# BeautyMove MVP Web — Inventário de Restauração da Agenda

**Data:** 2026-08-18  
**Base:** `main` em `eac11b0769e95dd784194b2315813eab655bad0a`  
**Branch de trabalho:** `refactor/clean-architecture-2026-08-18`

## 1. Objetivo

Reorganizar a Agenda sem perder funcionalidades já desenvolvidas. Nenhum arquivo legado deve ser removido durante a fase de inventário.

## 2. Estado atual confirmado

A página `salao.html` possui uma cadeia extensa de CSS e JavaScript específicos da Agenda. O comportamento atual é resultado da composição de vários módulos sucessivos, e não de um controlador único.

### CSS ativo observado

- `assets/css/agenda.css`
- `assets/css/agenda-approved-layout.css`
- `assets/css/agenda-clock.css`
- `assets/css/agenda-schedule.css`
- `assets/css/agenda-toolbar-final.css`
- `assets/css/agenda-date-fix.css`
- `assets/css/agenda-professional-control.css`
- `assets/css/sos-opportunity-panel.css`
- `assets/css/agenda-detail-actions-fix.css`

### JavaScript ativo observado

- `plan-access.js`
- `agenda.js`
- `agenda-ui-fixes.js`
- `agenda-services-filter.js`
- `agenda-clock.js`
- `agenda-schedule.js`
- `agenda-professional-control-stable.js`
- `agenda-affected-appointments-stable.js`
- `agenda-professional-filter-fix.js`
- `agenda-header-layout.js`
- `agenda-sticky-occurrence-fix.js`
- `agenda-plan-gate.js`
- `sos-opportunity-panel.js`
- `agenda-sos-cell-fix.js`
- `agenda-detail-actions-fix.js`
- `agenda-sos-final.js`
- `agenda-sos-correction.js`
- `agenda-service-selection-final.js`
- `agenda-sos-service-pricing-final.js`
- `agenda-sos-metric-sync.js`

Existem ainda outros módulos históricos no diretório `assets/js`, incluindo versões `fix`, `stable`, `controller`, `operations` e `duration-engine`.

## 3. Problemas estruturais confirmados

### 3.1 Estado duplicado

`assets/js/data.js` já fornece `BeautyMoveData`, mas `agenda.js` implementa novamente leitura e gravação direta de `beautymove.mvp.state` usando `localStorage`.

**Regra alvo:** somente `BeautyMoveData` deve conhecer o mecanismo de armazenamento.

### 3.2 Catálogo duplicado

`agenda.js` possui um catálogo próprio `AGENDA_SERVICES`. A lógica S.O.S. também possui referências a serviços. Isso permite que preço, duração e disponibilidade divergirem entre telas.

**Regra alvo:** um catálogo canônico.

### 3.3 Métricas duplicadas

`agenda.js` calcula `metricAppointments`, `metricProgress`, `metricSos` e `metricCanceled` durante seu próprio `render()`. Paralelamente existe `agenda-sos-metric-sync.js`, que recalcula o indicador S.O.S. separadamente.

**Regra alvo:** uma função de domínio calcula métricas; o controlador apenas renderiza.

### 3.4 S.O.S. fragmentado

O fluxo S.O.S. está distribuído entre formulário, coluna da Agenda, painel lateral, seleção de profissional, serviços, preço e métrica. Existem vários arquivos de correção sobrepostos.

**Regra alvo:** uma coleção de oportunidades e um controlador S.O.S. único.

### 3.5 CSS em camadas corretivas

A presença simultânea de arquivos `approved`, `final`, `fix`, `date-fix`, `detail-actions-fix` e equivalentes indica que a apresentação foi sendo sobrescrita ao longo das iterações.

**Regra alvo:** consolidar estilos depois que a estrutura DOM estiver estabilizada.

## 4. Funcionalidades que não podem ser perdidas

- agenda visual;
- navegação por data;
- intervalo de 30/45/60 minutos;
- horários de funcionamento;
- cadastro/edição de atendimento;
- múltiplos serviços por atendimento;
- cálculo de duração;
- cálculo de valor;
- alteração de horário;
- alteração de profissional;
- chegada/em andamento;
- finalização;
- cancelamento;
- controle diário de profissionais;
- Central S.O.S.;
- coluna S.O.S.;
- busca/seleção de profissional;
- favoritos;
- métricas;
- persistência após atualização da página;
- autenticação e perfil do salão;
- confirmação de senha;
- múltiplas especialidades do salão.

## 5. Arquitetura de consolidação

```text
salao.html
   ↓
agenda/controller.js
   ├── appointments.js
   ├── services.js
   ├── professionals.js
   ├── sos.js
   └── metrics.js
          ↓
   BeautyMoveData
          ↓
   localStorage / Firebase
```

Os arquivos históricos permanecem no repositório até a validação funcional. Eles não devem continuar sendo carregados pela página depois que a nova implementação assumir suas responsabilidades.

## 6. Ordem obrigatória da restauração

1. estabilizar a camada de dados;
2. estabilizar o estado da Agenda;
3. consolidar serviços;
4. consolidar atendimentos;
5. consolidar profissionais;
6. consolidar S.O.S.;
7. consolidar métricas;
8. trocar `salao.html` para o controlador único;
9. validar todos os fluxos;
10. somente então limpar arquivos legados e CSS redundante.

## 7. Proibição durante a restauração

Não criar novos arquivos `fix`, `final`, `correction`, `stable` ou `sync` para corrigir comportamento existente. Se uma regra estiver errada, corrigir seu proprietário.
