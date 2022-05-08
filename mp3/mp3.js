/**
 * @file MP2.js - A simple WebGL rendering engine
 * @author Ian Rudnick <itr2@illinois.edu>
 * @brief Starter code for CS 418 MP2 at the University of Illinois at
 * Urbana-Champaign.
 * 
 * Updated Spring 2021 for WebGL 2.0/GLSL 3.00 ES.
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas to draw on */
var canvas;

/** @global The GLSL shader program */
var shaderProgram;

/** @global An object holding the geometry for your 3D terrain */
var myTerrain;

/** @global The Model matrix */
var modelViewMatrix = glMatrix.mat4.create();
/** @global The Projection matrix */
var projectionMatrix = glMatrix.mat4.create();
/** @global The Normal matrix */
var normalMatrix = glMatrix.mat3.create();

var shininess = 2;
/** @global min z coordinate in the terrain */
var minZ;
/** @global max z coordinate in the terrain */
var maxZ;

// Light parameters
/** @global Light position in WORLD coordinates */
var lightPosition = [-2, -3, 10];
/** @global Ambient light color/intensity for Phong reflection */
var ambientLightColor = [0.1, 0.1, 0.1];
/** @global Diffuse light color/intensity for Phong reflection */
var diffuseLightColor = [0.9, 0.9, 0.9];
/** @global Specular light color/intensity for Phong reflection */
var specularLightColor = [0.2, 0.2, 0.2];

var camPosition = glMatrix.vec3.fromValues(0.0, -1.6, 0.63);          //the camera's current position
var camOrientation = glMatrix.quat.create();        //the camera's current orientation
var camInitialDir = glMatrix.vec3.fromValues(0, 0.2, -0.05);      //the camera's initial view direction  
var camSpeed = 3e-4;                                 //the camera's current speed in the forward direction

/** @global The currently pressed keys */
var keys = {};

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}


//-----------------------------------------------------------------------------
// Setup functions (run once)
/**
 * Startup function called from the HTML code to start program.
 */
function startup() {
  // Set up the canvas with a WebGL context.
  canvas = document.getElementById("glCanvas");
  gl = createGLContext(canvas);

  // Compile and link the shader program.
  setupShaders();

  // Let the Terrain object set up its own buffers.
  myTerrain = new Terrain(128, -1, 1, -1, 1);
  myTerrain.setupBuffers(shaderProgram);

  // Set the background color to sky blue (you can change this if you like).
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  document.onkeydown = keyDown;
  document.onkeyup = keyUp;

  requestAnimationFrame(animate);
}


/**
 * Creates a WebGL 2.0 context.
 * @param {element} canvas The HTML5 canvas to attach the context to.
 * @return {Object} The WebGL 2.0 context.
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
 * Loads a shader from the HTML document and compiles it.
 * @param {string} id ID string of the shader script to load.
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
    
  // Return null if we don't find an element with the specified id
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
 * Sets up the vertex and fragment shaders.
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

  // We only need the one shader program for this rendering, so we can just
  // bind it as the current program here.
  gl.useProgram(shaderProgram);

  // Query the index of each attribute and uniform in the shader program.
  shaderProgram.locations = {};
  shaderProgram.locations.vertexPosition =
    gl.getAttribLocation(shaderProgram, "vertexPosition");
  shaderProgram.locations.vertexNormal =
    gl.getAttribLocation(shaderProgram, "vertexNormal");

  shaderProgram.locations.modelViewMatrix =
    gl.getUniformLocation(shaderProgram, "modelViewMatrix");
  shaderProgram.locations.projectionMatrix =
    gl.getUniformLocation(shaderProgram, "projectionMatrix");
  shaderProgram.locations.normalMatrix =
    gl.getUniformLocation(shaderProgram, "normalMatrix");

  shaderProgram.locations.shininess =
    gl.getUniformLocation(shaderProgram, "shininess");
  
  shaderProgram.locations.lightPosition =
    gl.getUniformLocation(shaderProgram, "lightPosition");
  shaderProgram.locations.ambientLightColor =
    gl.getUniformLocation(shaderProgram, "ambientLightColor");
  shaderProgram.locations.diffuseLightColor =
    gl.getUniformLocation(shaderProgram, "diffuseLightColor");
  shaderProgram.locations.specularLightColor =
    gl.getUniformLocation(shaderProgram, "specularLightColor");
  
  shaderProgram.locations.maxZ =
    gl.getUniformLocation(shaderProgram, "maxZ");
  shaderProgram.locations.minZ =
    gl.getUniformLocation(shaderProgram, "minZ");  
  shaderProgram.locations.fog =
    gl.getUniformLocation(shaderProgram, "fog"); 
}

/**
 * Draws the terrain to the screen.
 */
