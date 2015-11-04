// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  // Set width and height of the canvas according to config.
  canvas.width = canvasSize.maxX;
  canvas.height = canvasSize.maxY;

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Prepare data of vertices before drawing polygons.
  var n = prepareData(canvas);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);
  
  drawPolygons(gl, canvas, polygon);
}

function prepareData(canvas) {
  var n = vertex_pos.length; // The number of vertices
  var itemsPerVertex = 6;
  // Map the canvas coordinates to WebGL coordinates and store them in the global array.
  // Transform type of vertices' colors from RGB type to [0,1] type and store them in the global array. 
  verticesColors = new Float32Array(n * itemsPerVertex);
  for (var i = 0; i < n; i++) {
    verticesColors[i*itemsPerVertex] = (vertex_pos[i][0]-canvas.width/2)/(canvas.width/2);
    verticesColors[i*itemsPerVertex + 1] = (vertex_pos[i][1]-canvas.height/2)/(canvas.height/2);
    verticesColors[i*itemsPerVertex + 3] = vertex_color[i][0] / 255;
    verticesColors[i*itemsPerVertex + 4] = vertex_color[i][1] / 255;
    verticesColors[i*itemsPerVertex + 5] = vertex_color[i][2] / 255;
  };
  return n;
}

function drawPolygons(gl, canvas) {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  // Draw all polygons.
  for (var i = 0; i < polygon.length; i++) {
    drawPolygon(gl, canvas, polygon[i]);
  };
}

function drawPolygon(gl, canvas, polygon) {
  var n = polygon.length;
  var itemsPerVertex = 6;
  var vertices_info = new Float32Array(n * itemsPerVertex);
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < itemsPerVertex; j++) {
      vertices_info[i*itemsPerVertex+j] = verticesColors[polygon[i]*itemsPerVertex+j];
    };
  };
  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices_info, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  var FSIZE = vertices_info.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * itemsPerVertex, 0);
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * itemsPerVertex, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);
  
  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}
