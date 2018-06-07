/**
 * @file A WebGL program drawing and animating an Illinois Badge
 * @author Troy Houchin <thouchi2@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The angle of rotation around the z axis */
var rotAngle = 0;

/** @global The way to control scaleing */
var scaleTime = 0;

var x = 0.50;

var y = 0.50;

var x_pos = 0.0;

var y_pos = 0.0;

/** @global Time stamp of previous frame in ms */
var lastTime = 0;

/** @global A glmatrix vector to use for transformations */
var transformVec = vec3.create();    

// Initialize the vector....
vec3.set(transformVec,0.0,0.0,-2.0);

/** @global A glmatrix vector to use for scaling */
var scaleVec = vec3.create();    

// Initialize the vector....
vec3.set(scaleVec,2.0,2.0,1.0);

/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

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
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
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

function deformSin(x,y,angle){
    var circPt = vec2.fromValues(x,y);
    var dist = 0.2*Math.sin((angle) + degToRad(defAngle));
    vec2.normalize(circPt,circPt);
    vec2.scale(circPt,circPt,dist);
    return circPt;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Populate buffers with data
 */
function setupBuffers(numVertices) {    
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
      
/**
* Draw I
*/
          -0.10,  0.15,  0.0,
           0.10,  0.15,  0.0,
          -0.10, -0.15,  0.0,

          -0.10, -0.15,  0.0,
           0.10, -0.15,  0.0,
           0.10,  0.15,  0.0,
          
          -0.20, -0.15,  0.0,
          -0.20, -0.30,  0.0,
           0.20, -0.30,  0.0,
      
           0.20, -0.15,  0.0,
           0.20, -0.30,  0.0,
          -0.20, -0.15,  0.0,
      
          -0.20,  0.15,  0.0,
          -0.20,  0.30,  0.0,
           0.20,  0.30,  0.0,
      
           0.20,  0.15,  0.0,
           0.20,  0.30,  0.0,
          -0.20,  0.15,  0.0,
      
/**
* Draw Shield
*/
      
          -0.40, -0.30,  0.0,
          -0.20, -0.30,  0.0,
          -0.40,  0.30,  0.0,
      
          -0.40,  0.30,  0.0,
          -0.20,  0.30,  0.0,
          -0.20, -0.30,  0.0,
      
          -0.20, -0.15,  0.0,
          -0.10, -0.15,  0.0,
          -0.20,  0.15,  0.0,
      
          -0.20,  0.15,  0.0,
          -0.10,  0.15,  0.0,
          -0.10, -0.15,  0.0,
      
          -0.50,  0.45,  0.0,
          -0.50,  0.30,  0.0,
           0.50,  0.30,  0.0,
      
           0.50,  0.45,  0.0,
           0.50,  0.30,  0.0,
          -0.50,  0.45,  0.0,
      
           0.40,  0.30,  0.0,
           0.20,  0.30,  0.0,
           0.40, -0.30,  0.0,
      
           0.40, -0.30,  0.0,
           0.20, -0.30,  0.0,
           0.20,  0.30,  0.0,
      
           0.20,  0.15,  0.0,
           0.10,  0.15,  0.0,
           0.20, -0.15,  0.0,
      
           0.20, -0.15,  0.0,
           0.10, -0.15,  0.0,
           0.10,  0.15,  0.0,
      
/**
* Draw Stripes
**/
          
          -0.400, -0.333,  0.000,
          -0.333, -0.333,  0.000,
          -0.400, -0.400,  0.000,
      
          -0.400, -0.400,  0.000,
          -0.333, -0.400,  0.000,
          -0.333, -0.333,  0.000,
    
          -0.400, -0.400,  0.000,
          -0.333, -0.400,  0.000,
          -0.333, -0.466,  0.000,
      
          -0.266, -0.333,  0.000,
          -0.200, -0.333,  0.000,
          -0.266, -0.530,  0.000,
      
          -0.266, -0.530,  0.000,
          -0.200, -0.530,  0.000,
          -0.200, -0.333,  0.000,
    
          -0.266, -0.530,  0.000,
          -0.200, -0.530,  0.000,
          -0.200, -0.596,  0.000,
      
          -0.133, -0.333,  0.000,
          -0.066, -0.333,  0.000,
          -0.133, -0.666,  0.000,
      
          -0.133, -0.666,  0.000,
          -0.066, -0.666,  0.000,
          -0.066, -0.333,  0.000,
    
          -0.133, -0.666,  0.000,
          -0.066, -0.666,  0.000,
          -0.066, -0.733,  0.000,
      
           0.133, -0.333,  0.000,
           0.066, -0.333,  0.000,
           0.133, -0.666,  0.000,
      
           0.133, -0.666,  0.000,
           0.066, -0.666,  0.000,
           0.066, -0.333,  0.000,
    
           0.133, -0.666,  0.000,
           0.066, -0.666,  0.000,
           0.066, -0.733,  0.000,
      
           0.266, -0.333,  0.000,
           0.200, -0.333,  0.000,
           0.266, -0.530,  0.000,
      
           0.266, -0.530,  0.000,
           0.200, -0.530,  0.000,
           0.200, -0.333,  0.000,
    
           0.266, -0.530,  0.000,
           0.200, -0.530,  0.000,
           0.200, -0.596,  0.000,
      
           0.400, -0.333,  0.000,
           0.333, -0.333,  0.000,
           0.400, -0.400,  0.000,
      
           0.400, -0.400,  0.000,
           0.333, -0.400,  0.000,
           0.333, -0.333,  0.000,
    
           0.400, -0.400,  0.000,
           0.333, -0.400,  0.000,
           0.333, -0.466,  0.000,
      
          
  ];
    
    for(i = 0; i <= numVertices; i++){
        
    }
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = numVertices = 102;
   
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
      
/**
* Color I
*/
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
      
/**
* Color Shield
**/
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
        0.01, 0.01, 0.44, 1.0,
      
/**
* Color Stripes
**/
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
      
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        1.00, 0.44, 0.00, 1.0,
        
      
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 102;  
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    
  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);
        
  mat4.ortho(pMatrix,-1,1,-1,1,1,-1);
  vec3.set(transformVec,x_pos,y_pos,0.0);
  vec3.set(scaleVec,x,y,1.0)
  mat4.translate(mvMatrix, mvMatrix,transformVec);   //console.log(mat4.str(pMatrix));
  mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotAngle))
  
  mat4.scale(mvMatrix,mvMatrix,scaleVec);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

