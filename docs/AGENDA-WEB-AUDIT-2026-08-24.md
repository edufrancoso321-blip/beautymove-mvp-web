# BeautyMove — Auditoria da Agenda Web

**Data:** 2026-08-24  
**Escopo:** Agenda Web desktop  
**Mobile:** congelado para a fase posterior de responsividade, sem alteração nesta correção.

## Diagnóstico

### 1. Cabeçalho de profissionais
A Agenda utiliza duas linhas reais no cabeçalho: especialidade e profissional/status. A camada `agenda-sticky-header-final.css` estava posicionando `professional-name` e `professional-day-status` com `position:absolute`, enquanto outra camada ainda aplicava a barra colorida no rodapé do cabeçalho. Isso fazia o status competir visualmente com a barra de especialidade/profissional.

**Correção:** a camada final de integridade devolve nome e status ao fluxo normal do cabeçalho e fixa alturas explícitas para as duas linhas.

### 2. S.O.S. não ocupava a duração total
A criação do S.O.S. já gravava `durationSnapshot` e os serviços selecionados. O problema estava na representação visual: a célula original da coluna S.O.S. era criada somente no horário inicial. A grade não mantinha a ocupação visual das linhas seguintes como um único bloco.

**Correção:** `agenda-web-integrity-final.js` transforma a solicitação S.O.S. em uma célula com `rowSpan` proporcional à duração total. Exemplo: 3h30 em intervalo de 1h ocupa quatro linhas da grade, sem criar uma segunda agenda.

### 3. Agendamentos normais
A mesma camada final reforça a ocupação proporcional dos atendimentos por profissional, usando a duração derivada dos serviços. O objetivo é que o horário ocupado represente o tempo real do atendimento, e não apenas a célula de início.

## Regra arquitetural preservada

- A Agenda continua sendo **uma única grade**.
- A coluna S.O.S. continua pertencendo à mesma grade.
- Nenhum dado de negócio é recriado ou alterado pela camada final.
- A camada final atua somente sobre a geometria/representação da Agenda.
- A responsividade mobile **não é alterada agora**.

## Arquivos da correção

- `assets/css/agenda-web-integrity-final.css`
- `assets/js/agenda-web-integrity-final.js`
- `assets/js/agenda-sos-runtime-sync.js` — ativação da camada final.

## Critérios de aceite desta etapa

1. Nome e status da profissional não podem sobrepor a barra colorida.
2. Cabeçalho de especialidade e profissionais deve permanecer alinhado às colunas.
3. Um S.O.S. deve ocupar visualmente todo o tempo total dos serviços.
4. Ao selecionar uma profissional para o S.O.S., o atendimento deve aparecer na coluna da profissional e manter a duração total.
5. A Central S.O.S. e a Agenda devem continuar usando o mesmo estado.
6. Nenhuma alteração deve ser feita na responsividade mobile nesta etapa.
