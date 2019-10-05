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
    // Store a pointer to the glsl canvas for looking up scene information
    glcanvas.glslcanvas = glslcanvas;

    /**
     * A function that sends over information about the camera,
     * lights, and materials
     */
    glcanvas.updateUniforms = function() {
        let shader = glcanvas.shader;
        let gl = glcanvas.gl;
        gl.uniform1f(shader.u_canvas_width, glcanvas.clientWidth);
        gl.uniform1f(shader.u_canvas_height, glcanvas.clientHeight);
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
    glcanvas.setupBuffers = function() {
        let gl = glcanvas.gl;
        glcanvas.fragmentSrcPre = BlockLoader.loadTxt("raytracer.frag");

        glcanvas.vertexShader = getShader(gl, BASIC_VERTEXSHADER_SRC, "vertex");
    
        // Setup four corners of the image in a vertex buffer
        glcanvas.positionBuffer = gl.createBuffer();
        const positions = new Float32Array([-1.0,  1.0,
                                            1.0,  1.0,
                                            -1.0, -1.0,
                                            1.0, -1.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, glcanvas.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
        // Setup 2 triangles connecting the vertices so that there
        // are solid shaded regions
        glcanvas.indexBuffer = gl.createBuffer();
        glcanvas.indexBuffer.itemSize = 1;
        glcanvas.indexBuffer.numItems = 6;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glcanvas.indexBuffer);
        const tris = new Uint16Array([0, 1, 2, 1, 2, 3]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tris, gl.STATIC_DRAW);
    }

    glcanvas.setupShaders = function() {
        let gl = glcanvas.gl;
        let fragmentShader = getShader(gl, glcanvas.fragmentSrcPre, "fragment");

        glcanvas.shader = gl.createProgram();
        let shader = glcanvas.shader;
        gl.attachShader(shader, glcanvas.vertexShader);
        gl.attachShader(shader, fragmentShader);
        gl.linkProgram(shader);
        if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
            alert("Could not initialize raytracing shader");
        }
        shader.name = "raytracer";

        shader.positionLocation = gl.getAttribLocation(shader, "a_position");
        gl.enableVertexAttribArray(shader.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, glcanvas.positionBuffer);
        gl.vertexAttribPointer(shader.positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Setup uniforms
        shader.u_canvas_width = gl.getUniformLocation(shader, "canvas_width");
        shader.u_canvas_height = gl.getUniformLocation(shader, "canvas_height");
        shader.u_numObjects = gl.getUniformLocation(shader, "numObjects");
        shader.u_numLights = gl.getUniformLocation(shader, "numLights");
        shader.u_numMaterials = gl.getUniformLocation(shader, "numMaterials");
    }

    glcanvas.repaint = function() {
        let camera = glcanvas.glslcanvas.camera;
        let shader = glcanvas.shader;
        let gl = glcanvas.gl;
        gl.useProgram(shader);
        glcanvas.updateUniforms();

        // Draw two triangles to fill in all the pixels
        gl.drawElements(gl.TRIANGLES, glcanvas.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        // Redraw if walking
        let thisTime = (new Date()).getTime();
        let dt = (thisTime - glcanvas.lastTime)/1000.0;
        glcanvas.lastTime = thisTime;
        if (glcanvas.movelr != 0 || glcanvas.moveud != 0 || glcanvas.movefb != 0) {
            camera.translate(0, 0, glcanvas.movefb, glcanvas.walkspeed*dt);
            camera.translate(0, glcanvas.moveud, 0, glcanvas.walkspeed*dt);
            camera.translate(glcanvas.movelr, 0, 0, glcanvas.walkspeed*dt);
            camera.position = vecToStr(camera.pos);
            requestAnimFrame(glcanvas.repaint);
        }

    }

    /**
     * A function to move the camera associated to the glsl canvas
     */
    glcanvas.clickerDraggedSync = function(evt) {
        evt.preventDefault();
        let mousePos = this.getMousePos(evt);
        let dX = mousePos.X - this.lastX;
        let dY = mousePos.Y - this.lastY;
        this.lastX = mousePos.X;
        this.lastY = mousePos.Y;
        let camera = glcanvas.glslcanvas.camera;
        if (camera === null) {
            return;
        }
        //Rotate camera by mouse dragging
        camera.rotateLeftRight(-dX);
        camera.rotateUpDown(-dY);
        requestAnimFrame(glcanvas.repaint);
        return false;
    }
    glcanvas.removeEventListener('mousemove', glcanvas.clickerDragged);
    glcanvas.addEventListener('mousemove', glcanvas.clickerDraggedSync);
    glcanvas.removeEventListener('touchmove', glcanvas.clickerDragged);
    glcanvas.addEventListener('touchmove', glcanvas.clickerDraggedSync);

    glcanvas.setupBuffers();
    glcanvas.setupShaders();
}