var sinscalar = 0;
function animate() { 
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;    
        rotAngle= (rotAngle+1.0) % 360;
        scaleTime = (scaleTime + 1.0) % 100
        
        if(scaleTime >= 1 && scaleTime <= 50){      
            x = (x + .01);
            y = (y + .01);
        }
        
        else{
            x = (x - .01);
            y = (y - .01);
        }
        
        if(scaleTime >= 1 && scaleTime <= 25 || scaleTime >= 75){
            x_pos = (x_pos + .01);
            y_pos = (y_pos + .01);
        }
        
        else{
            x_pos = (x_pos - .01);
            y_pos = (y_pos - .01);
        }
    }
    lastTime = timeNow;
    
/**
* Non Uniform
*/
    
    sinscalar += 0.1;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    var triangleVertices = [
      
/**
* Draw I
*/
          -0.10,  0.15,  0.0,
           0.10,  0.15,  0.0,
          -0.10, -0.15,  0.0,

          -0.10, -0.15,  0.0,
           0.10, -0.15,  0.0,
           0.10,  0.15,  0.0,
          
          -0.20, -0.15,  0.0,
          -0.20, -0.30,  0.0,
           0.20, -0.30,  0.0,
      
           0.20, -0.15,  0.0,
           0.20, -0.30,  0.0,
          -0.20, -0.15,  0.0,
      
          -0.20,  0.15,  0.0,
          -0.20,  0.30,  0.0,
           0.20,  0.30,  0.0,
      
           0.20,  0.15,  0.0,
           0.20,  0.30,  0.0,
          -0.20,  0.15,  0.0,
      
/**
* Draw Shield
*/
      
          -0.40, -0.30,  0.0,
          -0.20, -0.30,  0.0,
          -0.40,  0.30,  0.0,
      
          -0.40,  0.30,  0.0,
          -0.20,  0.30,  0.0,
          -0.20, -0.30,  0.0,
      
          -0.20, -0.15,  0.0,
          -0.10, -0.15,  0.0,
          -0.20,  0.15,  0.0,
      
          -0.20,  0.15,  0.0,
          -0.10,  0.15,  0.0,
          -0.10, -0.15,  0.0,
      
          -0.50,  0.45,  0.0,
          -0.50,  0.30,  0.0,
           0.50,  0.30,  0.0,
      
           0.50,  0.45,  0.0,
           0.50,  0.30,  0.0,
          -0.50,  0.45,  0.0,
      
           0.40,  0.30,  0.0,
           0.20,  0.30,  0.0,
           0.40, -0.30,  0.0,
      
           0.40, -0.30,  0.0,
           0.20, -0.30,  0.0,
           0.20,  0.30,  0.0,
      
           0.20,  0.15,  0.0,
           0.10,  0.15,  0.0,
           0.20, -0.15,  0.0,
      
           0.20, -0.15,  0.0,
           0.10, -0.15,  0.0,
           0.10,  0.15,  0.0,
      
/**
* Draw Stripes
**/
          
          -0.400+Math.sin(sinscalar-0.400)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
          -0.333+Math.sin(sinscalar-0.333)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
          -0.400+Math.sin(sinscalar-0.400)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
      
          -0.400+Math.sin(sinscalar-0.400)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
          -0.333+Math.sin(sinscalar-0.333)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
          -0.333+Math.sin(sinscalar-0.333)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
    
          -0.400+Math.sin(sinscalar-0.400)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
          -0.333+Math.sin(sinscalar-0.333)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
          -0.333+Math.sin(sinscalar-0.333)*0.5, -0.466+Math.cos(sinscalar)*0.05,  0.000,
      
          -0.266+Math.sin(sinscalar-0.266)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
          -0.200+Math.sin(sinscalar-0.200)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
          -0.266+Math.sin(sinscalar-0.266)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
      
          -0.266+Math.sin(sinscalar-0.266)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
          -0.200+Math.sin(sinscalar-0.200)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
          -0.200+Math.sin(sinscalar-0.200)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
    
          -0.266+Math.sin(sinscalar-0.266)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
          -0.200+Math.sin(sinscalar-0.200)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
          -0.200+Math.sin(sinscalar-0.200)*0.5, -0.596+Math.cos(sinscalar)*0.05,  0.000,
      
          -0.133+Math.sin(sinscalar-0.133)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
          -0.066+Math.sin(sinscalar-0.066)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
          -0.133+Math.sin(sinscalar-0.133)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
      
          -0.133+Math.sin(sinscalar-0.133)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
          -0.066+Math.sin(sinscalar-0.066)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
          -0.066+Math.sin(sinscalar-0.066)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
    
          -0.133+Math.sin(sinscalar-0.133)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
          -0.066+Math.sin(sinscalar-0.066)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
          -0.066+Math.sin(sinscalar-0.066)*0.5, -0.733+Math.cos(sinscalar)*0.05,  0.000,
      
           0.133+Math.sin(sinscalar+0.133)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
           0.066+Math.sin(sinscalar+0.066)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
           0.133+Math.sin(sinscalar+0.133)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
      
           0.133+Math.sin(sinscalar+0.133)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
           0.066+Math.sin(sinscalar+0.066)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
           0.066+Math.sin(sinscalar+0.066)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
    
           0.133+Math.sin(sinscalar+0.133)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
           0.066+Math.sin(sinscalar+0.066)*0.5, -0.666+Math.cos(sinscalar)*0.05,  0.000,
           0.066+Math.sin(sinscalar+0.066)*0.5, -0.733+Math.cos(sinscalar)*0.05,  0.000,
      
           0.266+Math.sin(sinscalar+0.266)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
           0.200+Math.sin(sinscalar+0.200)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
           0.266+Math.sin(sinscalar+0.266)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
      
           0.266+Math.sin(sinscalar+0.266)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
           0.200+Math.sin(sinscalar+0.200)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
           0.200+Math.sin(sinscalar+0.200)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
    
           0.266+Math.sin(sinscalar+0.266)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
           0.200+Math.sin(sinscalar+0.200)*0.5, -0.530+Math.cos(sinscalar)*0.05,  0.000,
           0.200+Math.sin(sinscalar+0.200)*0.5, -0.596+Math.cos(sinscalar)*0.05,  0.000,
      
           0.400+Math.sin(sinscalar+0.400)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
           0.333+Math.sin(sinscalar+0.333)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
           0.400+Math.sin(sinscalar+0.400)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
      
           0.400+Math.sin(sinscalar+0.400)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
           0.333+Math.sin(sinscalar+0.333)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
           0.333+Math.sin(sinscalar+0.333)*0.5, -0.333+Math.cos(sinscalar)*0.05,  0.000,
    
           0.400+Math.sin(sinscalar+0.400)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
           0.333+Math.sin(sinscalar+0.333)*0.5, -0.400+Math.cos(sinscalar)*0.05,  0.000,
           0.333+Math.sin(sinscalar+0.333)*0.5, -0.466+Math.cos(sinscalar)*0.05,  0.000,
      
          
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 102;
}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}


/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}