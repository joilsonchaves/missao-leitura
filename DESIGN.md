# Missão Leitura — direção de design

Uma aventura de alfabetização para crianças do 1º e 2º ano, conduzida pela professora. A identidade combina peças de letras, um caminho de descobertas e os animalzinhos leitores já presentes no jogo.

## Sistema visual

- Azul de leitura `#233454`: texto, contornos e estrutura.
- Violeta de missão `#6C45D9`: ação principal e seleção.
- Verde de descoberta `#36D4AD`: acerto e construção.
- Amarelo de conquista `#FFC857`: estrelas e metas.
- Coral de companhia `#FF7D69`: personagens e detalhes.
- Papel de sala `#F4F7FC`: fundo; branco nas áreas de leitura.

Baloo 2 nos títulos dá personalidade de jogo de letras; Nunito nos controles e na leitura mantém formas abertas e legíveis. As palavras de treino continuam grandes, com contraste e espaço livre.

## Composição

```text
Capa
[Marca]
[Ler é uma aventura.]    [Livro + leitores + caminho A / BA / BALA]
[Convite curto]
[Começar a missão]
[Crédito do professor]

Dentro do jogo
[Marca] [Navegação por áreas]
[Voltar] [Escolher atividade]
[Título da área]
[Configurar aluno]       [Leitura ampla e silenciosa visualmente]
                         [Progresso] [Registrar leitura]
                         [Tempo e pavio]

Primeiros passos
[Apresentação curta]
[Praticar / Cartelas / Acompanhar]
[Trilha de sete atividades: peças grandes com rótulos]
[Configurar aluno]       [Uma descoberta por vez]
```

Títulos e formulários alinhados à esquerda; palavras, sílabas e figuras centralizadas. O painel da professora usa linhas e grupos de dados, com menos decoração que o espaço da criança.

## Revisão antes de implementar

A primeira hipótese era aplicar cartões coloridos a todas as áreas. Isso repetiria o padrão atual e reduziria o foco da leitura. A versão escolhida concentra o caráter de jogo na ilustração da capa, na trilha de atividades e no relevo dos botões. O palco de leitura fica branco e tranquilo. As cores indicam ações, escolhas e conquistas; não são distribuídas como enfeite em todo componente.

Não haverá níveis ficticiamente bloqueados, medalhas inventadas nem pontuação nova. O avanço e as estrelas continuam usando os registros existentes. As sete atividades permanecem acessíveis à escolha da professora, e o modo tranquilo reduz os estímulos. Interações respondem ao toque; não haverá animações contínuas decorativas.

## Conferência

Verificar capa, missão de palavras, frase em escadinha, primeiros passos, turmas, mural, cartela ampliada, teclado, tela pequena, modo tranquilo, tela cheia e projeção. Preservar os IDs e controles de gravação, avaliação, turmas e navegação. Rodar os testes existentes e conferir a apresentação no navegador antes de publicar.

## Ajustes após as sugestões e a conferência

A configuração foi dividida em campos essenciais e ajustes recolhidos. A área da professora virou um menu separado; a missão em andamento esconde sua configuração e leva a tela à leitura. A trilha é colorida, com o modo tranquilo preservado quando já escolhido. A comemoração usa o avatar real, troféu e uma explosão curta de estrelas decorativas; somente estrelas realmente obtidas aparecem na contagem. Sons opcionais e redução de movimento são respeitados. A voz recomendada dá prioridade a vozes naturais pt-BR disponíveis no navegador, com seleção e teste antes da atividade.

Conferência no navegador: capa e trilha; rodada real com dados fictícios; conquista de uma estrela; cartões sem misturar com pontuação das palavras; teste de uma voz Google português do Brasil Natural; largura de 390 px sem rolagem horizontal, após corrigir o menu. Testes automatizados cobrem nav, turmas, voz, pontuação, comemoração única e histórico sem repetição do efeito.
