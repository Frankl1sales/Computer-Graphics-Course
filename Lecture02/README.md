# Leitura 2: Ray Tracing Denoising

## O que é Ray Tracing?

Ray tracing é uma técnica de renderização que simula de maneira realista a iluminação de uma cena e dos objetos nela contidos, incluindo reflexos, refrações, sombras e iluminação indireta com precisão física. Esse processo cria imagens gráficas ao seguir o trajeto da luz, começando da câmera de visualização (que define sua perspectiva da cena), passando pelo plano de visualização 2D (onde os pixels são representados), entrando na cena 3D e retornando às fontes de luz. [NVIDIA.DEVELOPER](https://developer.nvidia.com/discover/ray-tracing)

<div style="text-align: center;">
    <img src="https://d29g4g2dyqv443.cloudfront.net/sites/default/files/pictures/2018/RayTracing/ray-tracing-image-1.jpg" alt="Ray Tracing Image" style="width: 70%;"/>
    <p style="text-align: center;">Fonte: <a href="https://d29g4g2dyqv443.cloudfront.net/sites/default/files/pictures/2018/RayTracing/ray-tracing-image-1.jpg">Ray Tracing Image</a></p>
</div>

Ele segue uma abordagem direta:
1. **Ray Casting**: Raios são lançados a partir da câmera e passam por cada pixel da imagem.
2. **Interseção com Objetos**: Cada raio é testado para verificar se intersecta com objetos na cena.
3. **Sombras e Reflexões**: A cor de cada pixel é determinada pela interação do raio com os objetos, considerando propriedades como cor, textura, e material dos objetos. Reflexões e refrações podem ser calculadas, mas são frequentemente feitas de forma simplificada.

Conforme a luz percorre a cena, ela pode refletir de um objeto para outro (criando reflexos), ser bloqueada por objetos (gerando sombras) ou atravessar materiais transparentes ou semitransparentes (resultando em refrações). Essas interações se combinam para determinar a cor e a iluminação final de um pixel, que é então mostrado na tela. O rastreamento reverso, da câmera/olho até a fonte de luz, é utilizado porque é significativamente mais eficiente do que tentar seguir todos os raios de luz emitidos das fontes de luz em várias direções. [NVIDIA.DEVELOPER](https://developer.nvidia.com/discover/ray-tracing)

O ray tracing básico pode calcular reflexões e refrações, mas o tratamento de efeitos complexos como iluminação global e efeitos de profundidade de campo pode ser limitado.

## Diferença de Ray Tracing e Monte Carlo Ray Tracing

Monte Carlo Ray Tracing é uma abordagem probabilística mais avançada do ray tracing. Ele utiliza métodos estatísticos e amostragens para simular efeitos de iluminação global de maneira mais realista.

<div style="text-align: center;">
    <img src="https://i.sstatic.net/S9T42.png" alt="MCRT1 Image" style="width: 50%;"/>
    <p style="text-align: center;">Fonte: <a href="https://stackoverflow.com/questions/43449353/why-is-my-monte-carlo-raytracing-so-noisy">Stackoverflow</a></p>
</div>

As "amostras" no contexto do Monte Carlo Ray Tracing referem-se aos cálculos individuais dos *caminhos que os raios de luz podem seguir em uma cena virtual*. Cada amostra simula a interação da luz com os objetos e superfícies, incluindo reflexões e refrações. Essas amostras são geradas aleatoriamente para explorar os diferentes caminhos possíveis da luz. Como muitas amostras são necessárias para criar uma imagem realista e reduzir o ruído, quanto mais amostras forem usadas, mais precisa será a simulação e menor será o ruído na imagem final.

<div style="text-align: center;">
    <img src="https://i.sstatic.net/YfcUu.jpg" alt="MCRT1 Image" style="width: 50%;"/>
    <p style="text-align: center;">Fonte: <a href="https://stackoverflow.com/questions/43449353/why-is-my-monte-carlo-raytracing-so-noisy">Stackoverflow</a></p>
</div>

1. **Amostragem Aleatória**: Em vez de calcular um único caminho de luz, o MCRT amostra muitos caminhos aleatórios para estimar a iluminação de forma mais precisa.
2. **Iluminação Global**: MCRT pode simular fenômenos complexos como iluminação indireta, difusa e especular de forma mais eficaz, resultando em imagens com mais realismo.
3. **Cálculo de Integrals**: Utiliza técnicas de integração estocástica para calcular a contribuição da luz para cada pixel, levando em conta múltiplos caminhos de luz e interações com diferentes superfícies.

O MCRT é mais computacionalmente intensivo que o ray tracing tradicional, mas é capaz de produzir imagens mais realistas, especialmente em cenários com iluminação complexa.

*Resumo*:
- **Ray Tracing**: Foca em simular raios de luz diretamente, ideal para reflexões e refrações básicas.
- **Monte Carlo Ray Tracing**: Utiliza amostragem aleatória e cálculos estocásticos para simular efeitos de iluminação global mais complexos, proporcionando imagens mais realistas, mas a um custo computacional maior.

## O que é Ray Tracing Denoising?

A técnica de **Monte Carlo Ray Tracing** envolve o uso de amostras aleatórias para simular como a luz interage em uma cena, a fim de obter uma representação visual precisa e realista, ou seja, uma abordagem probabilística mais avançada do ray tracing. Embora esse método seja muito eficaz para gerar imagens com alto grau de realismo, ele tradicionalmente exigia muito tempo de processamento e resultava em imagens com bastante ruído (variações indesejadas ou granulação). Com o avanço das placas gráficas modernas que permitem o ray tracing em tempo real, houve um aumento significativo na pesquisa de técnicas de remoção de ruído (**Denoising**), que são usadas para suavizar as imagens e reduzir essas variações, tornando o processo mais eficiente e melhorando a qualidade visual final. [Alain Galvan, 2020](https://alain.xyz/blog/ray-tracing-denoising)

> Essas técnicas de redução de ruído abrangem a filtragem com o uso de núcleos de desfoque guiado, o emprego de aprendizado de máquina para otimizar filtros ou amostragem de importância, a melhoria dos esquemas de amostragem por meio de sequências quasi-aleatórias aprimoradas, como o ruído azul, e o reaproveitamento espácio-temporal de raios ou da luminância final. Além disso, incluem técnicas de aproximação que buscam quantizar e armazenar informações com alguma estrutura espacial, como sondas, caches de irradiância, campos de radiância neurais (NeRFs), entre outros.

Um denoiser robusto deve considerar a aplicação de todas essas técnicas, dependendo dos compromissos e das necessidades específicas da sua aplicação.

Pesquisas recentes têm se concentrado em antecipar a redução de ruído no processo de renderização, melhorando os esquemas de amostragem e reamostrando pixels com informações em cache. Anteriormente, a pesquisa estava voltada para filtragem, autoencoders em aprendizado de máquina, amostragem de importância e métodos em tempo real que estão atualmente em produção em jogos comerciais e renderizadores. Vamos discutir os principais artigos sobre redução de ruído e suas implementações, com foco em como construir seu próprio denoiser robusto para ray tracing em tempo real.

Desde a publicação deste artigo, houve um grande número de novas publicações sobre redução de ruído, com técnicas como ReSTIR, a suíte de redução de ruído da NVIDIA e métodos de aprendizado de máquina tendo avançado consideravelmente. Embora este artigo possa precisar de atualizações para incorporar esses trabalhos recentes, as ideias aqui apresentadas ainda permanecem relevantes hoje.

