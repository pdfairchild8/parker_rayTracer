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


 const BASIC_VERTEXSHADER_SRC = "attribute vec2 a_position;varying vec2 v_position;void main() {gl_Position = vec4(a_position, 0, 1);v_position = a_position;}";


/**
 * 
 * @param {DOM Element} glcanvas Handle to HTML where the glcanvas resides
 * @param {SceneCanvas} glslcanvas Pointer to glsl canvas
 * @param {string} shadersrelpath Path to the folder that contains the shaders,
 *                                relative to where the constructor is being called
 */
function RayCanvas(glcanvas, glslcanvas, shadersrelpath) {
    // Initialize a WebGL handle and keyboard/mouse callbacks
    BaseCanvas(glcanvas, shadersrelpath); 
    // Make sure this canvas and the glsl canvas both control the same camera
    glcanvas.camera = glslcanvas.camera; 
    // Store a pointer to the glsl canvas for looking up scene information
    glcanvas.glslcanvas = glslcanvas

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

        let vertexShader = getShader(gl, BASIC_VERTEXSHADER_SRC, "vertex");
        let fragmentShader = getShader(gl, BlockLoader.loadTxt("raytracer.frag"), "fragment");

        let shader = gl.createProgram();
        gl.attachShader(shader, vertexShader);
        gl.attachShader(shader, fragmentShader);
        gl.linkProgram(shader);
        if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
            alert("Could not initialize raytracing shader");
        }
        shader.name = "raytracer";

        const positionLocation = gl.getAttribLocation(shader, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        const positionBuffer = gl.createBuffer();
        const positions = new Float32Array([-1.0,  1.0,
                                            1.0,  1.0,
                                            -1.0, -1.0,
                                            1.0, -1.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        // Setup 2 triangles connecting the vertices so that there
        // are solid shaded regions
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        const tris = new Uint16Array([0, 1, 2, 1, 2, 3]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tris, gl.STATIC_DRAW);
        indexBuffer.itemSize = 1;
        indexBuffer.numItems = 6;
        
        glcanvas.positionBuffer = positionBuffer;
        glcanvas.indexBuffer = indexBuffer;
        glcanvas.shader = shader;
        glcanvas.positionLocation = positionLocation;
    }

    glcanvas.repaint = function() {
        let gl = glcanvas.gl;

        gl.useProgram(glcanvas.shader);
        glcanvas.updateUniforms();
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, glcanvas.positionBuffer);
        gl.vertexAttribPointer(glcanvas.shader.positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glcanvas.indexBuffer);
        gl.drawElements(gl.TRIANGLES, glcanvas.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    }

    glcanvas.setupBasicShaders();
}
