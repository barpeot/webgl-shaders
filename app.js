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

    function computeBezierCurve(controlPoints, numSteps) {
        var curvePoints = [];
    
        for (var t = 0; t <= 1; t += 1 / numSteps) {
            var tempControlPoints = controlPoints.slice();
    
            while (tempControlPoints.length > 1) {
                var newControlPoints = [];
                for (var i = 0; i < tempControlPoints.length - 1; i++) {
                    var x = tempControlPoints[i][0] + t * (tempControlPoints[i + 1][0] - tempControlPoints[i][0]);
                    var y = tempControlPoints[i][1] + t * (tempControlPoints[i + 1][1] - tempControlPoints[i][1]);
                    var z = tempControlPoints[i][2] + t * (tempControlPoints[i + 1][2] - tempControlPoints[i][2]);
                    newControlPoints.push(glMatrix.vec3.fromValues(x, y, z));
                }
                tempControlPoints = newControlPoints;
            }
    
            curvePoints.push(tempControlPoints[0][0]);
            curvePoints.push(tempControlPoints[0][1]);
            curvePoints.push(tempControlPoints[0][2]);
        }
    
        return curvePoints;
    }

    function startSim(){
        fetch('./streamlineResult.json')
        .then(response => response.text()) // Read the response as text
        .then(jsonObject => {
            const data = JSON.parse(jsonObject);
            const positionArrays = data.result;

            const Vertices = [];
            const objects = [];

            for (const positionArray of positionArrays) {
                var array = [];
                
                for (const position of positionArray) {
                    x = position[0];
                    y = position[1];
                    z = position[2];
                    array.push(x, y, z);
                }
                
                var floatArray = new Float32Array(array);
                objects.push(floatArray);
            }

            
        
            // var tValues = new Float32Array(Vertices.length);
            // for (var i = 0; i < Vertices.length; ++i) {
            //     tValues[i] = i / (Vertices.length-1.0);
            // }

            // console.log(objects);
            // console.log(tValues);
            
            var numSteps = 3;
            
            for(const object of objects){
                var controlPoints = [];

                for (var i = 0; i < object.length; i += 3) {
                    var x = object[i];
                    var y = object[i + 1];
                    var z = object[i + 2];
                    controlPoints.push(glMatrix.vec3.fromValues(x - 80, y - 100, z));
                }

                var bezierCurvePoints = computeBezierCurve(controlPoints, numSteps);
                Vertices.push(bezierCurvePoints);
            }

            // console.log(Vertices);

            var VertexBufferObject = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, VertexBufferObject);

            var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');

            gl.vertexAttribPointer(
                positionAttribLocation, // Attribute location
                3, // Number of elements per attribute
                gl.FLOAT, // Type of elements
                gl.FALSE, // Normalization
                3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
                0 // Offset from the beginning of a single vertex to this attribute
            );

            gl.enableVertexAttribArray(positionAttribLocation);

            gl.useProgram(program);

            // var lineIndexBufferObject = gl.createBuffer();
            // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBufferObject);
            // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndices), gl.STATIC_DRAW);     
            
            // var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
        
            // gl.vertexAttribPointer(
            //     colorAttribLocation, // Attribute location
            //     3, // Number of elements per attribute
            //     gl.FLOAT, // Type of elements
            //     gl.FALSE, // Normalization
            //     6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            //     3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
            // );

            // gl.enableVertexAttribArray(tLocation);
            // gl.enableVertexAttribArray(colorAttribLocation);

            // var controlPointsLocation = gl.getUniformLocation(program, 'controlPoints');
            // gl.uniform3fv(controlPointsLocation, new Float32Array(Vertices.flat()));   
        
            var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
            var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
            var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
        
            var WorldMatrix = new Float32Array(16);
            var ViewMatrix = new Float32Array(16);
            var ProjMatrix = new Float32Array(16);
            
            glMatrix.mat4.identity(WorldMatrix);
            glMatrix.mat4.lookAt(ViewMatrix, [0, 0, 300], [1, 0, 0], [0, 1, 0]);
            glMatrix.mat4.perspective(ProjMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.01, 10000.0);
            gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, WorldMatrix);
            gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, ViewMatrix);
            gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, ProjMatrix);
        
            // Main render loop
            var xRotation = new Float32Array(16);
            var yRotation = new Float32Array(16);
            var array = [];
            // new Float32Array(Vertices.length*(numSteps+1)*3);

            var identity = glMatrix.mat4.create();
            var angle = 45;

            for (var i = 0; i < Vertices.length; i++){
                var currentArray = Vertices[i];
                array.push(...currentArray);
            }

            var f32array = Float32Array.from(array);
            // console.log(f32array);
            console.log(array);

            var loop = function () {
                angle = performance.now() / 1000 / 6 * 2 * Math.PI;
        
                glMatrix.mat4.rotate(xRotation, identity, angle, [0, 1, 0]);
                glMatrix.mat4.rotate(yRotation, identity, angle / 2, [1, 0, 0]);
                glMatrix.mat4.mul(WorldMatrix, xRotation, yRotation);
                gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, WorldMatrix);
        
                gl.clearColor(0.75, 0.75, 0.8, 1.0);
                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
                // gl.drawElements(gl.LINES, lineIndices.length, gl.UNSIGNED_SHORT, 0);
                gl.bufferData(gl.ARRAY_BUFFER, f32array, gl.STATIC_DRAW);
    
                gl.drawArrays(gl.LINES, 0, f32array.length);

                requestAnimationFrame(loop);
            }
            
            requestAnimationFrame(loop);
        })

    }

    startSim();
};