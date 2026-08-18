# BeautyMove MVP Web — Arquitetura de Referência

## Princípio

O projeto deve crescer por módulos, mas cada regra de negócio deve possuir um único proprietário.

## Camadas

### 1. Pages
HTML apenas apresenta estrutura e pontos de montagem.

### 2. Controllers
Controlam eventos da tela e coordenam módulos. Não duplicam regras de persistência.

### 3. Domain
Funções puras para duração, valores, status, disponibilidade e seleção.

### 4. Data
`BeautyMoveData` é o limite entre interface e armazenamento.

### 5. Storage
Hoje: `localStorage` para o protótipo funcional.  
Backend: Firebase para autenticação e perfis, com migração gradual das entidades operacionais quando o MVP estiver validado.

## Agenda

A Agenda passa a ter um controlador principal e módulos de domínio:

```text
assets/js/agenda/
├── controller.js
├── appointments.js
├── services.js
├── professionals.js
├── sos.js
├── metrics.js
└── storage.js
```

A estrutura acima é o alvo arquitetural. Durante a migração, os arquivos históricos permanecem preservados até todos os testes passarem.

## Estado

Estado principal:

```js
{
  appointments: [],
  opportunities: [],
  transactions: [],
  professionals: [],
  salons: [],
  clients: [],
  users: []
}
```

A regra é: componentes visuais não escrevem diretamente no `localStorage`. Eles chamam a camada `BeautyMoveData`.

## S.O.S.

O S.O.S. terá quatro responsabilidades explícitas:

1. criar oportunidade;
2. listar oportunidade ativa;
3. selecionar profissional;
4. acompanhar atendimento resolvido.

A Central e a coluna S.O.S. devem consumir a mesma coleção de oportunidades. A métrica inferior deve ser derivada da mesma fonte, nunca de uma segunda heurística visual.

## Serviços

Existe um catálogo único de serviços com:

- id;
- especialidade;
- nome;
- preço ao cliente;
- oferta ao profissional;
- duração;
- ativo/inativo.

O snapshot dos serviços selecionados deve ser gravado na oportunidade/atendimento para preservar o histórico mesmo que o catálogo mude depois.

## Profissionais

O cadastro de profissionais e o controle diário de presença são conceitos diferentes:

- cadastro = quem é a profissional;
- status diário = presença, atraso ou ausência naquele dia.

O controle diário não deve alterar o cadastro.

## Métricas

As métricas devem ser funções derivadas do estado:

- atendimentos do dia;
- em andamento;
- S.O.S. ativos;
- cancelados.

Não usar polling agressivo para manter contadores. O controlador deve renderizar métricas quando o estado mudar.

## Segurança de mudança

Toda refatoração estrutural deve ocorrer em branch própria. `main` deve receber somente alterações validadas. GitHub recomenda branches para isolar mudanças e commits pequenos para permitir revisão e rollback. citeturn0search0
