/**
 * @file A simple WebGL example drawing a triangle with colors
 * @author Dingkun Wang <dingkun2@illinois.edu>
 * 
 * Updated Spring 2021 to use WebGL 2.0 and GLSL 3.00
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the triangle (new animation)*/
var vertexPositionBufferS;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The WebGL buffer holding the vertex colors (new animation)*/
var vertexColorBufferS;

/** @global The vertex array object for the triangle */
var vertexArrayObject;

/** @global The vertex array object for the triangle (new animation)*/
var vertexArrayObjectStick;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

/** @global The ModelView matrix contains any modeling and viewing transformations */
var modelViewMatrix = glMatrix.mat4.create();

/** @global The ModelView matrix contains any modeling and viewing transformations (new animation)*/
var modelViewMatrix1 = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;


/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


/**
 * Loads a shader.
 * Retrieves the source code from the HTML document and compiles it.
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}


/**
 * Set up the fragment and vertex shaders.
 */
function setupShaders() {
  // Compile the shaders' source code.
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  // Link the shaders together into a program.
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  // We only use one shader program for this example, so we can just bind
  // it as the current program here.
  gl.useProgram(shaderProgram);
    
  // Query the index of each attribute in the list of attributes maintained
  // by the GPU. 
  shaderProgram.vertexPositionAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexColor");
    
  //Get the index of the Uniform variable as well
  shaderProgram.modelViewMatrixUniform =
    gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
}


/**
 * Set up the buffers to hold the triangle's vertex positions and colors.
 */
function setupBuffers(angle) {
    
  // Create the vertex array object, which holds the list of attributes for
  // the triangle.
  vertexArrayObject = gl.createVertexArray();
  gl.bindVertexArray(vertexArrayObject); 

  // Create a buffer for positions, and bind it to the vertex array object.
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  // Use triangles to constitute an "I" in clip coordinates.
  // use some non-uniform transformations
  var vertices = [
      -0.30 * Math.sin(angle),  0.5 * Math.sin(angle), 0.0,
      -0.30 * Math.sin(angle),  0.3 * Math.sin(angle), 0.0,
      -0.15 * Math.sin(angle),  0.3 * Math.sin(angle), 0.0,

      -0.30 * Math.cos(angle),  0.5 * Math.sin(angle), 0.0,
      -0.15 * Math.cos(angle),  0.3 * Math.sin(angle), 0.0,
       0.30 * Math.cos(angle),  0.5 * Math.sin(angle), 0.0,

       0.30 * Math.cos(angle),  0.5 * Math.sin(angle), 0.0,
      -0.15 * Math.cos(angle),  0.3 * Math.sin(angle), 0.0,
       0.15 * Math.cos(angle),  0.3 * Math.sin(angle), 0.0,

       0.30 * Math.sin(angle),  0.5 * Math.sin(angle), 0.0,
       0.15 * Math.sin(angle),  0.3 * Math.sin(angle), 0.0,
       0.30 * Math.sin(angle),  0.3 * Math.sin(angle), 0.0,

      -0.15 * Math.cos(angle),  0.3 * Math.sin(angle), 0.0,
      -0.15 * Math.cos(angle), -0.3 * Math.sin(angle), 0.0,
       0.15 * Math.cos(angle), -0.3 * Math.sin(angle), 0.0,

      -0.15 * Math.cos(angle),  0.3 * Math.sin(angle), 0.0,
       0.15 * Math.cos(angle),  0.3 * Math.sin(angle), 0.0,
       0.15 * Math.cos(angle), -0.3 * Math.sin(angle), 0.0,

      -0.30 * Math.sin(angle), -0.5 * Math.sin(angle), 0.0,
      -0.30 * Math.sin(angle), -0.3 * Math.sin(angle), 0.0,
      -0.15 * Math.sin(angle), -0.3 * Math.sin(angle), 0.0,

      -0.30 * Math.cos(angle), -0.5 * Math.sin(angle), 0.0,
      -0.15 * Math.cos(angle), -0.3 * Math.sin(angle), 0.0,
       0.30 * Math.cos(angle), -0.5 * Math.sin(angle), 0.0,

       0.30 * Math.cos(angle), -0.5 * Math.sin(angle), 0.0,
      -0.15 * Math.cos(angle), -0.3 * Math.sin(angle), 0.0,
       0.15 * Math.cos(angle), -0.3 * Math.sin(angle), 0.0,

       0.30 * Math.sin(angle), -0.5 * Math.sin(angle), 0.0,
       0.15 * Math.sin(angle), -0.3 * Math.sin(angle), 0.0,
       0.30 * Math.sin(angle), -0.3 * Math.sin(angle), 0.0  
  ];

  // Populate the buffer with the position data.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 30;

  // Binds the buffer that we just made to the vertex position attribute.
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // Do the same steps for the color buffer.
  // color set to orange
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0,
        0.910, 0.290, 0.153, 1.0
    ];


  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 30;  

  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
   // Enable each attribute we are using in the VAO.  
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}

