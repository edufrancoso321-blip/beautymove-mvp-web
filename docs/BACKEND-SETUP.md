# BeautyMove MVP — Backend Setup

## Objetivo

Migrar o MVP do armazenamento local para um backend compartilhado, mantendo o desenvolvimento dentro da camada gratuita enquanto ela atender ao volume do MVP.

## Serviço escolhido

Firebase, usando Authentication + Cloud Firestore.

O código do frontend deve conter somente a configuração web pública do Firebase (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`). Nunca inserir service-account JSON, private key ou secret no repositório.

## Etapa única fora do código

1. Criar um projeto no Firebase Console.
2. Registrar um aplicativo Web.
3. Ativar Authentication.
4. Para o MVP inicial, ativar Email/Password e, se necessário para testes, Anonymous.
5. Criar o Cloud Firestore em produção.
6. Copiar a configuração do aplicativo Web para `assets/js/firebase-config.js`.
7. Definir `window.BEAUTYMOVE_BACKEND_ENABLED = true` somente depois de as regras do Firestore estarem publicadas.

## Estrutura de dados prevista

- `users/{uid}` — identidade e papel (`salao`, `profissional`, `cliente`)
- `salons/{salonId}` — dados do salão
- `professionals/{professionalId}` — dados profissionais
- `clients/{clientId}` — dados do cliente
- `appointments/{appointmentId}` — agenda compartilhada
- `opportunities/{opportunityId}` — S.O.S. Profissional
- `transactions/{transactionId}` — financeiro simples do profissional

## Regra de arquitetura

A interface não deve acessar Firestore diretamente. O acesso deve passar pelo adaptador de dados. Isso permite testar o MVP localmente e substituir o armazenamento sem reescrever as telas.

## Segurança

A configuração Web do Firebase não é segredo. As regras do Firestore e a autenticação são a barreira de segurança. Nunca colocar credenciais administrativas no frontend.

## Estado atual

O projeto já possui:

- `assets/js/firebase-config.js` — configuração preparada, sem credenciais;
- `assets/js/data.js` — fronteira de dados com fallback local;
- `build/mvp-v1` — branch de desenvolvimento isolada do `main`.

A conexão real fica bloqueada até existir o projeto Firebase e sua configuração Web. Isso é intencional: não devemos fingir que há backend quando ainda não há um projeto remoto.
