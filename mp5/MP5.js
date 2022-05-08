/**
 * @file MP5.js - A simple WebGL rendering engine
 * @author Ian Rudnick <itr2@illinois.edu>
 * @brief Starter code for CS 418 MP5 at the University of Illinois at
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

/** @global An object holding the geometry for your 3D model */
var sphere1;

/** @global The Model matrix */
var modelViewMatrix = glMatrix.mat4.create();
/** @global The Model matrix */
var viewMatrix = glMatrix.mat4.create();
/** @global The Projection matrix */
var projectionMatrix = glMatrix.mat4.create();
/** @global The Normal matrix */
var normalMatrix = glMatrix.mat3.create();

// Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [0.25, 0.75, 1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kDiffuse = [0.25, 0.75, 1.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.25, 0.75, 1.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 2;

/** @global Ambient light color */
const lAmbient = [0.4, 0.4, 0.4];
/** @global Diffuse light color */
const lDiffuse = [1.0, 1.0, 1.0];
/** @global Specular  light color */
const lSpecular = [1.0, 1.0, 1.0];
const g = glMatrix.vec3.fromValues(0.0, -9.81, 0.0);
const drag = 0.7;

const m = 2.5;
const MaxBalls = 50;
var NumBalls = 10;
var Position = [];
var Velocity = [];
var Radius = [];
var Color = [];
var Mass = [];
var stop = [];

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
// Setup functions (run once when the webpage loads)
/**
 * Startup function called from the HTML code to start program.
 */
