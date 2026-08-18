# BeautyMove — Bloco de estabilização da camada de dados

Objetivo: estabilizar persistência, leitura e estados derivados do Firestore sem alterar o layout ou o fluxo aprovado do MVP.

## Regras do bloco
- Firestore é a fonte de verdade para dados persistentes.
- Estados derivados da Agenda/S.O.S. não devem alternar entre valores por efeitos locais concorrentes.
- A interface deve renderizar o mesmo estado até que uma mudança persistida seja confirmada.
- Alterações visuais ficam fora deste bloco.
- Qualquer mudança de esquema deve preservar compatibilidade com documentos existentes.
