// Vertex shader program
var VSHADER_SOURCE = 
	'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'	gl_Position = a_Position;\n' +
	'	v_Color = a_Color;\n' +
	'}\n';

// Fragment shader program
var FSHADER_SOURCE = 
	'precision mediump float;\n' +
	'varying vec4 v_Color;\n' +
	'uniform vec4 u_FragColor;\n' +
	'uniform bool u_DrawGrid;\n' +
	'void main() {\n' +
	'	if (u_DrawGrid)\n' +
	'		gl_FragColor = u_FragColor;\n' +
	'	else\n' +
	'		gl_FragColor = v_Color;\n' +
	'}\n';

function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');
	// Set width and height of the canvas.
	canvas.width = canvasSize.maxX;
	canvas.height = canvasSize.maxY;

	// By default, polygon grids are not shown.
	showGrid = false;

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

	var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
	if (u_FragColor < 0) {
		console.log('Failed to get the storage location of u_FragColor');
		return;
	}
	// Set the color of the grids to red.
	gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
	// Prepare data of the vertices before drawing polygons.
	var n = prepareData(canvas);
	if (n < 0) {
		console.log('Failed to prepare data of the vertices');
		return;
	}

	// Specify the color for clearing <canvas>
	gl.clearColor(0, 0, 0, 1);

	// Draw the polygons.
	drawPolygons(gl, canvas);

	// Set key press handler for the <body> element.
	document.body.onkeypress = function(e) {
		// Use either which or keyCode, depending on browser support
		var keyCode = e.which || e.keyCode;
		var keyChar = String.fromCharCode(keyCode);
		switch (keyChar) {
		case 'b':
		case 'B':
			showGrid = !showGrid;
			drawPolygons(gl, canvas);
			break;
		}
	}
}

// Set the positions and colors of the vertices
function prepareData(canvas) {
	var n = vertex_pos.length; // The number of vertices
	itemsPerVertex = 6;
	// Map the canvas coordinates to WebGL coordinates and store them in the
	// global array.
	// Transform type of vertices' colors from RGB type to [0,1] type and store
	// them in the global array.
	verticesColors = new Float32Array(n * itemsPerVertex);
	for (var i = 0; i < n; i++) {
		verticesColors[i * itemsPerVertex] = (vertex_pos[i][0] - canvas.width / 2)
				/ (canvas.width / 2);
		verticesColors[i * itemsPerVertex + 1] = (canvas.height / 2 - vertex_pos[i][1])
				/ (canvas.height / 2);
		verticesColors[i * itemsPerVertex + 3] = vertex_color[i][0] / 255;
		verticesColors[i * itemsPerVertex + 4] = vertex_color[i][1] / 255;
		verticesColors[i * itemsPerVertex + 5] = vertex_color[i][2] / 255;
	}
	return n;
}

function drawPolygons(gl, canvas) {
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT);
	// Draw all polygons.
	for (var i = 0; i < polygon.length; i++) {
		drawPolygon(gl, canvas, polygon[i]);
	}
}

function drawPolygon(gl, canvas, polygonToDraw) {
	// n is the number of vertices in the polygon to draw
	var n = polygonToDraw.length;
	var polygonVerticesColors = new Float32Array(n * itemsPerVertex);
	for (var i = 0; i < n; i++) {
		for (var j = 0; j < itemsPerVertex; j++) {
			polygonVerticesColors[i * itemsPerVertex + j] = verticesColors[polygonToDraw[i]
					* itemsPerVertex + j];
		}
	}
	// Create a buffer object
	var vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	// Write date into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, polygonVerticesColors, gl.STATIC_DRAW);

	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return;
	}
	var u_DrawGrid = gl.getUniformLocation(gl.program, 'u_DrawGrid');
	if (u_DrawGrid < 0) {
		console.log('Failed to get the storage location of u_DrawGrid');
		return;
	}
	gl.uniform1i(u_DrawGrid, 0); // Pass false to u_DrawGrid.
	var FSIZE = polygonVerticesColors.BYTES_PER_ELEMENT;
	// Assign the buffer object to a_Position variable
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE
			* itemsPerVertex, 0);
	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position);
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if (a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return;
	}
	gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * itemsPerVertex,
			FSIZE * 3);
	gl.enableVertexAttribArray(a_Color);

	// Draw the polygon
	gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
	if (showGrid) {
		drawGrid(gl, canvas, polygonVerticesColors);
	}
}

function drawGrid(gl, canvas, polygonVerticesColors) {
	// Create a buffer object
	var vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	// Write date into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, polygonVerticesColors, gl.STATIC_DRAW);

	var FSIZE = polygonVerticesColors.BYTES_PER_ELEMENT;
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	var u_DrawGrid = gl.getUniformLocation(gl.program, 'u_DrawGrid');
	if (u_DrawGrid < 0) {
		console.log('Failed to get the storage location of u_DrawGrid');
		return -1;
	}
	gl.uniform1i(u_DrawGrid, 1); // Pass true to u_DrawGrid.
	// Assign the buffer object to a_Position variable
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position);

	// Draw the grid.
	gl.drawArrays(gl.LINE_LOOP, 0, 4);

	// Assign the buffer object to a_Position variable
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 12, 0);
	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position);

	// Draw the grid.
	gl.drawArrays(gl.LINES, 0, 2);
}
