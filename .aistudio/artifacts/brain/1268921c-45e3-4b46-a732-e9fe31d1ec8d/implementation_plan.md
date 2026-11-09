# Xama Business Core — Sistema de Gestão Xamã na Brasa

Sistema operacional e de gestão interna completo, determinístico e offline-first para o negócio **Xamã na Brasa**, reunindo controle de vendas, fechamento diário de caixa, contas a pagar e receber, fichas técnicas com cálculo exato de CMV, controle de estoque com contagem física, compras e relatórios comparativos, tudo com estética Liquid Glass e fundo claro.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisões operacionais confirmadas com o usuário para a versão inicial do Xama Business Core:

- **Baixa de Estoque nas Vendas**: Baixa automática para receitas com ficha técnica e ingredientes mapeados; quando houver ingredientes pendentes ou receita incompleta, a venda registra o valor financeiro normalmente, sinaliza claramente quais insumos não foram baixados e permite conferência/ajuste manual rápido.
- **Estado Inicial do Estoque**: Produtos e insumos da especificação iniciam cadastrados com status **"Não contado"**, sem inventar quantidades zeradas ou fictícias até a realização da primeira contagem física no módulo de Estoque.
- **Fechamento de Caixa Diário**: O fechamento calcula o saldo esperado em gaveta física (dinheiro em espécie) separando também os totais consolidados por método de pagamento (PIX, Cartão Débito, Cartão Crédito, Dinheiro), permitindo conferência e registro de sobras ou faltas com justificativa.

---

## 1. Overview & Core Concept

- **O Que Faz**: Centraliza a operação do Xamã na Brasa em um ambiente desktop limpo e veloz. Permite registrar vendas com preço congelado no momento da transação, gerenciar contas a pagar/receber e despesas operacionais recorrentes (aluguel, energia, botijão de gás, carvão com cálculo por dia trabalhado), calcular CMV e margens brutas/líquidas reais sem números inventados, acompanhar fichas técnicas e realizar conferências de estoque.
- **Público-Alvo**: Gestor e operador do Xamã na Brasa em terminal desktop no ponto comercial ou escritório local, sem dependência de internet ou inteligência artificial para cálculos.
- **Valor Principal**: Transparência matemática total (fórmulas explícitas, zero divisão por zero, diferenciação clara entre fluxo de caixa financeiro e competência econômica) e continuidade operacional imediata, mesmo com fichas técnicas parciais.

---

## 2. User Experience & Visual Design

### Navegação e Páginas

A interface utiliza barra de navegação lateral fixa (260px) com acesso direto aos 8 módulos do sistema:
1. **Visão Geral (Dashboard)**: Indicadores do dia/período selecionado (Vendas brutas, Vendas líquidas, CMV apurado, Lucro bruto, Despesas lançadas, Lucro líquido, Entradas/Saídas de caixa, Saldo em gaveta, itens com estoque crítico e alertas de dados pendentes).
2. **Vendas (PDV & Registro)**: Lançamento manual ágil de itens, seleção de produto, preço praticado, desconto, forma de pagamento (Dinheiro, PIX, Débito, Crédito), canal de venda, observações, histórico de vendas do dia com opção de cancelamento auditado e indicador de baixa de receita.
3. **Financeiro**: Contas a pagar (com status Pendente/Pago e vencimento), despesas fixas e variáveis com categorias nativas (Aluguel, Energia, Gás, Carvão, Ingredientes, Bebidas, Embalagens, Manutenção, Outros), fluxo de caixa consolidado e ferramenta de Fechamento Diário de Caixa.
4. **Estoque**: Tabela com filtros por categoria (Carnes, Bebidas, Ingredientes, Porções/Preparados, Embalagens, Outros), badges de status real (Não contado, Normal, Baixo, Crítico), modal de contagem física com cálculo automático de variação/quebra e movimentações de entrada, perda e ajuste.
5. **Cardápio e Custos**: Cadastro e edição de produtos, fichas técnicas detalhadas com múltiplos insumos e rendimento de porções, cálculo de custo unitário, margem bruta percentual e monetária, e exibição explícita de "Custo incompleto" quando faltarem insumos cadastrados.
6. **Compras**: Registro de compras com data, fornecedor, quantidade, valor total, método de pagamento e opção de gerar saída imediata no caixa ou conta a pagar, além de entrada correspondente no estoque.
7. **Relatórios e Estimativas**: Filtros flexíveis por Dia, Semana, Mês ou Intervalo Personalizado. Demonstrativo de Resultado (DRE simplificado), vendas por produto/categoria, perdas de estoque e estimativa determinística de vendas baseada na média de dias equivalentes (ex.: média de sábados operados).
8. **Configurações e Backup**: Exportação segura em arquivo JSON local com carimbo de data/hora, restauração de backup com verificação de integridade, definição de saldo inicial de caixa e parâmetros de dias de operação mensal.