function draw() {
  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  // Clear the color buffer and the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Generate the projection matrix using perspective projection.
  const near = 0.1;
  const far = 200.0;
  glMatrix.mat4.perspective(projectionMatrix, degToRad(60), 
                            gl.viewportWidth / gl.viewportHeight,
                            near, far);
  
  // Generate the view matrix using lookat. 
  var up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
  glMatrix.vec3.transformQuat(up, up, camOrientation);

  var center = glMatrix.vec3.create();
  glMatrix.vec3.transformQuat(center, camInitialDir, camOrientation);
  glMatrix.vec3.add(center, center, camPosition);
  //console.log(camPosition, center, up);
  glMatrix.mat4.lookAt(modelViewMatrix, camPosition, center, up);
  
  var fog = 0;
  if (document.getElementById("fog").checked)   // enable fog
    fog = 1;

  setColMapUniforms();
  setMatrixUniforms();
  setLightUniforms(ambientLightColor, diffuseLightColor, specularLightColor,
                   lightPosition, shininess, fog);
  
  // Draw the triangles, the wireframe, or both, based on the render selection.
  if (document.getElementById("polygon").checked) { 
    myTerrain.drawTriangles();
  }
  else if (document.getElementById("wirepoly").checked) {
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    myTerrain.drawTriangles();
    gl.disable(gl.POLYGON_OFFSET_FILL);
    myTerrain.drawEdges();
  }
  else if (document.getElementById("wireframe").checked) {
    myTerrain.drawEdges();
  }
}

/**
 * Sends the two float uniforms for colomap to the shader program..
 */
function setColMapUniforms() {
  maxZ = myTerrain.getMaxElevation();
  minZ = myTerrain.getMinElevation();
  gl.uniform1f(shaderProgram.locations.maxZ, maxZ);
  gl.uniform1f(shaderProgram.locations.minZ, minZ);
}

/**
 * Sends the three matrix uniforms to the shader program.
 */
 function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.locations.modelViewMatrix, false,
                      modelViewMatrix);
  gl.uniformMatrix4fv(shaderProgram.locations.projectionMatrix, false,
                      projectionMatrix);

  // We want to transform the normals by the inverse-transpose of the
  // Model/View matrix
  glMatrix.mat3.fromMat4(normalMatrix,modelViewMatrix);
  glMatrix.mat3.transpose(normalMatrix,normalMatrix);
  glMatrix.mat3.invert(normalMatrix,normalMatrix);

  gl.uniformMatrix3fv(shaderProgram.locations.normalMatrix, false,
                      normalMatrix);
}

/**
 * Sends light information to the shader program.
 * @param {Float32Array} a Ambient light color/intensity.
 * @param {Float32Array} d Diffuse light color/intensity.
 * @param {Float32Array} s Specular light color/intensity.
 * @param {Float32Array} loc The light position, in view coordinates.
 */
function setLightUniforms(a, d, s, loc, alpha, fog) {
  gl.uniform3fv(shaderProgram.locations.ambientLightColor, a);
  gl.uniform3fv(shaderProgram.locations.diffuseLightColor, d);
  gl.uniform3fv(shaderProgram.locations.specularLightColor, s);
  gl.uniform3fv(shaderProgram.locations.lightPosition, loc);
  gl.uniform1f(shaderProgram.locations.shininess, alpha);
  gl.uniform1i(shaderProgram.locations.fog, fog);
}

/** 
 * Logs keys as "down" when pressed 
 */
function keyDown(event) {
  console.log("Key down ", event.key, " code ", event.code);
  keys[event.key] = true;
}

/** 
 * Logs keys as "up" when released 
 */
function keyUp(event) {
  console.log("Key up ", event.key, " code ", event.code);
  keys[event.key] = false;
}


/**
 * Animates...allows user to change the geometry view between
 * wireframe, polgon, or both.
 * change view and speed as well
 */
 function animate(timeStamp) {

  var pitchAng = 0;
  var yawAng = 0;
  var rollAng = 0;
  // change speed and reinitialize
  if (keys["="]) 
    camSpeed += 1e-4;
  if (keys["-"]) 
    camSpeed -= 1e-4;
  if (keys["Escape"]) {
    camOrientation = glMatrix.quat.fromValues(0.0, 0.0, 0.0, 1.0);
    camPosition = glMatrix.vec3.fromValues(0.0, -1.6, 0.63);
    camSpeed = 3e-4;
  } 
  // change orientation
  if (keys["ArrowUp"]) 
    pitchAng += 1;
  if (keys["ArrowDown"])
    pitchAng -= 1;
  if (keys["ArrowLeft"])
    rollAng -= 1;
  if (keys["ArrowRight"])
    rollAng += 1;

  var deltaPosition = glMatrix.vec3.create();  
  var orientationDelta = glMatrix.quat.create();
  var forwardDirection = glMatrix.vec3.create(); 

  // change camOrientation and camPosition
  glMatrix.quat.fromEuler(orientationDelta, pitchAng, rollAng, yawAng);
  glMatrix.quat.multiply(camOrientation, camOrientation, orientationDelta);
  glMatrix.vec3.transformQuat(forwardDirection, camInitialDir, camOrientation);
  glMatrix.vec3.normalize(forwardDirection, forwardDirection);
  glMatrix.vec3.scale(deltaPosition, forwardDirection, camSpeed);
  glMatrix.vec3.add(camPosition, camPosition, deltaPosition);
  
  // Draw the frame.
  draw();
  // Animate the next frame. 
  requestAnimationFrame(animate);
}