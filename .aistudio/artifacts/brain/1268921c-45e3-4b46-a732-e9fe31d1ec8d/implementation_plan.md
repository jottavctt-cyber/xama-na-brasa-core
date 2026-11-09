# Plano de Implementação: Sincronização do Fechamento de Caixa com o Caixa Total

Ajustar a lógica do **Fechamento de Caixa Diário** para que a contagem física da gaveta atualize diretamente e de forma determinística o valor do **Caixa Total Atual**, registrando ajustes de sobra ou quebra de caixa.

---

## 1. Mudanças Propostas

### `src/context/BusinessContext.tsx`
- Atualizar a função `recordCashClosing`:
  - Calcular a divergência entre o valor contado na gaveta e o valor esperado (`difference = countedCashInDrawer - expectedCashInDrawer`).
  - Se houver **sobra de caixa** (`difference > 0`), registrar automaticamente uma transação financeira de receita (`type: 'receita'`, `category: 'Outros'`, `description: 'Ajuste - Sobra de Caixa'`, `status: 'pago'`).
  - Se houver **quebra/falta de caixa** (`difference < 0`), registrar automaticamente uma transação financeira de despesa (`type: 'despesa'`, `category: 'Outros'`, `description: 'Ajuste - Quebra de Caixa'`, `status: 'pago'`).
  - Atualizar a preferência do fundo de caixa ou saldo base para o próximo período.

### `src/utils/deterministicMath.ts`
- Garantir que `calculateCurrentCashBalance` reflita os ajustes dos fechamentos de caixa registrados sem duplicação de valores.

### `src/components/modals/CashClosingModal.tsx`
- Exibir mensagem de confirmação ao usuário indicando que o saldo do caixa total foi atualizado com base no valor contado.

---

## 2. Validação e Testes
- Testar o fechamento com valor exato (sem divergência).
- Testar o fechamento com sobra de caixa (verificar se o Caixa Total aumenta proporcionalmente).
- Testar o fechamento com falta de caixa (verificar se o Caixa Total diminui proporcionalmente).
- Executar verificações TypeScript (`compile_applet` e `lint_applet`).
