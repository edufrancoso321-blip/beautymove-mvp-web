# BeautyMove — Auditoria Ampliada da Agenda Web

Data: 2026-08-24

## Diretriz congelada

A Agenda Web é a estrutura-mãe. A versão mobile não será refinada agora. Primeiro a Agenda Web precisa estar funcional, coerente e estável; depois a experiência mobile será adaptada sobre a mesma regra de dados e duração.

## Achados da auditoria

### 1. Havia múltiplas camadas concorrentes

`salao.html` carregava a Agenda por uma sequência extensa de módulos de correção visual, seleção, persistência, cabeçalho e S.O.S. Isso aumentava o risco de uma correção posterior sobrescrever uma anterior.

### 2. Intervalo visual e horário de formulário estavam desacoplados

A Agenda permitia 30/45/60 minutos, mas `agenda.js` reconstruía as opções de horário em passos de 30 minutos. Isso permitia criar horários incompatíveis com a granularidade visual selecionada.

### 3. Duração estava calculada, mas não era uma autoridade visual única

A duração dos serviços já era calculada em diferentes módulos, porém a ocupação visual da Agenda e a ocupação visual do S.O.S. não usavam uma mesma transformação geométrica.

### 4. Cabeçalho tinha duas autoridades de layout

`agenda.js` gerava uma linha inicial e `agenda-header-layout.js` transformava o cabeçalho posteriormente em duas linhas. Em paralelo, havia CSS sticky antigo e CSS final com regras para linhas diferentes. A combinação explicava deslocamentos e sobreposição do cabeçalho.

### 5. S.O.S. possuía caminhos de reserva concorrentes

`agenda-sos-single-controller.js` criava uma reserva diretamente ao selecionar um profissional, enquanto `agenda-sos-actions-final.js` também possuía lógica de criação/atualização da reserva. Isso permitia estados divergentes entre oportunidade, atendimento e painel.

## Correções aplicadas

### Camada autoritativa da grade

Criado `assets/js/agenda-authoritative-grid-fix.js`.

Responsabilidades:
- preservar a estrutura visual aprovada;
- reconstruir o cabeçalho em duas linhas reais;
- manter especialidade acima do profissional;
- manter horários e profissionais sincronizados;
- usar 30/45/60 como granularidade real da grade;
- ocupar visualmente o período completo do atendimento;
- representar o restante de um intervalo parcial como área livre, sem fingir que o atendimento dura mais do que realmente dura;
- aplicar a mesma regra ao S.O.S.;
- manter a linha de horário atual;
- manter o painel S.O.S. como painel, não como segunda agenda.

### Autoridade de seleção S.O.S.

Criado `assets/js/agenda-sos-selection-authority.js`.

A seleção de profissional passa por uma única rotina de reserva, com cálculo de duração e verificação de conflito antes da criação do atendimento.

### Proteção contra dupla marcação

Criado `assets/js/agenda-conflict-authority.js`.

A criação/edição de atendimento é bloqueada quando o profissional já possui atendimento sobreposto no mesmo período.

### Integração

`agenda-sos-runtime-sync.js` passa a carregar as três camadas autoritativas depois da pilha existente, sem redesenhar a Agenda nem substituir o painel S.O.S.

## Critérios de aceite da próxima validação

1. Especialidades e profissionais permanecem alinhados durante a rolagem.
2. O cabeçalho não desliza ou sobrepõe a grade.
3. Atendimento de 60 minutos ocupa 60 minutos.
4. Atendimento de 75 minutos ocupa 75 minutos, sem transformar 75 em 120.
5. Atendimento de múltiplos serviços usa a soma das durações.
6. S.O.S. ocupa visualmente a duração total dos serviços solicitados.
7. S.O.S. aceito cria um único atendimento na coluna do profissional.
8. O painel S.O.S. e a Agenda refletem o mesmo estado.
9. Dupla marcação do mesmo profissional é bloqueada.
10. Data e intervalo selecionados continuam funcionando após nova renderização.
11. Mobile permanece fora desta etapa.
