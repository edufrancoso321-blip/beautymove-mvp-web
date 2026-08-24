# BeautyMove — Diretriz Oficial da Agenda Web e Mobile

**Status:** CONGELADA / APROVADA  
**Data:** 24/08/2026  
**Responsável técnico:** Tech Lead / Desenvolvimento BeautyMove

## 1. Decisão oficial

A partir desta data, a Agenda seguirá uma estratégia em três camadas:

1. **Estrutura responsiva preparada desde agora** — a base HTML/CSS da Agenda deve ser construída com layout flexível e pontos de quebra definidos, sem tentar encaixar o desktop à força no celular.
2. **Conclusão funcional da Agenda Web/Desktop** — o desenvolvimento principal avança primeiro na experiência desktop, onde a Agenda comporta múltiplos profissionais e permite validar toda a estrutura e as funções.
3. **Etapa dedicada de Mobile posteriormente** — depois de estabilizada a Agenda Web, será criada a experiência mobile diária, com layout próprio para telas pequenas.

Esta decisão substitui a abordagem de correções contínuas e pontuais de responsividade durante cada alteração da Agenda.

## 2. O que fica congelado

### Mobile

- A Agenda mobile será **diária**.
- A Agenda semanal **não será disponibilizada no celular**.
- O cabeçalho mobile terá a **data do dia** e controles para mudar a data.
- A visualização mobile deverá permitir **rolagem vertical** dos horários.
- Quando houver mais de um profissional/coluna, a visualização poderá utilizar **rolagem horizontal controlada**, sem sobreposição.
- Especialidade, profissional e conteúdo da grade deverão permanecer dentro de suas respectivas áreas.
- O mobile não será uma versão desktop simplesmente comprimida.

### Desktop/Web

- A Agenda Web continua sendo desenvolvida como a referência funcional para múltiplos profissionais.
- A grade deverá suportar especialidades, profissionais, horários, status e S.O.S. sem sobreposição.
- A rolagem horizontal e vertical deve ser estruturalmente independente quando necessária.
- O cabeçalho da Agenda e a navegação de data devem permanecer organizados e independentes da grade.

## 3. Ordem de desenvolvimento

### Fase A — Estrutura Web

Estabilizar:

- cabeçalho da Agenda;
- navegação de datas;
- seletor de profissionais;
- especialidades;
- profissionais;
- grade de horários;
- rolagem horizontal/vertical;
- estados da agenda;
- bloco S.O.S.;
- legenda.

### Fase B — Funcionalidades Web

Implementar e validar as interações reais da Agenda sem reabrir decisões já congeladas.

### Fase C — Mobile

Após a Agenda Web estar funcional e estruturalmente estável:

- aplicar layout mobile próprio;
- priorizar a agenda do dia;
- manter mudança de data no cabeçalho;
- eliminar sobreposições;
- validar rolagem vertical;
- validar rolagem horizontal quando necessária;
- validar a experiência em telas pequenas.

### Fase D — Teste cruzado

Validar a mesma Agenda em:

- desktop;
- notebook;
- tablet;
- Android;
- iPhone.

## 4. Regra contra retrabalho

Nenhuma nova funcionalidade da Agenda deve ser implementada criando exceções específicas para um único tamanho de tela.

Sempre que uma alteração estrutural for necessária, ela deverá ser feita na base compartilhada e testada novamente no desktop e no mobile posteriormente.

Correções cosméticas isoladas no mobile ficam congeladas até a Fase C, salvo se uma falha impedir a utilização ou comprometer a estrutura compartilhada.

## 5. Critério de aceitação

A Agenda somente será considerada responsiva quando:

- não houver sobreposição entre especialidade e profissional;
- nenhum conteúdo invadir outra coluna;
- os horários permanecerem alinhados;
- as barras de rolagem funcionarem de forma previsível;
- os controles de data permanecerem acessíveis;
- a grade puder ser utilizada sem depender de zoom manual;
- desktop e mobile apresentarem experiências adequadas ao respectivo tamanho de tela.

## 6. Princípio técnico

**Desktop primeiro para concluir a lógica; responsividade preparada desde a arquitetura; mobile depois como experiência própria.**

O objetivo desta diretriz é reduzir retrabalho, preservar o que já foi aprovado e evitar que cada nova função da Agenda gere uma nova rodada de correções de responsividade.

## 7. Regra de governança

Esta diretriz está congelada. Qualquer mudança nela deverá ser deliberada explicitamente antes de alterar a implementação.
