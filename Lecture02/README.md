# 📖️ Leitura 2: Ray Tracing 
<div align="center">
    <img src="https://blogs.nvidia.com/wp-content/uploads/2022/03/path-tracing-ray-tracing-rasterization-672x353.png" alt="game Image" style="width: 100%;"/>
    <p>Fonte: <a href="https://blog.nvidia.com.br/blog/o-que-e-path-tracing/">NVIDIA</a></p>
</div>

## Índice

1. **[O que é Ray Tracing?](#-o-que-é-ray-tracing)**
   - Definição e funcionamento
   - Abordagem direta
   - Imagem ilustrativa

2. **[Diferença de Ray Tracing e Monte Carlo Ray Tracing](#-diferença-de-ray-tracing-e-monte-carlo-ray-tracing)**
   - Monte Carlo Ray Tracing
   - Amostragem aleatória
   - Iluminação global
   - Imagens ilustrativas

3. **[O que é Ray Tracing Denoising?](#-o-que-é-ray-tracing-denoising)**
   - Definição e importância
   - Técnicas de redução de ruído
   - Avanços recentes e exemplos

4. **[Denoisers Genéricos](#denoiser-genérico)**
   - Definição e importância
   - Técnicas comuns
   - Exemplos de aplicação

5. **[Soluções Internas ao Ray Tracing](#soluções-internas-ao-ray-tracing)**
   - Técnicas de filtragem
   - Impacto na qualidade da imagem

6. **[Soluções Externas ao Ray Tracing](#soluções-externas-ao-ray-tracing)**
   - Machine Learning
     - Abordagem e exemplos aplicados
     - Objetivo
   - Técnicas de Amostragem
     - Abordagem e exemplos aplicados
     - Objetivo
   - Comparação entre Machine Learning e Técnicas de Amostragem

7. **[Deep Learning Super Sampling (DLSS)](#deep-learning-super-sampling-dlss)**
   - Definição e funcionamento
   - Implementações e exemplos
   - Comparação com outras técnicas
   
8. **[Conclusão](#conclusão)**
   - Impacto das abordagens na qualidade da imagem
   - Futuras direções e desenvolvimentos

8. **[Fontes](#fontes)**
   - Referências e links para artigos e recursos


## 💡 O que é Ray Tracing?

Ray tracing é uma técnica de renderização que simula de maneira realista a iluminação de uma cena e dos objetos nela contidos, incluindo reflexos, refrações, sombras e iluminação indireta com precisão física. Esse processo cria imagens gráficas ao seguir o trajeto da luz, começando da câmera de visualização (que define sua perspectiva da cena), passando pelo plano de visualização 2D (onde os pixels são representados), entrando na cena 3D e retornando às fontes de luz. 💬[NVIDIA.DEVELOPER](https://developer.nvidia.com/discover/ray-tracing)

<div align="center">
    <img src="https://d29g4g2dyqv443.cloudfront.net/sites/default/files/pictures/2018/RayTracing/ray-tracing-image-1.jpg" alt="RT1 Image" style="width: 70%;"/>
    <p>Fonte: <a href="https://d29g4g2dyqv443.cloudfront.net/sites/default/files/pictures/2018/RayTracing/ray-tracing-image-1.jpg">NVIDIA</a></p>
</div>

Ele segue uma abordagem direta:
1. **Ray Casting**: Raios são lançados a partir da câmera e passam por cada pixel da imagem.
2. **Interseção com Objetos**: Cada raio é testado para verificar se intersecta com objetos na cena.
3. **Sombras e Reflexões**: A cor de cada pixel é determinada pela interação do raio com os objetos, considerando propriedades como cor, textura, e material dos objetos. Reflexões e refrações podem ser calculadas, mas são frequentemente feitas de forma simplificada.

Conforme a luz percorre a cena, ela pode refletir de um objeto para outro (criando reflexos), ser bloqueada por objetos (gerando sombras) ou atravessar materiais transparentes ou semitransparentes (resultando em refrações). Essas interações se combinam para determinar a cor e a iluminação final de um pixel, que é então mostrado na tela. O rastreamento reverso, da câmera/olho até a fonte de luz, é utilizado porque é significativamente mais eficiente do que tentar seguir todos os raios de luz emitidos das fontes de luz em várias direções. 💬[NVIDIA.DEVELOPER](https://developer.nvidia.com/discover/ray-tracing)

O ray tracing básico pode calcular reflexões e refrações, mas o tratamento de efeitos complexos como iluminação global e efeitos de profundidade de campo pode ser limitado.

## 🔍 Diferença de Ray Tracing e Monte Carlo Ray Tracing

Monte Carlo Ray Tracing é uma abordagem probabilística mais avançada do ray tracing. Ele utiliza métodos estatísticos e amostragens para simular efeitos de iluminação global de maneira mais realista.

<div align="center">
    <img src="https://i.sstatic.net/S9T42.png" alt="MCRT1 Image" style="width: 50%;"/>
    <p>Fonte: <a href="https://stackoverflow.com/questions/43449353/why-is-my-monte-carlo-raytracing-so-noisy">Stackoverflow</a></p>
</div>

As "amostras" no contexto do Monte Carlo Ray Tracing referem-se aos cálculos individuais dos *caminhos que os raios de luz podem seguir em uma cena virtual*. Cada amostra simula a interação da luz com os objetos e superfícies, incluindo reflexões e refrações. Essas amostras são geradas aleatoriamente para explorar os diferentes caminhos possíveis da luz. Como muitas amostras são necessárias para criar uma imagem realista e reduzir o ruído, quanto mais amostras forem usadas, mais precisa será a simulação e menor será o ruído na imagem final.

<div align="center">
    <img src="https://i.sstatic.net/YfcUu.jpg" alt="MCRT2 Image" style="width: 50%;"/>
    <p>Fonte: <a href="https://stackoverflow.com/questions/43449353/why-is-my-monte-carlo-raytracing-so-noisy">Stackoverflow</a></p>
</div>

1. **Amostragem Aleatória**: Em vez de calcular um único caminho de luz, o MCRT amostra muitos caminhos aleatórios para estimar a iluminação de forma mais precisa.
2. **Iluminação Global**: MCRT pode simular fenômenos complexos como iluminação indireta, difusa e especular de forma mais eficaz, resultando em imagens com mais realismo.
3. **Cálculo de Integrals**: Utiliza técnicas de integração estocástica para calcular a contribuição da luz para cada pixel, levando em conta múltiplos caminhos de luz e interações com diferentes superfícies.

O MCRT é mais computacionalmente intensivo que o ray tracing tradicional, mas é capaz de produzir imagens mais realistas, especialmente em cenários com iluminação complexa.

✍️  *Resumo*:
- **Ray Tracing**: Foca em simular raios de luz diretamente, ideal para reflexões e refrações básicas.
- **Monte Carlo Ray Tracing**: Utiliza amostragem aleatória e cálculos estocásticos para simular efeitos de iluminação global mais complexos, proporcionando imagens mais realistas, mas a um custo computacional maior.


## 🎯 O que é Ray Tracing Denoising?

A técnica de **Monte Carlo Ray Tracing** envolve o uso de amostras aleatórias para simular como a luz interage em uma cena, a fim de obter uma representação visual precisa e realista, ou seja, uma abordagem probabilística mais avançada do ray tracing. Embora esse método seja muito eficaz para gerar imagens com alto grau de realismo, ele tradicionalmente exigia muito tempo de processamento e resultava em imagens com bastante ruído (variações indesejadas ou granulação). Com o avanço das placas gráficas modernas que permitem o ray tracing em tempo real, houve um aumento significativo na pesquisa de técnicas de remoção de ruído (**Denoising**), que são usadas para suavizar as imagens e reduzir essas variações, tornando o processo mais eficiente e melhorando a qualidade visual final. 💬[Alain Galvan, 2020](https://alain.xyz/blog/ray-tracing-denoising)

🤖️ Essas técnicas de redução de ruído abrangem a **filtragem** com o uso de núcleos de desfoque guiado, o emprego de **aprendizado de máquina** para otimizar filtros ou amostragem de importância, a melhoria dos **esquemas de amostragem** por meio de sequências **quasi-aleatórias aprimoradas**, como o **ruído azul**, e o reaproveitamento espácio-temporal de raios ou da luminância final. Além disso, incluem técnicas de aproximação que buscam quantizar e armazenar informações com alguma estrutura espacial, como sondas, caches de irradiância, campos de radiância neurais (NeRFs), entre outros. 💬[Alain Galvan, 2020](https://alain.xyz/blog/ray-tracing-denoising)

Um denoiser robusto deve considerar a aplicação de todas essas técnicas, dependendo dos compromissos e das necessidades específicas da sua aplicação. 

Pesquisas recentes têm se concentrado em antecipar a redução de ruído no processo de renderização, melhorando os esquemas de amostragem e reamostrando pixels com informações em cache. Anteriormente, a pesquisa estava voltada para filtragem, autoencoders em aprendizado de máquina, amostragem de importância e métodos em tempo real que estão atualmente em produção em jogos comerciais e renderizadores. Vamos discutir os principais artigos sobre redução de ruído e suas implementações, com foco em como construir seu próprio denoiser robusto para ray tracing em tempo real. 💬[Alain Galvan, 2020](https://alain.xyz/blog/ray-tracing-denoising)

Desde a publicação deste artigo, houve um grande número de novas publicações sobre redução de ruído, com técnicas como ReSTIR, a suíte de redução de ruído da NVIDIA e métodos de aprendizado de máquina tendo avançado consideravelmente. Embora este artigo possa precisar de atualizações para incorporar esses trabalhos recentes, as ideias aqui apresentadas ainda permanecem relevantes hoje. 💬[Alain Galvan, 2020](https://alain.xyz/blog/ray-tracing-denoising)

## Soluções internas ao Ray tracing

No MCRT, as técnicas internas se referem a métodos que são aplicados diretamente dentro do pipeline de ray tracing para melhorar a qualidade da imagem gerada.

Essas técnicas são integradas diretamente ao processo de renderização e buscam melhorar a imagem gerada pelo MCRT, abordando questões como ruído e granulação.

### Filtering techniques

Técnicas de filtragem como os filtros Gaussiano, Bilateral, À-Trous, Guiado e de Mediana são usadas para suavizar imagens geradas por ray tracing Monte Carlo. Os filtros Guiados, por exemplo, utilizam buffers de características (como normais, albedo e profundidade) e buffers especializados (dados do primeiro rebote e comprimento do caminho reprojetado) em métodos recentes de redução de ruído e em implementações comerciais.

Embora essas técnicas sejam eficazes e econômicas, elas podem reduzir a qualidade da imagem, resultando na perda de detalhes finos, como bordas nítidas. Esse impacto pode ser tão significativo que afeta a uniformidade do brilho, criando artefatos de "sal e pimenta" em áreas de destaque e sombras.

## Soluções Externas ao Ray Tracing

As técnicas externas ao MCRT são aplicadas fora do processo de renderização ray tracing e frequentemente utilizam métodos adicionais para melhorar a qualidade da imagem ou otimizar o processo. Incluem técnicas que são aplicadas após o processo de ray tracing ou em combinação com ele para otimizar a imagem final.

**Machine Learning** e **técnicas de amostragem** são abordagens distintas para resolver problemas de renderização e redução de ruído em gráficos computacionais, e ambas têm suas próprias metodologias e objetivos. Ray Tracing Denoising pode ser abordado tanto por meio de técnicas baseadas em Machine Learning quanto por técnicas de amostragem. A escolha entre uma abordagem e outra (ou uma combinação de ambas) depende dos requisitos específicos do projeto, como a necessidade de precisão, o tempo de processamento disponível e a qualidade visual desejada.

OBS: **Filtragem Avançada com aprendizado de máquina e redes neurais**, como redes neurais bilaterais, é geralmente considerada uma técnica externa porque é aplicada após a renderização para otimizar a qualidade da imagem.

## Machine Learning

- **Abordagem:** Utiliza modelos treinados para aprender padrões e fazer previsões baseadas em grandes conjuntos de dados. Para redução de ruído e outras tarefas relacionadas a gráficos, isso envolve o treinamento de redes neurais para identificar e remover ruído das imagens ou para aprimorar a qualidade visual.
  
- **Exemplos Aplicados:** 
  - **Autoencoders** para redução de ruído ([Khademi Kalantari et al. 2013], [Khademi Kalantari et al. 2015])
  - **Deep Learning Super Sampling (DLSS 2.0)** da NVIDIA para escalonamento e melhoria da qualidade visual ([Dong et al. 2015], [Ledig et al. 2016])
  - **Neural Radiance Fields (NeRFs)** para simular efeitos dependentes da visão e melhorar a qualidade da imagem ([Verbin et al. 2021], [Mildenhall et al. 2022])

- **Objetivo:** Aprimorar a qualidade das imagens e reduzir o ruído através de técnicas que aprendem a partir de dados. Machine learning pode lidar com complexidades e variações que métodos tradicionais podem não capturar bem.

### Técnicas de Amostragem

- **Abordagem:** Envolve a coleta e processamento de múltiplas amostras para estimar a iluminação e a aparência de uma cena. Técnicas de amostragem visam melhorar a precisão da simulação e a qualidade visual ao amostrar várias vezes os caminhos da luz e suas interações.

- **Exemplos Aplicados:** 
  - **Anti-Aliasing Temporal** para suavizar a imagem ao longo do tempo ([Korein et al. 1983], [Yang et al. 2020])
  - **Filtro Espacial-Temporal** e **SVGF** para reduzir o ruído em cenas com movimentos ([Mara et al. 2017], [Schied 2017])
  - **Regressão de Recursos Multiordem por Blocos (BMFR)** para melhorar a precisão da estimativa de iluminação ([Koskela et al. 2019])

- **Objetivo:** Melhorar a qualidade visual e reduzir o ruído acumulando e processando múltiplas amostras da cena. Técnicas de amostragem frequentemente focam em maneiras de usar eficientemente os dados de amostras para reduzir artefatos visuais e melhorar a precisão das imagens renderizadas.

### Comparação Machine Learning e Técnicas de Amostragem

- **Machine Learning:** Foca em aprender padrões a partir de dados e aplicar esses aprendizados para melhorar a qualidade da imagem e reduzir o ruído de maneira adaptativa e dinâmica.
  
- **Técnicas de Amostragem:** Envolve a coleta e processamento de várias amostras para estimar a iluminação e a aparência da cena com maior precisão, muitas vezes aplicando métodos matemáticos e estatísticos para lidar com variações e reduzir artefatos.

Ambas as abordagens podem ser complementares. Machine learning pode ser usado para aprimorar e automatizar processos de amostragem, enquanto técnicas de amostragem podem fornecer dados valiosos para treinar modelos de machine learning.

## Denoiser Genérico

<div align="center">
    <img src="https://alain.xyz/blog/ray-tracing-denoising/assets/ideal-denoiser.svg" alt="Denoiser Generico Image" style="width: 100%;"/>
    <p>Fonte: <a href="https://alain.xyz/blog/ray-tracing-denoising">Alain Galvan, 2020</a></p>
</div>

### 1. **Prepass**
   - **O que é?**: Nesta etapa, você prepara os dados iniciais necessários para o ray tracing.
   - **Como funciona?**: Calcula a velocidade da cena no espaço NDC (Normalized Device Coordinates) e coleta informações essenciais como albedo (cor da superfície) e normais (direções das superfícies). Em alguns casos, você pode precisar calcular essas informações para o primeiro bounce de luz, o que requer um pré-processamento mais detalhado com ray tracing.

### 2. **Ray Trace**
   - **O que é?**: Aqui você usa o ray tracing para simular como a luz interage com a cena.
   - **Como funciona?**: A amostragem adaptativa por IA é utilizada para decidir onde são necessárias mais amostras, como em áreas de destaque ou sombra, ajudando a evitar ruído indesejado e a manter a qualidade da luminância. Separa o processamento de reflexões especulares e iluminação global, tratando reflexões especulares com dados mais precisos e a iluminação global e sombras com métodos mais simples.

### 3. **Accumulation**
   - **O que é?**: Coleta e combina dados de múltiplos quadros para melhorar a qualidade da imagem.
   - **Como funciona?**: Utiliza técnicas de reprojeção espacial-temporal para ajustar os dados coletados de acordo com a posição atual. Para dados lambertianos (como iluminação global), isso é mais simples, mas para dados especulares (como reflexões), é mais complexo. Usa informações anteriores para melhorar a precisão da imagem atual.

### 4. **Statistical Analysis**
   - **O que é?**: Analisa a variância dos dados de imagem ray-traced para ajustar o processo de filtragem.
   - **Como funciona?**: Avalia a variância na luminância e na velocidade da cena para ajustar a reprojeção e a filtragem. Tenta eliminar "fireflies" (pontos brilhantes indesejados) usando essas informações estatísticas.

### 5. **Filtering**
   - **O que é?**: Refina a imagem final para remover ruído e melhorar a qualidade.
   - **Como funciona?**: Usa um filtro bilateral À-Trous para suavizar a imagem. Aplica o filtro várias vezes para atingir o nível desejado de desfoque, ajustando a intensidade do desfoque a cada aplicação. Alternativamente, um autoencoder de denoising pode ser usado para obter melhores resultados, embora mais lentamente.

### 6. **History Blit**
   - **O que é?**: Salva os dados atuais para uso futuro.
   - **Como funciona?**: Registra informações como albedo e profundidade que foram calculadas no pré-processamento. Esses dados são mantidos para o próximo quadro, facilitando a reprojeção e o processamento contínuo.

## Deep learning super sampling (DLSS)

É uma técnica de escalonamento que utiliza redes neurais para gerar imagens de alta resolução a partir de uma resolução mais baixa. Ele melhora a qualidade visual e aumenta a resolução aparente, reduzindo a carga computacional necessária para renderizar imagens em alta resolução. DLSS pode ajudar a suavizar a aparência de imagens e pode reduzir o impacto do ruído, mas seu foco principal é a melhoria da resolução e performance.

### Limitações com Denoisers manuais
Cada denoiser ajustado manualmente compila pixels de vários quadros para aumentar o nível de detalhe, basicamente reutilizando raios de quadros anteriores. No entanto, isso pode causar problemas como o efeito fantasma, a eliminação de efeitos dinâmicos e a redução da qualidade em outras áreas. Além disso, ele interpola pixels vizinhos e mistura essas informações, mas pode acabar suavizando demais os detalhes ou não suavizando o suficiente, resultando em efeitos de iluminação não uniformes.

A **Upscaling** é a última etapa do pipeline de iluminação ray-traced e é fundamental para vivenciar jogos detalhados e exigentes a taxas de quadros rápidas. No entanto, com o denoising removendo ou diminuindo a qualidade dos efeitos, as limitações dos denoisers ajustados manualmente são amplificadas, removendo detalhes finos (conhecidos como informações de alta frequência) que os amplificadores usam para gerar uma imagem nítida e limpa.

<div align="center">
    <img src="https://images.nvidia.com/aem-dam/Solutions/geforce/news/gamescom-ct0037/limitations-with-hand-tuned-denoisers.jpg" alt="Denoiser Image" style="width: 100%;"/>
    <p>Fonte: <a href="https://www.nvidia.com/en-us/geforce/news/nvidia-dlss-3-5-ray-reconstruction/">NVIDIA</a></p>
</div>

### Ray Reconstruction == Denoiser with IA?
A solução apresentada é o **NVIDIA DLSS 3.5**, que inclui a inovação **Ray Reconstruction**. Essa tecnologia faz parte de um renderizador neural avançado, alimentado por IA, que aprimora a qualidade das imagens geradas por ray tracing em todas as GPUs GeForce RTX. Em vez de usar denoisers ajustados manualmente, o Ray Reconstruction utiliza uma rede de IA treinada por supercomputadores da NVIDIA para criar pixels de maior qualidade entre os raios amostrados, funcionando efetivamente como um denoiser mais sofisticado e preciso.

<div align="center">
    <img src="https://images.nvidia.com/aem-dam/Solutions/geforce/news/gamescom-ct0037/denoisers-remove-information-required-for-upscaling.jpg" alt="DLSS2 Image" style="width: 100%;"/>
    <p>Fonte: <a href="https://www.nvidia.com/en-us/geforce/news/nvidia-dlss-3-5-ray-reconstruction/">NVIDIA</a></p>
</div>

### Ray-traced lighting pipeline
Treinada com 5 vezes mais dados do que o DLSS 3, a **Ray Reconstruction** identifica diferentes efeitos de ray tracing para tomar decisões mais inteligentes sobre o uso de dados temporais e espaciais, além de preservar informações de alta frequência para um upscaling de qualidade superior. 

<div align="center">
    <img src="https://images.nvidia.com/aem-dam/Solutions/geforce/news/gamescom-ct0037/introducing-nvidia-dlss-3-5-with-ai-powered-ray-reconstruction.jpg" alt="DLSS2 IMAGE" style="width: 100%;"/>
    <p>Fonte: <a href="https://www.nvidia.com/en-us/geforce/news/nvidia-dlss-3-5-ray-reconstruction/">NVIDIA</a></p>
</div>

Treinada com imagens renderizadas offline, que exigem muito mais poder computacional do que o disponível em tempo real durante um jogo, a **Ray Reconstruction** reconhece padrões de iluminação a partir dos dados de treinamento, como iluminação global ou oclusão de ambiente, e os recria no jogo enquanto você joga. Os resultados obtidos são superiores aos alcançados com denoisers ajustados manualmente.

<div align="center">
    <img src="https://images.nvidia.com/aem-dam/Solutions/geforce/news/gamescom-ct0037/dlss-3-5-ray-reconstruction-is-smarter-than-denoisers.jpg" alt="DLSS3 IMAGE" style="width: 100%;"/>
    <p>Fonte: <a href="https://www.nvidia.com/en-us/geforce/news/nvidia-dlss-3-5-ray-reconstruction/">NVIDIA</a></p>
</div>

Em com o DLSS desligado, o denoiser enfrenta dificuldades com a interpolação espacial, onde não está misturando pixels suficientes, criando um efeito manchado. Além disso, ele não acumula pixels bons o suficiente dos quadros anteriores, resultando em um efeito de fervura na iluminação. Com o DLSS 3.5, ele reconhece certos padrões associados a reflexos e mantém a imagem estável, acumulando pixels precisos enquanto mistura pixels vizinhos para gerar reflexos de alta qualidade.

<div align="center">
    <img src="https://images.nvidia.com/aem-dam/Solutions/geforce/news/gamescom-ct0037/dlss-3-5-ray-reconstruction-generates-better-lighting-effects.jpg" alt="DLSS4 IMAGE" style="width: 100%;"/>
    <p>Fonte: <a href="https://www.nvidia.com/en-us/geforce/news/nvidia-dlss-3-5-ray-reconstruction/">NVIDIA</a></p>
</div>

## Conclusão
O avanço contínuo na pesquisa e desenvolvimento de técnicas de denoising, especialmente com o uso de Machine Learning e novas abordagens de amostragem, promete melhorar ainda mais a eficácia dos métodos de ray tracing. A integração dessas técnicas em pipelines de renderização permite criar imagens de alta qualidade de forma mais eficiente, atendendo às demandas de realismo e performance nos gráficos computacionais modernos.

## Fontes

- [Alain Galvan, 2020](https://alain.xyz/blog/ray-tracing-denoising)
- [Firmino, A., Frisvad, J. R., & Jensen, H. W. (2023). Denoising-Aware Adaptive Sampling for Monte Carlo Ray Tracing. *Proceedings of the ACM SIGGRAPH Conference on Computer Graphics and Interactive Techniques*.](https://dl.acm.org/doi/pdf/10.1145/3588432.3591537)
- [NVIDIA DLSS 3.5 | New Ray Reconstruction Enhances Ray Tracing with AI](https://www.nvidia.com/en-us/geforce/news/nvidia-dlss-3-5-ray-reconstruction/)
- [Ray Tracing Essentials Part 4: The Ray Tracing Pipeline](https://developer.nvidia.com/blog/ray-tracing-essentials-part-4-the-ray-tracing-pipeline/)
- [NVIDIA DLSS 3 ](https://www.nvidia.com/en-us/geforce/technologies/dlss/)
- [Deep learning super sampling -wikipedia](https://en.wikipedia.org/wiki/Deep_learning_super_sampling)

