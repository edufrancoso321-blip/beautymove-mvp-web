# BeautyMove — Contrato Arquitetural da Agenda

**Versão:** 1.0  
**Data:** 24/08/2026  
**Status:** APROVADO / CONGELADO

## 1. Objetivo

A Agenda do salão passa a ser dividida em dois módulos operacionais independentes:

1. **Agenda Profissionais** — operação normal do salão.
2. **Agenda S.O.S.** — operação exclusiva das oportunidades S.O.S.

A separação existe para reduzir acoplamento, evitar efeitos colaterais e criar um alicerce estável para novas funcionalidades.

## 2. Regra de autoridade

A recepcionista é a autoridade operacional para decidir quando uma necessidade deve virar uma oportunidade S.O.S.

A Agenda Profissionais pode **identificar e sinalizar uma necessidade**, mas nunca cria, envia, seleciona ou move automaticamente uma oportunidade para S.O.S.

A Agenda S.O.S. nunca altera diretamente a Agenda Profissionais.

## 3. Agenda Profissionais

Responsabilidades:
- profissionais;
- especialidades;
- status dos profissionais;
- agendamentos convencionais;
- duração e ocupação dos serviços;
- disponibilidade;
- conflitos da agenda convencional;
- ações que exigem decisão da recepcionista.

Não é responsabilidade:
- procurar profissional S.O.S.;
- selecionar profissional S.O.S.;
- criar oportunidade S.O.S. automaticamente;
- administrar o painel S.O.S.;
- renderizar oportunidades S.O.S. como parte da grade convencional.

## 4. Agenda S.O.S.

Responsabilidades:
- representar temporalmente as oportunidades S.O.S. criadas pela recepcionista;
- mostrar especialidade, serviço, horário, duração e estado da oportunidade;
- acompanhar profissional selecionado/aceito;
- permitir encerramento/cancelamento conforme o fluxo S.O.S.

A Agenda S.O.S. conversa operacionalmente somente com o módulo/painel S.O.S.

## 5. Painel S.O.S.

Responsabilidades:
- listar oportunidades S.O.S.;
- mostrar profissionais compatíveis;
- registrar seleção/envio/aceite;
- acompanhar o estado da oportunidade.

O painel não deve controlar a geometria da Agenda Profissionais.

## 6. Identidade comum sem sincronização entre agendas

Quando uma necessidade tiver origem em um atendimento convencional, ela pode carregar um identificador de referência, por exemplo:

`appointmentId: BM-ATD-000123`

A referência serve para rastreabilidade. Ela **não cria sincronização automática entre as duas agendas**.

## 7. Regra de evento temporal

Um atendimento ou oportunidade é sempre um único evento lógico com:

- início;
- duração;
- fim calculado;
- profissional/estado;
- identificador.

A visualização de 30 ou 60 minutos altera apenas a escala da grade. Nunca duplica o evento.

## 8. Regra de ocupação

A duração real deve determinar a ocupação visual completa.

Exemplos:
- 13:00–16:30 = um evento contínuo de 3h30;
- 14:30–16:30 = um evento contínuo de 2h;
- 11:30–12:45 = um evento contínuo de 1h15.

Não usar células repetidas ou `rowspan` para representar duração.

## 9. Regra de comunicação

Fluxo permitido:

`Agenda Profissionais → necessidade → Recepcionista → Agenda S.O.S.`

`Agenda S.O.S. ↔ Painel S.O.S.`

Fluxos proibidos:

`Agenda Profissionais → Agenda S.O.S. automaticamente`

`Agenda S.O.S. → Agenda Profissionais automaticamente`

`Painel S.O.S. → renderizador da Agenda Profissionais`

## 10. Regra de manutenção

Antes de qualquer correção futura:

1. localizar o proprietário da informação;
2. localizar o único renderer responsável pela visualização;
3. verificar se existe código concorrente;
4. corrigir a causa na camada correta;
5. não criar um novo arquivo `*-fix`, `*-final` ou `*-stable` para mascarar um problema arquitetural;
6. testar os dois módulos separadamente;
7. testar a passagem explícita da recepcionista para S.O.S.;
8. validar regressões na Agenda Profissionais.

## 11. Critério de evolução

Novas funcionalidades devem pertencer ao módulo que possui a responsabilidade correspondente. Se uma funcionalidade exigir comunicação automática entre as duas agendas, isso deverá ser tratado como uma **decisão arquitetural nova**, nunca como um efeito colateral de implementação.
