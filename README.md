# Calculadora de Grau — Ragnarök Online

Calculadora completa para o **Sistema de Grau** e **Refinamento** de Ragnarök Online (bRO) — sem dependências, sem instalação, sem servidor.

**Estrutura do projeto:**
- `index.html` — estrutura da página
- `styles.css` — visual/tema
- `app.js` — dados, cálculos e interações (tours, passos progressivos, boas-vindas)

## Como usar

**Online:** acesse `(https://fwksyt.github.io/calculadora_grau/)`

**Local:** basta abrir o arquivo `index.html` em qualquer navegador moderno. Tudo roda localmente no seu navegador.

## Funcionalidades

### 1. Calculadora de Grau

Calcula a chance de sucesso e o custo de subir o grau de um equipamento (Sem Grau → D → C → B → A):

- **Grau atual e alvo livres** — calcule uma etapa única ou a jornada completa (ex.: Sem Grau → Grau A). Cada transição usa seu próprio material (Aquamarina, Topázio, Ametista ou Âmbar de Éter) e taxa de NPC; na jornada com várias etapas o resultado mostra a chance de cada uma, a chance de chegar ao alvo sem falhar e os totais esperados de tentativas, materiais e zeny. No processo Normal, o cálculo considera que uma falha destrói o item e obriga a refazer as etapas anteriores.
- **Nível de refino** — a chance base depende do refino do item (mínimo +9 a +11, conforme a transição).
- **Evento de Grau** — alterna entre as chances normais e as chances aumentadas de evento.
- **Processo Normal vs. Seguro** — no normal a falha **destrói o item** (1× materiais); no seguro o item é preservado, mas gasta 5× (ou 10×) mais materiais e taxa.
- **Bênção de Éter** — bônus de até +10% na chance (a quantidade necessária por 1% varia por transição).
- **Custo por tentativa e custo esperado** — soma taxas de NPC, craft das gemas de Éter e, opcionalmente, preços de mercado que você informa (Pó de Éter, gema e Bênção de Éter). O custo esperado usa o número médio de tentativas (100 / chance).

### 2. Simulador de Refino (item gradeado)

Simula a jornada de refino de +X até +Y usando uma **cadeia de Markov** (resolvida por eliminação de Gauss), o que dá o número *exato* esperado de tentativas, minérios e custo — não uma aproximação por simulação aleatória:

- **Arma Nv.5 ou Armadura Nv.2**, com ou sem Evento de Refino.
- **Escolha de minério por faixa** — Comum (−3 refinos na falha) ou Enriquecido (−1) até +9; Comum ou Perfeito de +10 em diante (falha destrói o item).
- **Bênção do Ferreiro (BSB)** — segura o refino no trecho +7 a +13 (configurável), com custo por tentativa ajustável.
- **Crafto vs. Compro pronto** — calcula o custo do minério a partir do minério-base + Pó de Éter + taxa de NPC, ou usando o preço do minério já pronto.
- **Resultado** — tentativas esperadas, minérios por tipo, BSB e Pó de Éter consumidos, e custo total. Quando há risco de quebra, mostra a chance de um item chegar ao alvo e quantos itens são consumidos em média para garantir 1 no refino desejado.

### 3. Tabelas de referência

- **Tabela de chances de Grau** por refino (+9 a +20), com e sem evento, destacando o seu refino atual.
- **Tabela de chances de Refinamento** (+1 a +20) para minérios comuns e especiais, com penalidade de falha por faixa.
- **Receitas dos minérios de Éter** (Eteridecon, Eterium, Bradium/Carnium etc.) com custo de NPC e materiais.
- **Sidebar de itens** com links diretos para o [Divine Pride](https://www.divine-pride.net/) de todos os materiais.

## Preços de mercado

Todos os campos de preço são **opcionais**: sem eles a calculadora mostra apenas os custos fixos de NPC. Os valores são formatados automaticamente (separador de milhar) e os preços do simulador ficam guardados em cache durante a sessão, mesmo trocando as opções de configuração.

## Fontes dos dados

- Chances e mecânicas: [bROWiki — Grau](https://browiki.org/wiki/Grau) e [bROWiki — Refinamento](https://browiki.org/wiki/Refinamento)
- Ícones e banco de itens: [Divine Pride](https://www.divine-pride.net/)

> **Nota:** as chances e taxas podem mudar com atualizações do servidor. Confira sempre a bROWiki em caso de dúvida.

## Tecnologias

HTML, CSS e JavaScript puros — nenhuma biblioteca ou framework (apenas a fonte Inter via Google Fonts e ícones do Divine Pride, carregados online; a calculadora funciona mesmo sem internet, só sem ícones).

## Recursos de usabilidade

- **Boas-vindas na primeira visita** com atalho para o tour guiado.
- **Tours "Ver na prática"** (menu lateral ou botão **?** flutuante): a calculadora se preenche sozinha, passo a passo, explicando cada campo.
- **Passos progressivos** (1 Configuração → 2 Preços → 3 Resultado): as etapas seguintes se revelam conforme você usa — apenas na primeira visita; depois tudo fica aberto.
- **Meus Links** na sidebar: espaço para seus links e referências (edite o `index.html`, grupo `my-links`).