/**
 * Set up the buffers to hold the triangle's vertex positions and colors.
 * For new animation
 */
 function setupBuffers1(x) {
    
  // Create the vertex array object, which holds the list of attributes for
  // the triangle.
  vertexArrayObjectStick = gl.createVertexArray();
  gl.bindVertexArray(vertexArrayObjectStick); 

  // Create a buffer for positions, and bind it to the vertex array object.
  vertexPositionBufferS = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferS);

  // Use triangles to constitute stick figure  in clip coordinates.
  // use non-uniform Xform
  var stickp = [
      -0.2-0.4,  0.2, 0.0,
      -0.2-0.4,  0.3, 0.0,
      -0.1-0.4,  0.4, 0.0,

      -0.2-0.4,  0.2, 0.0,
      -0.1-0.4,  0.1, 0.0,
      -0.1-0.4,  0.4, 0.0,

      -0.1-0.4,  0.1, 0.0,
      -0.1-0.4,  0.4, 0.0,
       0.0-0.4,  0.4, 0.0,

      -0.1-0.4,  0.1, 0.0,
       0.0-0.4,  0.4, 0.0,
       0.0-0.4,  0.1, 0.0,

       0.0-0.4,  0.1, 0.0,
       0.1-0.4,  0.2, 0.0,
       0.0-0.4,  0.4, 0.0,

       0.1-0.4,  0.2, 0.0,
       0.1-0.4,  0.3, 0.0,
       0.0-0.4,  0.4, 0.0,

      -0.1-0.4,  0.1, 0.0,
       0.0-0.4,  0.1, 0.0, 
       0.0-0.4, -0.1, 0.0, 

      -0.1-0.4,  0.1, 0.0,
       0.0-0.4, -0.1, 0.0, 
      -0.1-0.4, -0.1, 0.0,

      -0.1-0.4, -0.1, 0.0,
      -0.1-0.4-(Math.sin(x)*Math.sin(x))*0.1, -0.4, 0.0,
      -0.2-0.4, -0.4+(Math.sin(x)*Math.sin(x))*0.1, 0.0,

       0.0-0.4, -0.1, 0.0,
       0.0-0.4+(Math.sin(x)*Math.sin(x))*0.1, -0.4, 0.0,
       0.1-0.4, -0.4+(Math.sin(x)*Math.sin(x))*0.1, 0.0,

       (0.0-0.4),  0.1, 0.0,
       (0.2-0.4),  0.0-(Math.sin(x)*Math.sin(x))*0.1, 0.0, 
       (0.2-0.4),  0.1-(Math.sin(x)*Math.sin(x))*0.1, 0.0, 

      (-0.1-0.4),  0.1, 0.0,
      (-0.2-0.4), -0.1, 0.0,
      (-0.3-0.4), -0.1, 0.0, 


      -0.2-0.4+0.3,  0.2-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
      -0.2-0.4+0.3,  0.3-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
      -0.1-0.4+0.3,  0.4-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,

      -0.2-0.4+0.3,  0.2-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
      -0.1-0.4+0.3,  0.1-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
      -0.1-0.4+0.3,  0.4-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,

      -0.1-0.4+0.3,  0.1-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
      -0.1-0.4+0.3,  0.4-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
       0.0-0.4+0.3,  0.4-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,

      -0.1-0.4+0.3,  0.1-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
       0.0-0.4+0.3,  0.4-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
       0.0-0.4+0.3,  0.1-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,

       0.0-0.4+0.3,  0.1-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
       0.1-0.4+0.3,  0.2-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
       0.0-0.4+0.3,  0.4-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,

       0.1-0.4+0.3,  0.2-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
       0.1-0.4+0.3,  0.3-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,
       0.0-0.4+0.3,  0.4-0.4-(Math.sin(x)*Math.sin(x))*0.1, 0.0,

       0.2-0.4,  0.2, 0.0,
       0.1-0.4,  0.2, 0.0,
       0.1-0.4,  0.3, 0.0,

       0.0-0.4,  0.31, 0.0,
       0.0-0.4,  0.29, 0.0,
       -0.01-0.4,  0.3, 0.0,

       0.0-0.4,  0.31, 0.0,
       0.0-0.4,  0.29, 0.0,
       0.01-0.4,  0.3, 0.0
];
  // Populate the buffer with the position data.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stickp), gl.DYNAMIC_DRAW);
  vertexPositionBufferS.itemSize = 3;
  vertexPositionBufferS.numberOfItems = 63;
  // Binds the buffer that we just made to the vertex position attribute.
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBufferS.itemSize, gl.FLOAT, false, 0, 0);
  
  // Do the same steps for the color buffer.
  vertexColorBufferS = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferS);
  // change the color according to animation frames (x)
  var stickc = [
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,

      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,

      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,

      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,
      1.0*Math.cos(x)*Math.cos(x), 1.0*Math.sin(x)*Math.sin(x), 1.0*Math.sin(x)*Math.sin(x), 1.0,

      0.910, 0.290, 0.153, 1.0,
      0.910, 0.290, 0.153, 1.0,
      0.910, 0.290, 0.153, 1.0,

      0, 0, 0, 1.0,
      0, 0, 0, 1.0,
      0, 0, 0, 1.0,

      0, 0, 0, 1.0,
      0, 0, 0, 1.0,
      0, 0, 0, 1.0
  ];

  //use gl.DYNAMIC_DRAW to draw dynamically
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stickc), gl.DYNAMIC_DRAW);

  vertexColorBufferS.itemSize = 4;
  vertexColorBufferS.numItems = 63;  

  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBufferS.itemSize, gl.FLOAT, false, 0, 0);
    
   // Enable each attribute we are using in the VAO.  
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}


