Aqui está a tradução do README.md para o português:

---

# Projeto WebGL com Sombreamento e Renderização de Objetos

Este projeto demonstra o uso de WebGL para renderizar uma cena 3D com sombreamento baseado em luz direcional e texturas projetadas. Ele utiliza o WebGL 2.0 para renderizar objetos 3D, como esferas, planos e cubos, e aplica efeitos de sombras usando shaders GLSL.

## Descrição

O projeto consiste em:

- **Shaders GLSL**: Dois shaders principais (`vertex shader` e `fragment shader`) para calcular a posição dos vértices, aplicar texturas e gerar sombras.
- **Programas WebGL**: Criação de dois programas WebGL para renderizar texturas e cores.
- **Buffers de Geometria**: Buffers para armazenar as informações de geometria dos objetos 3D, como posições, normais e coordenadas de textura.
- **Texturas**: Carregamento de texturas para mapear imagens em objetos 3D e aplicação de uma textura de tabuleiro de xadrez gerada dinamicamente.
- **OBJ Loader**: Carregamento de um arquivo OBJ para renderizar modelos 3D complexos.
- **Sombras**: Implementação de sombras suaves usando uma textura projetada e um viés para evitar artefatos de sombra.

## Requisitos

- Um navegador moderno com suporte para WebGL 2.0.
- Uma conexão à internet para carregar o modelo OBJ e as texturas.

## Como Executar

1. Clone este repositório em sua máquina local.
2. Abra o arquivo `index.html` em um navegador com suporte a WebGL 2.0.
3. A cena 3D será renderizada automaticamente, mostrando objetos como esferas, cubos e um plano com sombreamento e sombras projetadas.

## Estrutura do Código

- `vs`: Vertex shader que calcula a posição dos vértices e aplica transformações de textura e iluminação.
- `fs`: Fragment shader que aplica texturas, sombras e calcula a iluminação baseada em um vetor de luz direcional.
- `colorVS` e `colorFS`: Shaders simples para renderização de cores sólidas.
- `main()`: Função principal que inicializa o contexto WebGL, configura os programas de shaders, cria os buffers de geometria e carrega as texturas e modelos 3D.

## Referências

- [WebGL 2.0 Specification](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [GLSL Shaders](https://www.opengl.org/documentation/glsl/)
- [TWGL.js Library](https://twgljs.org/)

## Licença

Este projeto é licenciado sob os termos da licença MIT. Consulte o arquivo `LICENSE` para mais informações.

---

Essa tradução reflete as principais partes do código e seus propósitos dentro do projeto, ajustando para o contexto de desenvolvimento WebGL e shaders.
