const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fs], programOptions);
const colorProgramInfo = twgl.createProgramInfo(gl, [colorVS, colorFS], programOptions);


// URL do arquivo OBJ que contém o modelo 3D.
const objHref = 'assets/windmill.obj';  

// Faz uma requisição HTTP para buscar o arquivo OBJ.
const response = await fetch(objHref);

// Converte a resposta em texto (conteúdo do arquivo OBJ).
const text = await response.text();

// Analisa o texto OBJ para extrair a geometria do modelo.
const obj = parseOBJ(text);

// Cria uma URL base a partir da localização do arquivo OBJ. 
// Isso facilita a localização de materiais associados.
const baseHref = new URL(objHref, window.location.href);

// Busca todos os arquivos de material (MTL) listados no OBJ e converte o conteúdo em texto.
const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
  const matHref = new URL(filename, baseHref).href;
  const response = await fetch(matHref);
  return await response.text();
}));

// Analisa os textos dos arquivos MTL para extrair as definições dos materiais.
const materials = parseMTL(matTexts.join('\n'));

// Define texturas padrão, como uma textura branca padrão.
const textures = {
  defaultWhite: twgl.createTexture(gl, {src: [255, 255, 255, 255]})
};

// Carrega texturas para cada material que faz referência a um mapa de textura.
for (const material of Object.values(materials)) {
  Object.entries(material)
    .filter(([key]) => key.endsWith('Map')) // Filtra apenas propriedades que terminam com 'Map' (ex: diffuseMap).
    .forEach(([key, filename]) => {
      let texture = textures[filename];
      if (!texture) {
        // Se a textura não foi carregada anteriormente, faz o download e cria a textura.
        const textureHref = new URL(filename, baseHref).href;
        texture = twgl.createTexture(gl, {src: textureHref, flipY: true});
        textures[filename] = texture;
      }
      // Substitui o nome do arquivo pelo objeto de textura.
      material[key] = texture;
    });
}

// Hack para ajustar os materiais de forma que possamos visualizar o mapa especular.
Object.values(materials).forEach(m => {
  m.shininess = 25; // Ajusta o brilho.
  m.specular = [3, 2, 1]; // Define a cor especular.
});

// Material padrão usado caso algum objeto não tenha material associado.
const defaultMaterial = {
  diffuse: [1, 1, 1],
  diffuseMap: textures.defaultWhite,
  ambient: [0, 0, 0],
  specular: [1, 1, 1],
  specularMap: textures.defaultWhite,
  shininess: 400,
  opacity: 1,
};

// Mapeia as geometrias do OBJ em partes renderizáveis.
const parts = obj.geometries.map(({material, data}) => {
  // `data` contém arrays nomeados como 'position', 'texcoord', 'normal', etc.
  // Como os nomes dos arrays correspondem aos atributos do shader de vértice,
  // podemos passá-los diretamente para `createBufferInfoFromArrays`.

  if (data.color) {
    if (data.position.length === data.color.length) {
      // Ajusta o número de componentes se os dados de cor tiverem 3 componentes (RGB).
      data.color = { numComponents: 3, data: data.color };
    }
  } else {
    // Se não houver cores de vértice, use uma cor constante (branco).
    data.color = { value: [1, 1, 1, 1] };
  }

  // Gera tangentes se tivermos as coordenadas de textura e normais.
  if (data.texcoord && data.normal) {
    data.tangent = generateTangents(data.position, data.texcoord);
  } else {
    // Caso contrário, define tangentes padrão.
    data.tangent = { value: [1, 0, 0] };
  }

  if (!data.texcoord) {
    // Se não houver coordenadas de textura, usa valores padrão.
    data.texcoord = { value: [0, 0] };
  }

  if (!data.normal) {
    // Se não houver normais, define uma normal padrão.
    data.normal = { value: [0, 0, 1] };
  }

  // Cria buffers para cada array de dados (posição, normal, etc.).
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);

  // Cria um VAO (Vertex Array Object) a partir das informações do buffer e do programa de shader.
  const windmillVAO = twgl.createVAOFromBufferInfo(gl, textureProgramInfo, bufferInfo);

  // Retorna um objeto contendo o material, as informações do buffer, e o VAO para renderização.
  return {
    material: {
      ...defaultMaterial, // Começa com o material padrão.
      ...materials[material], // Sobrescreve com as propriedades do material do OBJ, se houver.
    },
    bufferInfo,
    windmillVAO,
  };
});
