
var vertexShaderText =
    `precision mediump float;
    attribute vec3 vertPosition;
    varying vec3 fragColor;
    
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;
    
    void main()
    {
        fragColor = vec3(0, 0, 0);
        gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    }`

var fragmentShaderText =
    `precision mediump float;
    varying vec3 fragColor;
    void main()
    {
       gl_FragColor = vec4(fragColor, 1.0);
    }`

var initDemo = function () {
    console.log('This is working');

    var canvas = document.getElementById('surface');
    var gl = canvas.getContext('webgl');

    if(!gl){
        console.log('webgl experimental')
        gl = canvas.getContext('experimental-webgl');
    }

    if(!gl){
        alert('Browser does not support webGL');
    }
    
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    // Create shaders
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }

    gl.compileShader(fragmentShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }
    gl.validateProgram(program);
    if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }

    const cubeVertices = []
    const lineIndices = []

    //Create buffer
    function appendVertex(VertexArray, LineArray){
        fetch('./streamlineResult.json')
        .then(response => response.text()) // Read the response as text
        .then(jsonObject => {
            const data = JSON.parse(jsonObject);
            const positionArrays = data.result;
            var count = 0;

            for (const positionArray of positionArrays) {
                for (const position of positionArray) {
                  // Push the x, y, and z values into the 'vertices' array
                  VertexArray.push(position[0] - 100, position[1] - 100, position[2] - 10);
                  LineArray.push(count, count+1);

                  count++;
                }
            }

            console.log(cubeVertices.length);
            console.log(cubeVertices);

    var cubeVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

    var lineIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(lineIndices), gl.STATIC_DRAW);

    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    // var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        3, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE, // Normalization
        3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
    );

    // gl.vertexAttribPointer(
    //     colorAttribLocation, // Attribute location
    //     3, // Number of elements per attribute
    //     gl.FLOAT, // Type of elements
    //     gl.FALSE, // Normalization
    //     6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    //     3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
    // );

    gl.enableVertexAttribArray(positionAttribLocation);
    // gl.enableVertexAttribArray(colorAttribLocation);

    gl.useProgram(program);

    var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

    var WorldMatrix = new Float32Array(16);
    var ViewMatrix = new Float32Array(16);
    var ProjMatrix = new Float32Array(16);
    
    glMatrix.mat4.identity(WorldMatrix);
    glMatrix.mat4.lookAt(ViewMatrix, [88, 105, 11], [0, 0, 0], [0, 1, 0]);
    glMatrix.mat4.perspective(ProjMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, WorldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, ViewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, ProjMatrix);

    // Main render loop
    var xRotation = new Float32Array(16);
    var yRotation = new Float32Array(16);

    var identity = glMatrix.mat4.create();
    var angle = 45;
    var loop = function () {
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;

        glMatrix.mat4.rotate(xRotation, identity, angle, [0, 1, 0]);
        glMatrix.mat4.rotate(yRotation, identity, angle / 2, [1, 0, 0]);
        glMatrix.mat4.mul(WorldMatrix, xRotation, yRotation);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, WorldMatrix);

        gl.clearColor(0.75, 0.75, 0.8, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        // gl.drawElements(gl.LINES, cubeVertices.length, gl.UNSIGNED_SHORT, 0);
        gl.drawArrays(gl.LINES, 0, cubeVertices.length);

        requestAnimationFrame(loop);
    }
    
    requestAnimationFrame(loop);
        })
        .catch(error => {
            console.error('Error loading JSON file:', error);
    
        });

    }

    appendVertex(cubeVertices, lineIndices);


    // var cubeVertexBufferObject = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

    // var lineIndexBufferObject = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBufferObject);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(lineIndices), gl.STATIC_DRAW);

    // var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    // // var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

    // gl.vertexAttribPointer(
    //     positionAttribLocation, // Attribute location
    //     3, // Number of elements per attribute
    //     gl.FLOAT, // Type of elements
    //     gl.FALSE, // Normalization
    //     3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    //     0 // Offset from the beginning of a single vertex to this attribute
    // );

    // // gl.vertexAttribPointer(
    // //     colorAttribLocation, // Attribute location
    // //     3, // Number of elements per attribute
    // //     gl.FLOAT, // Type of elements
    // //     gl.FALSE, // Normalization
    // //     6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    // //     3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
    // // );

    // gl.enableVertexAttribArray(positionAttribLocation);
    // // gl.enableVertexAttribArray(colorAttribLocation);

    // gl.useProgram(program);

    // var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    // var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    // var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

    // var WorldMatrix = new Float32Array(16);
    // var ViewMatrix = new Float32Array(16);
    // var ProjMatrix = new Float32Array(16);
    
    // glMatrix.mat4.identity(WorldMatrix);
    // glMatrix.mat4.lookAt(ViewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
    // glMatrix.mat4.perspective(ProjMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 10000.0);

    // gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, WorldMatrix);
    // gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, ViewMatrix);
    // gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, ProjMatrix);

    // // Main render loop
    // var xRotation = new Float32Array(16);
    // var yRotation = new Float32Array(16);

    // var identity = glMatrix.mat4.create();
    // var angle = 45;
    // var loop = function () {
    //     angle = performance.now() / 1000 / 6 * 2 * Math.PI;

    //     glMatrix.mat4.rotate(xRotation, identity, angle, [0, 1, 0]);
    //     glMatrix.mat4.rotate(yRotation, identity, angle / 2, [1, 0, 0]);
    //     glMatrix.mat4.mul(WorldMatrix, xRotation, yRotation);
    //     gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, WorldMatrix);

    //     gl.clearColor(0.75, 0.75, 0.8, 1.0);
    //     gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    //     gl.drawArrays(gl.LINES, 0, cubeVertices.push());

    //     requestAnimationFrame(loop);
    // }
    
    // requestAnimationFrame(loop);

};