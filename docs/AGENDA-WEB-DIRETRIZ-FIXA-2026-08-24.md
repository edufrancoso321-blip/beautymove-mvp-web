# BeautyMove — Diretriz Fixa da Agenda Web

**Status: CONGELADA**  
**Data: 24/08/2026**

## 1. Princípio
A Agenda Web possui **um único motor visual autoritativo**: `assets/js/agenda.js`.

Correções futuras não devem criar um segundo renderer, usar `rowspan` para duração, ou empilhar patches que reescrevam a geometria da grade.

## 2. Arquitetura congelada
A Agenda é uma **grade temporal CSS Grid**, composta por:

- coluna fixa de horário;
- quatro lanes independentes de profissionais;
- uma lane S.O.S.;
- cabeçalho separado da área temporal, mantendo as mesmas colunas;
- eventos posicionados absolutamente dentro da lane correspondente.

A grade não é uma tabela HTML de `tr/td` para representar duração.

## 3. Regra de evento
**Um atendimento = um único bloco visual.**

O bloco recebe:
- `top` proporcional ao horário de início;
- `height` proporcional à duração total;
- `left/right` definidos pela lane da profissional ou S.O.S.

Exemplos congelados:
- 60 min = 1 hora;
- 75 min = 1h15;
- 120 min = 2h;
- 210 min = 3h30.

Um início como `11:30` deve aparecer exatamente no meio da célula horária quando o modo estiver em 1 hora.

## 4. Regra S.O.S.
A lane S.O.S. utiliza exatamente a mesma geometria temporal das lanes profissionais.

Uma oportunidade S.O.S. deve:
- aparecer no horário correto;
- ocupar o tempo total dos serviços;
- permanecer exclusivamente em roxo;
- não deslocar nenhuma coluna;
- permanecer visível enquanto ativa;
- continuar rastreável após confirmação de profissional.

## 5. Rolagem
A rolagem vertical acontece dentro do contêiner da Agenda.

A rolagem horizontal, quando necessária, também acontece nesse mesmo contêiner.

O cabeçalho dos profissionais e a coluna Horário permanecem fixos durante a navegação.

## 6. Dados
A duração visual deve ser derivada dos serviços armazenados no atendimento. Campos de compatibilidade (`duration`, `durationMinutes`, `durationSnapshot`) podem existir, mas não devem criar uma segunda representação visual do mesmo atendimento.

A persistência continua sendo responsabilidade de `agenda-firestore-persistence.js`.

## 7. Motores antigos
O antigo `assets/js/agenda-authoritative-grid-fix.js` deixou de ser o renderer da Agenda e não deve voltar ao fluxo.

O `agenda-sos-runtime-sync.js` não carrega mais motores visuais concorrentes. Ele atua somente como ponte para as autoridades funcionais do S.O.S.

## 8. Regra de manutenção
Antes de qualquer alteração:
1. identificar o problema como dado, geometria, rolagem ou interação;
2. corrigir a causa em `assets/js/agenda.js`;
3. não criar outro renderer;
4. testar 30 e 60 minutos;
5. testar 30, 60, 75, 120 e 210 minutos;
6. testar início em `11:30` e outros horários não inteiros;
7. testar S.O.S. ativo e S.O.S. confirmado;
8. testar rolagem até o final do expediente;
9. testar cabeçalho, coluna Horário e S.O.S. após rolagem;
10. somente então considerar a alteração aprovada.

## 9. Critério de aceitação visual
Para os dados atualmente usados na validação:

- **SUZANA 11:30–15:00** = um único bloco na coluna Bruna;
- **SUELI 12:00–13:15** = um único bloco na coluna Carla;
- **RUTH 14:30–16:30** = um único bloco na coluna Paula;
- **ERICA 13:00–16:30** = um único bloco na lane S.O.S. enquanto aguarda profissional.

Nenhum desses atendimentos pode ser repetido em cada hora, criar coluna implícita ou deslocar conteúdo para fora da sua lane.

## 10. Regra de projeto
A Agenda é uma fundação do produto, não apenas uma tela visual. Novas funcionalidades devem consumir o modelo de eventos temporais existente em vez de alterar a geometria base.
