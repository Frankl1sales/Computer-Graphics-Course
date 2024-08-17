// Função para criar e compilar shaders
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Função para criar o programa WebGL
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking failed:', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

// Código dos shaders
const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;

    varying vec4 v_color;

    void main() {
        gl_Position = a_position;
        v_color = a_color;
    }
`;

const fragmentShaderSource = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color;
    }
`;

// Função principal
function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    // Cria e usa o programa
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // Define os atributos e uniformes
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getAttribLocation(program, 'a_color');

    // Dados dos vértices
    const positions = new Float32Array([
        -0.5, -0.5,  1.0, 0.0, // Ponto inferior esquerdo (cor: vermelho)
         0.5, -0.5,  0.0, 1.0, // Ponto inferior direito (cor: verde)
         0.5,  0.5,  0.0, 0.0, // Ponto superior direito (cor: azul)
        -0.5,  0.5,  1.0, 1.0, // Ponto superior esquerdo (cor: amarelo)
    ]);

    // Cria e usa o buffer de posições
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Configura os atributos
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 16, 8);

    // Limpa o canvas e desenha o quadrado
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

// Executa a função principal
main();
