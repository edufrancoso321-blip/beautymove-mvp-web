# BeautyMove — Agenda V1 — Teste

Data: 2026-08-15

## Base usada
A implementação parte da base aprovada registrada em `docs/APPROVED-BASE.md`.

## Ajustes desta rodada
- Painel lateral de navegação mantido como estrutura da Agenda.
- Coluna S.O.S. permanece separada das colunas dos profissionais.
- A ação de solicitar S.O.S. fica exclusivamente dentro da coluna S.O.S.
- Roxo reservado ao S.O.S.; estados normais usam neutro/cinza, verde e vermelho.
- Atendimento agendado recebe preenchimento cinza discreto.
- Estados de chegada/em andamento e finalização preenchem toda a duração calculada do atendimento.
- Continuação de atendimento não perde a cor por opacidade.
- Visualização configurável em 30, 45 ou 60 minutos.
- Célula livre abre o agendamento.
- Célula de atendimento abre a janela contextual de ações.
- Duração e valor são calculados a partir dos serviços selecionados.
- Duração calculada não cria bloqueio rígido: cancelamentos liberam o horário e as células continuam acionáveis para encaixes.

## Teste manual
1. Abrir a Agenda.
2. Clicar em uma célula Livre e criar um atendimento.
3. Selecionar serviços e verificar duração/valor.
4. Salvar e clicar no atendimento criado.
5. Testar alterar horário, alterar profissional, serviços, chegada, finalização, cancelamento e financeiro.
6. Alterar a visualização para 30, 45 e 60 minutos.
7. Solicitar S.O.S. pela coluna S.O.S. e verificar a identificação roxa.
8. Clicar em uma célula S.O.S. e verificar os detalhes.
9. Confirmar que a duração calculada não impede novo clique/encaixe em horários da grade.

## Não congelado
Cadastro definitivo de serviços, Firebase da Agenda, Financeiro definitivo e integração do calendário da Tela Principal continuam fora deste congelamento.
