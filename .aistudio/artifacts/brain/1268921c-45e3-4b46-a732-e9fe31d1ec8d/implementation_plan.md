# Plano de Implementação: Controle de Porções Prontas & Lançamento de Gastos Diretos

Ajuste do modelo de gestão para a categoria de porções ("Mini coxinhas", "Bolinhos de mandioca", "Risoles", "Mandioca com torresmo"). Em vez de exigir fichas técnicas complexas detalhando farinha, temperos ou carne desfiada, essas porções passam a ser controladas diretamente por **unidade de porção pronta** no estoque e no cardápio com custo unitário direto. Os insumos de espetinhos e carnes permanecem 100% como estão, e todos os dados já cadastrados pelo usuário no GitHub/localStorage serão mantidos sem perda.

---

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> 1. **Porções Prontas no Estoque**: As porções (*Mini coxinhas*, *Bolinhos de mandioca*, *Risoles*, *Mandioca com torresmo*) serão controladas por saldo de porções em estoque. Seus custos unitários serão informados diretamente na porção, sem exigir receitas fracionadas de ingredientes básicos.
> 2. **Espetinhos & Carnes Preservados**: A estrutura de insumos de carnes (contrafilé, frango, copa lombo, pão de alho, queijo coalho, etc.) continuará exatamente como está.
> 3. **Lançamento de Gastos Flexível**: Abertura de opção clara para registrar compras de porções e gastos operacionais diretamente via botão "Lançar Despesa" e "Registrar Compra", sem dependência de recalcular receitas do cardápio.
> 4. **Preservação de Dados de Produção**: Nenhuma alteração irá resetar ou sobrescrever os dados, contas e fechamentos já salvos pelo usuário no `localStorage`.

---

## 1. Visão Geral das Alterações

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ESTRUTURA DE ESTOQUE E CUSTOS                      │
├─────────────────────────────────────┬───────────────────────────────────┤
│ ESPETINHO E CARNES (Mantidos)       │ PORÇÕES PRONTAS (Simplificados)   │
│ • Insumos Brutos (kg/un)            │ • Mini Coxinhas (porção)          │
│ • Ficha técnica por espetinho       │ • Bolinhos de Mandioca (porção)   │
│ • Baixa automática por ingrediente  │ • Risoles (porção)                │
│                                     │ • Mandioca com Torresmo (porção)  │
│                                     │ ➔ Custo unitário informado direto │
│                                     │ ➔ Saldo por número de porções     │
└─────────────────────────────────────┴───────────────────────────────────┘
```

---

## 2. Ajustes nos Módulos e Interface (UX)

### A. Cardápio e Custos (`MenuAndCostsPage` & `ProductRecipeModal`)
- Permitir marcar porções como **"Produto Final Pronto"** com custo unitário direto (ex: R$ 8,00 por porção pronta).
- O status de custo para essas porções torna-se **Confirmado** assim que o custo unitário por porção for preenchido, eliminando o aviso de "Custo Incompleto".

### B. Estoque e Insumos (`StockPage`)
- Garantir que as porções prontas estejam listadas como itens de estoque com unidade `porcao` ou `un`.
- Permitir atualizar a quantidade de porções em estoque diretamente na tela de estoque ou via modal de **Contagem de Inventário**.
- Remover dependência de sub-ingredientes para porções sem afetar a lista de carnes/espetinhos.

### C. Lançamento Direto de Compras e Gastos (`NewPurchaseModal` & `NewExpenseModal`)
- Facilitar a compra de porções prontas no modal de compras escolhendo a porção diretamente no estoque e informando o valor total/quantidade.
- Dar destaque ao botão de **Lançar Despesa** em todas as telas para registrar custos operacionais imediatamente sem passar pelo cardápio.

### D. Compatibilidade e Migração Transparente (`BusinessContext` & `initialData`)
- Atualizar a função de migração inicial para que dados já gravados no navegador do usuário (`xama_business_data_v1`) não sejam corrompidos.
- Se o usuário já adicionou contas ou estoque real no GitHub/navegador, o sistema mescla as melhorias mantendo todos os números e registros existentes intactos.

---

## 3. Arquitetura e Fluxo de Dados

```
[ Usuário compra porções ou lança gasto ] 
                 │
                 ├──► Lançar Despesa / Compra ──► Atualiza Fluxo de Caixa (Financeiro)
                 │
                 └──► Venda da Porção (POS) ────► Baixa 1x porção no Estoque (sem travar por receita)
                                              └──► Congela Preço e Custo Direto da Porção
```

---

## 4. Plano de Verificação

1. **Compilação e Linter**: Executar `compile_applet` e `lint_applet` para garantir 0 erros de TypeScript.
2. **Suíte de Testes E2E**: Garantir que todos os 9 passos da suíte de precisão determinística continuem passando com 100% de sucesso.
3. **Persistência do Usuário**: Verificar que a chave `xama_business_data_v1` preserva as alterações de produção do usuário.
