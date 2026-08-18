# BeautyMove MVP Web — Auditoria de Arquitetura

Data: 2026-08-18

## Objetivo

Reorganizar o MVP sem remover funcionalidades aprovadas e sem substituir a interface legada da Agenda de forma arriscada.

## Estado atual

- Interface principal publicada via GitHub Pages.
- Branch de restauração: `refactor/clean-architecture-2026-08-18`.
- A Agenda mantém a interface aprovada e recebe uma camada canônica de dados.
- `BeautyMoveData` é a fronteira oficial para estado local do MVP.
- O módulo `BeautyMoveAgendaStorage` funciona como ponte de compatibilidade para o controlador legado da Agenda.
- A Central S.O.S. e os módulos de sincronização emitem eventos para manter grade, painel e métricas coerentes.
- Autenticação usa Firebase como backend primário; o cache de sessão permanece local no navegador.

## Problemas identificados

### 1. Estado duplicado

Partes antigas do projeto gravavam diretamente em `localStorage`, enquanto os módulos novos utilizavam `BeautyMoveData`. Isso permitia que a Agenda e o painel S.O.S. exibissem estados diferentes.

**Correção em andamento:** os helpers centrais de `app.js` passaram a delegar leitura/escrita para `BeautyMoveData` quando disponível. O bridge da Agenda já faz o mesmo para o controlador legado.

### 2. Cache de navegador

O projeto usa arquivos JavaScript versionados por query string. Alterações sem incremento da versão podem não aparecer imediatamente no navegador.

**Regra:** toda alteração de JS/CSS carregada pela página deve receber nova versão ou outro mecanismo explícito de cache busting antes do teste final.

### 3. Agenda legada + arquitetura nova

Não será feita uma reescrita integral da Agenda neste momento. O risco de perder comportamentos já aprovados é maior que o benefício.

**Estratégia:** estabilizar por camadas, testar cada contrato e somente depois remover código legado comprovadamente redundante.

### 4. Persistência de negócio

O fluxo de autenticação já utiliza Firebase, mas o estado operacional da Agenda/S.O.S. ainda possui dependência forte do armazenamento local do navegador. Isso é aceitável para o estágio de protótipo funcional controlado, mas não é a arquitetura final de produção multiusuário.

**Decisão:** não migrar tudo para Firestore durante esta rodada de estabilização. Primeiro garantir consistência do fluxo local e dos contratos. A migração de dados operacionais para Firestore será uma etapa própria.

## Ordem de estabilização

1. Uma única fronteira de estado.
2. Sincronização Agenda ↔ S.O.S. ↔ métricas.
3. Compatibilidade com dados já existentes.
4. Cache busting controlado.
5. Auditoria de autenticação/cadastro.
6. Auditoria dos fluxos Salão → S.O.S. → Profissional.
7. Teste integrado completo.
8. Só então limpeza de código redundante.

## Critério para liberar testes

A fase de teste só será liberada quando:

- a Agenda abrir sem erro;
- o estado existente permanecer intacto;
- uma oportunidade S.O.S. aparecer de forma consistente no painel e na Agenda;
- a seleção de profissional atualizar o estado e as métricas;
- os dados de cadastro continuarem compatíveis com senha de confirmação e múltiplas especialidades do salão;
- nenhuma alteração visual aprovada tiver sido removida;
- a branch de restauração continuar preservada.

## Regra de segurança

Nenhum código antigo será apagado apenas porque existe uma implementação nova. A remoção somente ocorrerá depois de comprovar que o novo módulo cobre o mesmo contrato e que o fluxo correspondente passou pelos testes.