/**
 * Draws a frame to the screen.
 */
 function draw() {
  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // Clear the screen.
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use the vertex array object that we set up.
  if (document.getElementById("I").checked == true)
      //bind the VAO for the I logo
      gl.bindVertexArray(vertexArrayObject);
  else  // bind new VAO of new animation
      gl.bindVertexArray(vertexArrayObjectStick);
  
    
  // Send the ModelView matrix with our transformations to the vertex shader.
  // use diff Xform matrix for diff animations
  if (document.getElementById("I").checked == true)
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform, false, modelViewMatrix);
    
  else
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform, false, modelViewMatrix1);
  // Render the triangle. 
  // use diff buffer for diff animations
  if (document.getElementById("I").checked == true)
     gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  else
     gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBufferS.numberOfItems);
  
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}


/**
 * Animates the triangle by updating the ModelView matrix with a rotation
 * each frame.
 */
 function animate(currentTime) {
  // Read the speed slider from the web page.
  var speed = document.getElementById("speed").value;

  // Convert the time to seconds.
  currentTime *= 0.001;
  // Subtract the previous time from the current time.
  var deltaTime = currentTime - previousTime;
  // Remember the current time for the next frame.
  previousTime = currentTime;
     
  // Update geometry to rotate 'speed' degrees per second.
  rotAngle += speed * deltaTime;
  if (rotAngle > 360.0)
      rotAngle = 0.0;
  
  // translate and scale "I" according to rotAngle
  // first move to left then to right, first become smaller then bigger
  if (rotAngle <= 180){
      glMatrix.mat4.fromTranslation(modelViewMatrix, [-rotAngle/360.0, 0.2, 0]);
      glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [1.2*(1.0-rotAngle/360.0), 1.2*(1.0-rotAngle/360.0), 0]);
  }

  else{
      glMatrix.mat4.fromTranslation(modelViewMatrix, [(rotAngle-360.0)/360.0, 0.2, 0]);
      glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [1.2*rotAngle/360.0, 1.2*rotAngle/360.0, 0]);
  }
  // rotate around a vertex of the "I"
  glMatrix.mat4.rotateZ(modelViewMatrix, modelViewMatrix, degToRad(rotAngle));
  
  // let the new animation "little swan" move
  glMatrix.mat4.fromTranslation(modelViewMatrix1, [rotAngle/360.0, 0, 0]);
  
  // change the vertex positions directly
  setupBuffers(currentTime);  
  setupBuffers1(currentTime);
  // Draw the frame.
  draw();
  
  // Animate the next frame. The animate function is passed the current time in
  // milliseconds.
  requestAnimationFrame(animate);
}


/**
 * Startup function called from html code to start the program.
 */
 function startup() {
  console.log("Starting animation...");
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(animate); 
}

