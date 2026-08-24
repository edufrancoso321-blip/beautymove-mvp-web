# BeautyMove — Diretriz de Desenvolvimento da Agenda Web

Status: OFICIAL / CONGELADA EM 2026-08-24

## Objetivo
Concluir primeiro a Agenda Web/Desktop com estrutura estável e funções operacionais. A versão mobile será tratada posteriormente como uma experiência própria de agenda diária.

## Regra de responsividade
- Não realizar novas alterações visuais específicas para mobile durante esta fase.
- Não disponibilizar agenda semanal no celular.
- A futura agenda mobile será diária, com mudança de data no cabeçalho e rolagem vertical/horizontal controlada.
- As decisões estruturais tomadas agora devem preservar a possibilidade de adaptação posterior para mobile, sem criar componentes exclusivos que dificultem essa evolução.

## Ordem de implementação da Agenda Web
1. Estrutura da grade: horários, especialidades, profissionais e coluna S.O.S.
2. Navegação por data: anterior, próximo, hoje e calendário.
3. Filtro de profissionais.
4. Configuração de horário de funcionamento e intervalo.
5. Criação e edição de agendamentos.
6. Serviços, duração e valor do atendimento.
7. Detalhes do atendimento e ações de operação.
8. Alteração de horário e profissional.
9. Status do atendimento e cancelamento.
10. S.O.S. integrado à agenda.
11. Persistência e consistência dos dados.
12. Auditoria final da Agenda Web antes de iniciar a adaptação mobile.

## Critério de conclusão
A Agenda Web só será considerada concluída quando o fluxo principal do salão puder ser executado de ponta a ponta sem depender de ajustes específicos para celular.

## Princípio de engenharia
Não corrigir sintomas com novos remendos CSS/JS quando o problema for estrutural. Primeiro identificar a origem, corrigir a camada responsável e validar a Agenda Web antes de avançar.

## Próxima etapa
Trabalhar exclusivamente na Agenda Web, preservando o layout desktop atualmente aprovado e avançando pela ordem funcional acima.
