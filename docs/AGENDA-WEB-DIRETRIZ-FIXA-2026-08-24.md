# BeautyMove — Diretriz Fixa da Agenda Web

**Status: CONGELADA**  
**Data: 24/08/2026**

## 1. Princípio
A Agenda Web deve possuir **um único motor visual autoritativo** para a grade. Correções futuras não devem criar um segundo renderer, sobrescrever a grade com `rowspan` concorrente ou empilhar novos patches para compensar patches anteriores.

## 2. Contrato visual congelado
- Cabeçalho de especialidades permanece alinhado às respectivas colunas.
- Cabeçalho dos profissionais permanece fixo durante a rolagem vertical.
- Coluna `Horário` permanece fixa durante a rolagem horizontal/vertical.
- Coluna `S.O.S.` pertence à mesma grade e deve permanecer alinhada às demais colunas.
- A grade usa largura de colunas determinística; nenhuma célula pode criar coluna implícita.
- A rolagem vertical acontece dentro do contêiner da Agenda.
- A rolagem horizontal, quando necessária, acontece dentro do mesmo contêiner.
- O layout aprovado não deve ser alterado para resolver um problema funcional sem necessidade.

## 3. Regra de ocupação
Todo atendimento ocupa visualmente o **tempo real total calculado pelos serviços**.

Exemplos:
- 60 min = 1 hora.
- 75 min = 1h15.
- 120 min = 2h.
- 210 min = 3h30.

O início também pode ocorrer fora do início de uma célula de 1 hora, como `11:30`. O bloco deve começar proporcionalmente dentro da célula e continuar sem deslocar nenhuma coluna.

## 4. Regra S.O.S.
A coluna S.O.S. usa a mesma geometria temporal da Agenda normal.

Uma solicitação S.O.S. deve:
- aparecer no horário correto;
- ocupar o tempo total do serviço;
- permanecer exclusivamente em roxo;
- não alterar a posição das colunas vizinhas;
- continuar visível enquanto estiver ativa;
- permanecer rastreável quando uma profissional for confirmada.

## 5. Regra técnica congelada
A grade não utiliza `rowspan` para representar a duração dos atendimentos. Cada intervalo temporal mantém sua própria célula e o atendimento é representado por segmentos visuais proporcionais dentro dessas células.

Essa decisão elimina a classe de erros que provocava `Livre` fora da coluna S.O.S., deslocamento de células e perda de alinhamento entre cabeçalho e corpo.

## 6. Regra de manutenção
Antes de qualquer nova alteração na Agenda:
1. identificar o motor atualmente autoritativo;
2. verificar se o problema é de dados, geometria, rolagem ou interação;
3. corrigir a causa no motor autoritativo;
4. não adicionar outro renderer para mascarar o problema;
5. testar intervalos de 30 e 60 minutos;
6. testar serviços de 30, 60, 75, 120 e 210 minutos;
7. testar S.O.S. ativo e S.O.S. confirmado;
8. testar rolagem até o final do expediente;
9. somente então considerar a etapa aprovada.

## 7. Arquivo autoritativo atual
`assets/js/agenda-authoritative-grid-fix.js`

O `agenda-sos-runtime-sync.js` carrega este motor com versionamento de cache. O antigo `agenda-web-integrity-final.js` permanece fora do fluxo de execução para evitar múltiplos motores de `rowspan`.
