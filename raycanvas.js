/**
    A class to construct a shader corresponding to a scene.
    Every time the scene is changed, this should create a new
    fragment shader with elements of the scene declared as constants,
    and then it will call this fragment shader to set off the ray tracer

    Assumes that
    ggslac/viewers/scenecanvas.js
    ggslac/viewers/basecanvas.js
    have been included already
 */


 const BASIC_VERTEXSHADER_SRC = "attribute vec2 a_position;void main() {gl_Position = vec4(a_position, 0, 1);}";


/**
 * 
 * @param {DOM Element} glcanvas Handle to HTML where the glcanvas resides
 * @param {SceneCanvas} glslcanvas Pointer to glsl canvas
 */
function RayCanvas(glcanvas, glslcanvas) {
    // Initialize a WebGL handle and keyboard/mouse callbacks
    BaseCanvas(glcanvas); 
    // Make sure this canvas and the glsl canvas both control the same camera
    glcanvas.camera = glslcanvas.camera; 
    // Store a pointer to the glsl canvas for looking up scene information
    glcanvas.glslcanvas = glslcanvas;

    /**
     * A function that sends over information about the camera,
     * lights, and materials
     */
    glcanvas.updateUniforms = function() {

    }

    /**
     * Setup and compile a new fragment shader based on objects in the scene
     */
    glcanvas.updateScene = function() {

    }

    /**
     * Setup the vertex shader and four corners of the image,
     * which never change
     */
    glcanvas.setupBasicShaders = function() {
        let gl = glcanvas.gl;
        glcanvas.fragmentSrcPre = BlockLoader.loadTxt("raytracer.frag");

        let vertexShader = getShader(gl, BASIC_VERTEXSHADER_SRC, "vertex");
        let fragmentShader = getShader(gl, glcanvas.fragmentSrcPre, "fragment");

        glcanvas.shader = gl.createProgram();
        let shader = glcanvas.shader;
        gl.attachShader(shader, vertexShader);
        gl.attachShader(shader, fragmentShader);
        gl.linkProgram(shader);
        if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
            alert("Could not initialize raytracing shader");
        }
        shader.name = "raytracer";

        shader.positionLocation = gl.getAttribLocation(shader, "a_position");
        gl.enableVertexAttribArray(shader.positionLocation);
    
        // Setup some dummy positions for the vertex buffer
        shader.positionBuffer = gl.createBuffer();
        const positions = new Float32Array([-1.0,  1.0,
                                            1.0,  1.0,
                                            -1.0, -1.0,
                                            1.0, -1.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, shader.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(shader.positionLocation, 2, gl.FLOAT, false, 0, 0);
    
        // Setup 2 triangles connecting the vertices so that there
        // are solid shaded regions
        shader.indexBuffer = gl.createBuffer();
        shader.indexBuffer.itemSize = 1;
        shader.indexBuffer.numItems = 6;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shader.indexBuffer);
        const tris = new Uint16Array([0, 1, 2, 1, 2, 3]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tris, gl.STATIC_DRAW);
    }

    glcanvas.repaint = function() {
        let shader = glcanvas.shader;
        let gl = glcanvas.gl;
        gl.useProgram(shader);

        // Bind vertex and index buffers to draw two triangles
        gl.bindBuffer(gl.ARRAY_BUFFER, shader.positionBuffer);
        gl.vertexAttribPointer(shader.positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shader.indexBuffer);
        gl.drawElements(gl.TRIANGLES, shader.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    glcanvas.setupBasicShaders();
}