### Identidade Visual & Design System

- **Estética Liquid Glass**: Fundo branco aquecido (`#FAF9F6` / `bg-stone-50`), painéis translúcidos em vidro suave (`bg-white/80 backdrop-blur-md border border-stone-200/70 shadow-sm`), cantos arredondados moderados (`rounded-xl` e `rounded-2xl`).
- **Paleta Inspirada em Brasa**:
  - *Carvão Neutro*: `#1C1917` (Stone 900) para tipografia principal de alto contraste e `#44403C` (Stone 700) para textos secundários.
  - *Cobre & Âmbar*: `#D97706` (Amber 600) e `#C2410C` (Orange 700) aplicados com estrita parcimônia em botões de ação primária, estados ativos e destaques essenciais.
  - *Verde Sálvia/Esmeralda*: `#15803D` (Green 700) para saldos positivos e lucro.
  - *Carmesim*: `#B91C1C` (Red 700) para despesas, quebras e alertas.
- **Tipografia**: `Plus Jakarta Sans` para display e corpo, combinada com numerais tabulares e mono (`JetBrains Mono` / `tabular-nums`) em todas as tabelas financeiras, listas de preços e métricas.
- **Zero-Pill & Sem Pseudo-Código**: Sem caixas de pílula decorativas para textos estáticos; metadados utilizam separadores tipográficos limpos (`·`). Botões de filtro utilizam controles segmentados funcionais.

---

## 3. Key Product Decisions & Trade-Offs

- **Armazenamento 100% Local (Local-First Persistence)**:
  - *Decisão*: Todos os dados são gerenciados em estado reativo sincronizado com `localStorage`, permitindo funcionamento ininterrupto sem conexão de internet e sem latência de rede.
  - *Por quê*: O estabelecimento físico não pode parar se o sinal cair durante a operação da noite.
  - *Backup*: Um clique gera download de arquivo `.json` com timestamp legível, e restauração imediata com modal de confirmação para prevenir perdas acidentais.
- **Congelamento de Histórico (Historical Snapshot)**:
  - *Decisão*: Quando uma venda ou compra é realizada, o custo unitário e preço de venda são gravados diretamente no registro do movimento.
  - *Por quê*: Alterar o preço de um espetinho de R$ 8 para R$ 10 no cardápio na próxima semana não pode recalcular as vendas realizadas no mês anterior.
- **Cálculo de CMV Rigoroso e Alerta de Lacunas**:
  - *Decisão*: Se uma receita tem ingrediente sem custo informado (ex: cheddar da batata frita ou Coca-Cola 2L), o CMV é exibido como "Custo incompleto", com breakdown dos componentes conhecidos e o que falta preencher.
  - *Por quê*: Princípio 4 da especificação: sem números inventados.
- **Diferenciação de Fluxo de Caixa vs. Competência**:
  - *Decisão*: A Visão Geral e os Relatórios apresentam claramente o Lucro Líquido (Receitas líquidas - CMV apurado - Despesas do período) e o Fluxo de Caixa (Entradas em dinheiro/contas recebidas - Saídas pagas).

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        XAMA BUSINESS CORE                              │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Sidebar Navigation  │  │  Top Bar (Data/Período + Ações Rápidas)│  │
│  └──────────┬────────────┘  └──────────────────┬────────────────────┘  │
│             │                                  │                       │
│             ▼                                  ▼                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                          Views Router                            │  │
│  │  [Visão Geral] [Vendas] [Financeiro] [Estoque]                   │  │
│  │  [Cardápio & Custos] [Compras] [Relatórios] [Configurações]      │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│             ┌───────────────────────┴───────────────────────┐          │
│             ▼                                               ▼          │
│  ┌───────────────────────┐                     ┌─────────────────────┐ │
│  │ Deterministic Math    │                     │ Local State Store   │ │
│  │ - Vendas Líquidas     │                     │ - Produtos/Receitas │ │
│  │ - CMV & Margem Bruta  │                     │ - Vendas Gravadas   │ │
│  │ - Lucro Líquido       │                     │ - Itens de Estoque  │ │
│  │ - Fluxo de Caixa      │                     │ - Contas e Despesas │ │
│  │ - Fechamento de Caixa │                     │ - Compras e Perdas  │ │
│  │ - Médias Determiníst. │                     │ - Histórico Preços  │ │
│  └───────────────────────┘                     └──────────┬──────────┘ │
│                                                           │            │
│                                                           ▼            │
│                                                ┌─────────────────────┐ │
│                                                │ LocalStorage Sync   │ │
│                                                │ & JSON Export/Import│ │
│                                                └─────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Initial Seed Data (Conforme Seção 6 e 7 da Especificação)