function startup() {
  // Set up the canvas with a WebGL context.
  canvas = document.getElementById("glCanvas");
  gl = createGLContext(canvas);

  // Compile and link a shader program.
  setupShaders();

  // Create a sphere mesh and set up WebGL buffers for it.
  sphere1 = new Sphere(5);
  sphere1.setupBuffers(shaderProgram);
  
  // Create the projection matrix with perspective projection.
  const near = 0.1;
  const far = 200.0;
  glMatrix.mat4.perspective(projectionMatrix, degToRad(45), 
                            gl.viewportWidth / gl.viewportHeight,
                            near, far);
    
  // Set the background color to black (you can change this if you like).    
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  document.onkeydown = keyDown;
  document.onkeyup = keyUp;
  for(var i = 0; i < MaxBalls; i++){
    Position.push(glMatrix.vec3.create());
    Velocity.push(glMatrix.vec3.create());
    Color.push(glMatrix.vec3.create());
    Radius.push(0.0);
    // uniform mass
    Mass.push(1.0);
    stop.push(false);
  }

  for(var i = 0; i < NumBalls; i++){
    Radius[i] = Math.random() * 0.2 + 0.2;  // 0.2 ~ 0.4
    Position[i] = glMatrix.vec3.fromValues(Math.random() * (2 * m - 2 * Radius[i]) - m + Radius[i], 
                                           Math.random() * (2 * m - 2 * Radius[i]) - m + Radius[i], 
                                           Math.random() * (2 * m - 2 * Radius[i]) - m + Radius[i]);  
                                           // -m + Radius[i] ~ m - Radius[i]
    glMatrix.vec3.random(Velocity[i]);
    glMatrix.vec3.scale(Velocity[i], Velocity[i], Math.random() * 4 + 1);  // 1 ~ 5
    //console.log(Velocity[i]);
    Color[i] = glMatrix.vec3.fromValues(Math.random() * 0.8 + 0.1, 
                                        Math.random() * 0.8 + 0.1, 
                                        Math.random() * 0.8 + 0.1);  // 0.1 ~ 0.9
    Mass[i] = 1.0;
    stop[i] = false;
  }
  // Start animating.
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

  // If you have multiple different shader programs, you'll need to move this
  // function to draw() and call it whenever you want to switch programs
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

  shaderProgram.locations.kAmbient =
    gl.getUniformLocation(shaderProgram, "kAmbient");
  shaderProgram.locations.kDiffuse =
    gl.getUniformLocation(shaderProgram, "kDiffuse");
  shaderProgram.locations.kSpecular =
    gl.getUniformLocation(shaderProgram, "kSpecular");
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
  shaderProgram.locations.color =
  gl.getUniformLocation(shaderProgram, "color");
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

var preT = 0.0;
//-----------------------------------------------------------------------------
// Animation functions (run every frame)
/**
 * Draws the current frame and then requests to draw the next frame.
 * @param {number} currentTime The elapsed time in milliseconds since the
 *    webpage loaded. 
 */
function animate(currentTime) {
  // Add code here using currentTime if you want to add animations
  // console.log(currentTime);
  if(keys["ArrowLeft"]) {
    if(NumBalls < MaxBalls){
      for(var i = 0; i < 1; i++){
        Radius[NumBalls+i] = Math.random() * 0.2 + 0.2;  // 0.2 ~ 0.4
        Position[NumBalls+i] = glMatrix.vec3.fromValues(Math.random() * (2 * m - 2 * Radius[i]) - m + Radius[i], 
                                                        Math.random() * (2 * m - 2 * Radius[i]) - m + Radius[i], 
                                                        Math.random() * (2 * m - 2 * Radius[i]) - m + Radius[i]);  
                                                        // -m + Radius[i] ~ m - Radius[i]
        glMatrix.vec3.random(Velocity[NumBalls+i]);
        glMatrix.vec3.scale(Velocity[NumBalls+i], Velocity[NumBalls+i], Math.random() * 4 + 1);  // 1 ~ 5
        Color[NumBalls+i] = glMatrix.vec3.fromValues(Math.random() * 0.8 + 0.1, 
                                        Math.random() * 0.8 + 0.1, 
                                        Math.random() * 0.8 + 0.1);  // 0.1 ~ 0.
        Mass[NumBalls+i] = 1.0;
        stop[NumBalls+i] = false;
      }
      NumBalls ++;
    }
  } 

  if(keys["ArrowRight"])
    NumBalls = 0;

  // Set up the canvas for this frame
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  var modelMatrix = glMatrix.mat4.create();
  var viewMatrix = glMatrix.mat4.create();

  // Create the view matrix using lookat.
  const lookAtPt = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
  const eyePt = glMatrix.vec3.fromValues(0.0, 0.0, 10.0);
  const up = glMatrix.vec3.fromValues(0.0, 1.0, 0.0); 
  glMatrix.mat4.lookAt(viewMatrix, eyePt, lookAtPt, up);

  // Transform the light position to view coordinates
  var lightPosition = glMatrix.vec3.fromValues(2, 2, -10);
  glMatrix.vec3.transformMat4(lightPosition, lightPosition, viewMatrix);

  setLightUniforms(lAmbient, lDiffuse, lSpecular, lightPosition);
  setMaterialUniforms(kAmbient, kDiffuse, kSpecular, shininess);

  var t = currentTime / 1000.0 - preT;
  preT = currentTime / 1000.0;
  for(var i = 0; i < NumBalls; i++){
    if(stop[i])  continue;
    var out1 = glMatrix.vec3.create(), out2 = glMatrix.vec3.create();
    var o = glMatrix.vec3.create();
    glMatrix.vec3.copy(o, Position[i]);
    glMatrix.vec3.scale(out1, Velocity[i], t);
    glMatrix.vec3.add(Position[i], Position[i], out1);
    var ctmin = -1;
    var cases;
    if(Position[i][0] + Radius[i] >= m){
      var ct = (m - Radius[i] - o[0]) / Velocity[i][0];
      if(ctmin == -1 || ctmin > ct){
        ctmin = ct;
        cases = 1;
      }
    } 
    if(Position[i][1] + Radius[i] >= m){
      var ct = (m - Radius[i] - o[1]) / Velocity[i][1];
      if(ctmin == -1 || ctmin > ct){
        ctmin = ct;
        cases = 2;
      }
    } 
    if(Position[i][2] + Radius[i] >= m){
      var ct = (m - Radius[i] - o[2]) / Velocity[i][2];
      if(ctmin == -1 || ctmin > ct){
        ctmin = ct;
        cases = 3;
      }
    } 
    if(Position[i][0] - Radius[i] <= -m){
      var ct = (-m + Radius[i] - o[0]) / Velocity[i][0];
      if(ctmin == -1 || ctmin > ct){
        ctmin = ct;
        cases = 4;
      }
    } 
    if(Position[i][1] - Radius[i] <= -m){
      var ct = (-m + Radius[i] - o[1]) / Velocity[i][1];
      if(ctmin == -1 || ctmin > ct){
        ctmin = ct;
        cases = 5;
      }
    } 
    if(Position[i][2] - Radius[i] <= -m){
      var ct = (-m + Radius[i] - o[2]) / Velocity[i][2];
      if(ctmin == -1 || ctmin > ct){
        ctmin = ct;
        cases = 6;
      }
    }
    //console.log(Position[i][1] - o[1]);
    if(ctmin == -1){
      glMatrix.vec3.scale(out1, Velocity[i], Math.pow(drag, t));
      glMatrix.vec3.scale(out2, g, t);
      glMatrix.vec3.add(Velocity[i], out1, out2);
    }
    else{
      glMatrix.vec3.scale(out1, Velocity[i], ctmin);
      glMatrix.vec3.add(Position[i], o, out1);
      glMatrix.vec3.scale(out1, Velocity[i], Math.pow(drag, ctmin));
      glMatrix.vec3.scale(out2, g, ctmin);
      glMatrix.vec3.add(Velocity[i], out1, out2);
      var n = glMatrix.vec3.create();
      if(cases == 1)  n = glMatrix.vec3.fromValues(-1, 0, 0);
      if(cases == 2)  n = glMatrix.vec3.fromValues(0, -1, 0);
      if(cases == 3)  n = glMatrix.vec3.fromValues(0, 0, -1);
      if(cases == 4)  n = glMatrix.vec3.fromValues(1, 0, 0);
      if(cases == 5)  n = glMatrix.vec3.fromValues(0, 1, 0);
      if(cases == 6)  n = glMatrix.vec3.fromValues(0, 0, 1);
      var dotV = glMatrix.vec3.dot(Velocity[i], n);
      glMatrix.vec3.scale(out1, n, -2 * dotV);
      glMatrix.vec3.add(Velocity[i], Velocity[i], out1);
      glMatrix.vec3.scale(Velocity[i], Velocity[i], 0.7);
    }
    if(Math.abs(Position[i][1] - Radius[i] + m) < 0.001 && Math.abs(Position[i][1] - o[1]) < 0.005){
      Velocity[i] = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
      stop[i] = true;
      //console.log(Position[i][1]);
    }
    //console.log(Position[i][1]);
  }

  // You can draw multiple spheres by changing the modelViewMatrix, calling
  // setMatrixUniforms() again, and calling gl.drawArrays() again for each
  // sphere. You can use the same sphere object and VAO for all of them,
  // since they have the same triangle mesh.
  sphere1.bindVAO();
  for(var i = 0; i < NumBalls; i++){
    var S = glMatrix.mat4.create(), T = glMatrix.mat4.create();
    glMatrix.mat4.fromScaling(S, [Radius[i], Radius[i], Radius[i]]);
    glMatrix.mat4.fromTranslation(T, Position[i]);
    glMatrix.mat4.multiply(modelMatrix, T, S);
    // Concatenate the model and view matrices.
    // Remember matrix multiplication order is important.
    glMatrix.mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    setMatrixUniforms(Color[i]);
    gl.drawArrays(gl.TRIANGLES, 0, sphere1.numTriangles*3);
  }

  sphere1.unbindVAO();

  // Use this function as the callback to animate the next frame.
  requestAnimationFrame(animate);
}


/**
 * Sends the three matrix uniforms to the shader program.
 */
function setMatrixUniforms(color) {
  gl.uniformMatrix4fv(shaderProgram.locations.modelViewMatrix, false,
                      modelViewMatrix);
  gl.uniformMatrix4fv(shaderProgram.locations.projectionMatrix, false,
                      projectionMatrix);
  
  gl.uniform3fv(shaderProgram.locations.color, color);
  // We want to transform the normals by the inverse-transpose of the
  // Model/View matrix
  glMatrix.mat3.fromMat4(normalMatrix,modelViewMatrix);
  glMatrix.mat3.transpose(normalMatrix,normalMatrix);
  glMatrix.mat3.invert(normalMatrix,normalMatrix);

  gl.uniformMatrix3fv(shaderProgram.locations.normalMatrix, false,
                      normalMatrix);
}


/**
 * Sends material properties to the shader program.
 * @param {Float32Array} a Ambient material color.
 * @param {Float32Array} d Diffuse material color.
 * @param {Float32Array} s Specular material color.
 * @param {Float32} alpha shininess coefficient
 */
function setMaterialUniforms(a, d, s, alpha) {
  gl.uniform3fv(shaderProgram.locations.kAmbient, a);
  gl.uniform3fv(shaderProgram.locations.kDiffuse, d);
  gl.uniform3fv(shaderProgram.locations.kSpecular, s);
  gl.uniform1f(shaderProgram.locations.shininess, alpha);
}


/**
 * Sends light information to the shader program.
 * @param {Float32Array} a Ambient light color/intensity.
 * @param {Float32Array} d Diffuse light color/intensity.
 * @param {Float32Array} s Specular light color/intensity.
 * @param {Float32Array} loc The light position, in view coordinates.
 */
function setLightUniforms(a, d, s, loc) {
  gl.uniform3fv(shaderProgram.locations.ambientLightColor, a);
  gl.uniform3fv(shaderProgram.locations.diffuseLightColor, d);
  gl.uniform3fv(shaderProgram.locations.specularLightColor, s);
  gl.uniform3fv(shaderProgram.locations.lightPosition, loc);
}

