# BeautyMove MVP — Base de Aprovações

## Regra de desenvolvimento

Um layout aprovado passa a ser a base oficial. Alterações posteriores devem ser incrementais e identificadas por versão. Nenhuma tela aprovada deve ser reconstruída sem decisão explícita.

## Base consolidada — 2026-08-15

### Tela Principal
- Tela própria do fluxo inicial do salão.
- Resumo do dia objetivo.
- Calendário para escolher a data.
- Botão **Agendar cliente** abaixo do calendário.
- O calendário e o botão conversam: selecionar a data e clicar em Agendar cliente leva à Agenda naquela data.
- Ações rápidas: somente **S.O.S. Profissionais**.
- Não exibir estimativa financeira no resumo do dia.
- Valores financeiros são confidenciais e ficam disponíveis somente nos contextos autorizados do salão/profissional.

### Agenda
- Agenda é uma tela própria e é o centro da operação do salão.
- Painel lateral esquerdo de navegação para usuários e configurações.
- Grade por horário e por profissional.
- Coluna **S.O.S.** própria, separada das colunas dos profissionais.
- O botão **Solicitar S.O.S.** pertence à coluna S.O.S.
- Solicitações S.O.S. aparecem dentro da coluna correspondente, com cliente, profissional e horário quando houver profissional selecionado.
- Clique em horário livre abre o agendamento.
- Clique em atendimento abre a janela de ações.
- Todos os horários continuam acionáveis; a duração calculada é informativa e não deve criar um bloqueio rígido que impeça encaixes.
- A visualização pode ser configurada em 30, 45 ou 60 minutos.

### Cores da agenda
- Neutro/branco: horário livre ou agendamento ainda sem chegada.
- Cinza: atendimento agendado.
- Verde: cliente chegou / atendimento em andamento.
- Vermelho: atendimento finalizado.
- Cinza discreto: cancelado.
- **Roxo exclusivamente para S.O.S.**
- Roxo não representa status normal da agenda.

### Janela do atendimento
A janela contextual é a peça central da operação. Deve permitir, conforme o estado:
- alterar horário;
- alterar profissional;
- incluir/remover serviços;
- registrar chegada;
- finalizar atendimento;
- cancelar atendimento;
- acessar financeiro.

### Serviços, duração e valores
- Serviço possui valor e duração estimada.
- A duração total é a soma dos serviços selecionados.
- Exemplo de regra: Corte 1h + Escova 30min + Luzes 3h = 4h30 de duração calculada.
- O valor total acompanha os serviços selecionados.
- A agenda mostra a duração calculada, mas não transforma a duração em bloqueio rígido.
- O cadastro definitivo de serviços, valores e tempos pertence ao fluxo de configuração; a agenda apenas utiliza esses dados.

### Financeiro
- Cada profissional possui financeiro separado.
- O salão é responsável pelos cálculos/percentuais destinados a cada profissional.
- O app deve mostrar o montante referente ao período nos contextos financeiros autorizados.
- Não expor valores financeiros no resumo geral da tela principal.

## Implementação desta etapa

A branch `build/mvp-v1` recebeu a primeira implementação da Agenda V1 baseada nessa base consolidada. A implementação é incremental e preserva o restante do MVP.

### Ainda não considerado congelado
- Layout definitivo da tela Configurações.
- Cadastro definitivo de serviços/valores/tempos.
- Layout definitivo do Financeiro.
- Integração final do calendário da Tela Principal com a Agenda.
- Regras definitivas de persistência Firebase para a Agenda.

Esses itens entram somente após desenho e aprovação próprios.