1. **Espetinhos**:
   - Espetinho de boi (R$ 8,00 | Custo R$ 4,20 | 100g fraldinha a R$ 42/kg)
   - Espetinho de porco (R$ 8,00 | Custo R$ 1,65 ref. média 1,30-2,00 | 100g carne suína)
   - Medalhão de mussarela e goiabada (R$ 10,00 | Custo R$ 5,00)
   - Espeto grande de costela com cebola (R$ 60,00 | Custo R$ 15,00 | 1kg costela + 2 cebolas)
2. **Porções e Alimentos**:
   - Batata frita com cheddar (R$ 25,00 | Custo Batata R$ 6,80 ref. faixa R$ 14-20/kg; cheddar não informado: **Custo incompleto**)
   - Mini coxinha (R$ 25,00 / porção 25 un | Custo R$ 1,79 porção de receita de R$ 25 / 350 un)
   - Bolinho de mandioca (R$ 25,00 / porção 25 un | Custo R$ 2,50 porção)
   - Mini risole (R$ 25,00 / porção 20 un | Custo R$ 2,00 porção)
   - Mandioca com torresmo (R$ 25,00 | Custo R$ 3,40 | 400g mandioca + 100g torresmo)
   - Feijão tropeiro (R$ 12,00 | Custo R$ 2,86 ref. faixa R$ 2,67-3,08)
   - Mini pizza (R$ 5,00 | Custo R$ 1,10)
   - Coxinha grande (R$ 5,00 | Custo R$ 0,58)
   - Bolinho de mandioca com carne (R$ 5,00 | **Custo não informado**)
   - Bolo de mandioca grande (**Preço de venda não informado** | Custo R$ 1,00 un)
3. **Bebidas**:
   - Brahma garrafa (Venda R$ 5,00 | Custo R$ 2,92)
   - Original garrafa (Venda R$ 6,00 | Custo R$ 3,67)
   - Skol garrafa (Venda R$ 6,00 | Custo R$ 3,54)
   - Heineken garrafa (Venda R$ 10,00 | Custo R$ 8,25)
   - Água garrafa (Venda R$ 3,00 | Custo R$ 1,17)
   - Água com gás garrafa (Venda R$ 4,00 | Custo R$ 1,42)
   - Refri Iate 2L (Venda R$ 8,00 | Custo R$ 5,33)
   - Coca-Cola lata (Venda R$ 5,00 | Custo R$ 3,75)
   - Coca-Cola Zero lata (Venda R$ 5,00 | Custo R$ 3,75)
   - Coca-Cola original 2L (Venda R$ 15,00 | **Custo não informado**)
   - Dose de pinga (Venda R$ 3,00 | **Custo e rendimento não informados**)
4. **Despesas Operacionais Recorrentes**:
   - Aluguel: R$ 300,00/mês
   - Energia: R$ 150,00/mês (estimada)
   - Gás (botijão): R$ 135,00 a cada 30 dias
   - Carvão: 1 saco/dia (R$ 10,80/saco em pacote de 5 por R$ 54; R$ 324/mês em 30 dias operados)
   - Total base: ~R$ 909,00/mês calculável conforme dias reais de operação.
5. **Estoque Inicial**:
   - Itens inicializados como `uncounted` (Não contado), com estoque mínimo parametrizável e fluxo direto para contagem de inventário.

---

## 5. Verification & Validation Steps

1. **Validação de Interface**: Renderização da barra lateral e navegação fluida entre todas as 8 páginas com preservação de filtros.
2. **Registro de Venda & Baixa de Estoque**: Testar lançamento de venda de produto com ficha técnica completa e produto com custo incompleto, conferindo cálculo de total, desconto e alertas de estoque.
3. **Fechamento Diário de Caixa**: Conferência de saldo de abertura, lançamentos em dinheiro vs. cartão/PIX, valor contado e cálculo de divergência.
4. **Cálculo de CMV e Margens**: Testar produtos completos e incompletos garantindo que nenhum valor silencioso ou divisão por zero seja gerado.
5. **Contagem e Ajuste de Estoque**: Testar fluxo de inventário com registro de perdas e acertos de quantidade.
6. **Backup & Restore**: Testar download do JSON e recarregamento integral dos dados locais.
