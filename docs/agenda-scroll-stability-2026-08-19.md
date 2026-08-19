# Agenda — estabilidade da rolagem

A rolagem vertical da Agenda deve ocorrer exclusivamente em `.agenda-scroll-v2`.
Os ancestrais da grade não devem criar mecanismos de rolagem que interfiram no `position: sticky` do cabeçalho.

Correção de 2026-08-19: substituir `overflow: hidden` por `overflow: clip` em `.salon-app`, `.salon-main` e `.agenda-shell-v2` na camada final do cabeçalho, preservando o recorte visual sem criar ancestrais de rolagem adicionais.
