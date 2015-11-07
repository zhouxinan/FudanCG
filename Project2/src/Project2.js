// Vertex shader program
var VSHADER_SOURCE = 
	'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
	'varying vec4 v_Color;\n' +
	'uniform mat4 u_ModelMatrix;\n' +
	'void main() {\n' +
	'	gl_Position = u_ModelMatrix * a_Position;\n' +
	'	v_Color = a_Color;\n' +
	'}\n';

// Fragment shader program
var FSHADER_SOURCE = 
	'precision mediump float;\n' +
	'varying vec4 v_Color;\n' +
	'uniform vec4 u_GridColor;\n' +
	'uniform bool u_isToDrawGrid;\n' +
	'void main() {\n' +
	'	if (u_isToDrawGrid)\n' +
	'		gl_FragColor = u_GridColor;\n' +
	'	else\n' +
	'		gl_FragColor = v_Color;\n' +
	'}\n';

function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');
	// Set width and height of the canvas.
	canvas.width = canvasSize.maxX;
	canvas.height = canvasSize.maxY;

	// By default, polygon grids are not visible.
	isGridVisible = false;
	// By default, edit mode is on.
	isEditModeOn = true;
	// By default, show mode is off.
	isShowModeOn = false;
	// By default, the polygons are to grow smaller.
	isPolygonToGrowLarger = false;
	// When the mouse is pressed within a vertex's radius, the vertex is the
	// active vertex.
	RADIUS = 10;
	// The index of the active vertex.
	activeVertex = -1;
	// By default, the index of the active polygon is 0.
	activePolygon = 0;
	// Rotation angle (degrees/second)
	ANGLE_STEP = 45.0;
	// Scale step per second.
	SCALE_STEP = 0.2;
	// Current rotation angle
	currentAngle = 0.0;
	// Current scale
	currentScale = 1.0;
	// Model matrix
	modelMatrix = new Matrix4();

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

	// Get storage location of u_GridColor
	var u_GridColor = gl.getUniformLocation(gl.program, 'u_GridColor');
	if (u_GridColor < 0) {
		console.log('Failed to get the storage location of u_GridColor');
		return;
	}
	// Set the color of the grids to red.
	gl.uniform4f(u_GridColor, 1.0, 0.0, 0.0, 1.0);

	// Get storage location of u_ModelMatrix
	u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	if (!u_ModelMatrix) {
		console.log('Failed to get the storage location of u_ModelMatrix');
		return;
	}

	// Prepare the vertices' data before drawing polygons.
	var n = prepareData(canvas);
	if (n <= 0) {
		console.log('Failed to prepare the vertices\' data');
		return;
	}

	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Draw the shape.
	draw(gl, canvas);

	// The animation function used in show mode.
	var tick = function() {
		if (isShowModeOn) {
			animate(currentAngle); // Update the rotation angle and the scale
			draw(gl, canvas); // Draw the shape.
			requestAnimationFrame(tick, canvas); // Request that the browser
													// calls tick
		}
	}

	// Register the event handler to be called on mouse down
	canvas.onmousedown = function(e) {
		var rect = e.target.getBoundingClientRect();
		x = e.clientX - rect.left;
		y = e.clientY - rect.top;
		activeVertex = getVertexByMouseCoordinate(x, y);
		if (activeVertex >= 0) {
			activePolygon = getActivePolygonByActiveVertex();
		}
	}

	// Register the event handler to be called on mouse up
	canvas.onmouseup = function() {
		activeVertex = -1;
	}

	// Register the event handler to be called on mouse move
	canvas.onmousemove = function(e) {
		if ((activeVertex >= 0) && isEditModeOn) {
			var rect = e.target.getBoundingClientRect();
			x = e.clientX - rect.left;
			y = e.clientY - rect.top;
			// Update active vertex's coordinate
			vertex_pos[activeVertex][0] = x;
			vertex_pos[activeVertex][1] = y;
			var webglCoordinate = mapCoordinate(canvas, x, y);
			verticesColors[activeVertex * itemsPerVertex] = webglCoordinate.webglX;
			verticesColors[activeVertex * itemsPerVertex + 1] = webglCoordinate.webglY;
			draw(gl, canvas);
		}
	}

	// Register the event handler to be called on key press
	document.onkeydown = function(e) {
		// Use either which or keyCode, depending on browser support
		var keyCode = e.which || e.keyCode;
		var keyChar = String.fromCharCode(keyCode);
		switch (keyChar) {
		// If 'b' or 'B' is pressed, change the visibility of the grids.
		case 'b':
		case 'B':
			isGridVisible = !isGridVisible;
			draw(gl, canvas);
			break;
		// If 't' or 'T' is pressed, stop edit mode.
		// By default, isShowModeOn is off. So the first time 't' or 'T' is
		// pressed, tick() will be invoked.
		// The next time 't' or 'T' is pressed, isShowModeOn will be off again.
		// So tick() will automatically stop, since requestAnimationFrame is not
		// invoked any more.
		case 't':
		case 'T':
			isShowModeOn = !isShowModeOn;
			isEditModeOn = false;
			if (isShowModeOn) {
				g_last = Date.now();
				tick();
			}
			break;
		// If 'e' or 'E' is pressed, stop show mode and start edit mode.
		case 'e':
		case 'E':
			isShowModeOn = false;
			isEditModeOn = true;
			draw(gl, canvas);
			break;
		}
	}
}

// Load the positions and colors of the vertices into verticesColors global
// array.
function prepareData(canvas) {
	var n = vertex_pos.length; // The number of vertices
	itemsPerVertex = 6;
	// Map the canvas coordinates to WebGL coordinates and store them in the
	// global array.
	// Transform type of vertices' colors from RGB type to [0,1] type and store
	// them in the global array.
	verticesColors = new Float32Array(n * itemsPerVertex);
	for (var i = 0; i < n; i++) {
		var webglCoordinate = mapCoordinate(canvas, vertex_pos[i][0],
				vertex_pos[i][1]);
		verticesColors[i * itemsPerVertex] = webglCoordinate.webglX;
		verticesColors[i * itemsPerVertex + 1] = webglCoordinate.webglY;
		verticesColors[i * itemsPerVertex + 3] = vertex_color[i][0] / 255;
		verticesColors[i * itemsPerVertex + 4] = vertex_color[i][1] / 255;
		verticesColors[i * itemsPerVertex + 5] = vertex_color[i][2] / 255;
	}
	return n;
}

// This function is to draw the polygons and the grids.
function draw(gl, canvas) {
	// Set the rotation matrix.
	// If edit mode is on, set the rotation matrix as an identity matrix.
	// If edit mode is off, compute the rotation matrix using currentAngle and
	// currentScale.
	if (isEditModeOn) {
		modelMatrix.setIdentity();
	} else {
		modelMatrix.setRotate(currentAngle, 0, 0, 1);
		modelMatrix.scale(currentScale, currentScale, currentScale);
	}
	// Pass the rotation matrix to the vertex shader
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Draw all polygons.
	for (var i = 0; i < polygon.length; i++) {
		drawPolygon(gl, canvas, polygon[i]);
	}
	// Draw the active polygon again to make it at the top.
	drawPolygon(gl, canvas, polygon[activePolygon]);

	// Draw the grids.
	if (isGridVisible) {
		for (var i = 0; i < polygon.length; i++) {
			drawGrid(gl, canvas, polygon[i]);
		}
	}
}

// This function is to draw a polygon.
function drawPolygon(gl, canvas, polygonToDraw) {
	// n is the number of vertices in the polygon which is to be drawn
	var n = polygonToDraw.length;
	// Prepare data for the buffer object
	var polygonVerticesColors = new Float32Array(n * itemsPerVertex);
	for (var i = 0; i < n; i++) {
		for (var j = 0; j < itemsPerVertex; j++) {
			polygonVerticesColors[i * itemsPerVertex + j] = verticesColors[polygonToDraw[i]
					* itemsPerVertex + j];
		}
	}

	// Set u_isToDrawGrid in the shader to 0;
	setIsToDrawGrid(gl, false);

	// Create a buffer object
	var vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log('Failed to create the buffer object');
		return;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	// Write data into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, polygonVerticesColors, gl.STATIC_DRAW);

	var FSIZE = polygonVerticesColors.BYTES_PER_ELEMENT;

	// Get storage location of a_Position
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return;
	}

	// Assign the buffer object to a_Position variable
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE
			* itemsPerVertex, 0);
	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position);

	// Get storage location of a_Color
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if (a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return;
	}
	// Assign the buffer object to a_Color variable
	gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * itemsPerVertex,
			FSIZE * 3);
	// Enable the assignment to a_Color variable
	gl.enableVertexAttribArray(a_Color);

	// Draw the polygon
	gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}

// This function is to draw a polygon's grid.
function drawGrid(gl, canvas, polygonToDraw) {
	// n is the number of vertices in the polygon which is to be drawn
	var n = polygonToDraw.length;
	// Prepare data for the buffer object
	var polygonVertices = new Float32Array(n * 3);
	for (var i = 0; i < n; i++) {
		for (var j = 0; j < 3; j++) {
			polygonVertices[i * 3 + j] = verticesColors[polygonToDraw[i]
					* itemsPerVertex + j];
		}
	}

	// Set u_isToDrawGrid in the shader to 1;
	setIsToDrawGrid(gl, true);

	// Create a buffer object
	var vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log('Failed to create the buffer object');
		return;
	}
	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	// Write data into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, polygonVertices, gl.STATIC_DRAW);

	var FSIZE = polygonVertices.BYTES_PER_ELEMENT;

	// Get storage location of a_Position
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return;
	}
	// Assign the buffer object to a_Position variable
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 3, 0);
	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position);

	// Draw the border of the polygon.
	gl.drawArrays(gl.LINE_LOOP, 0, 4);

	// Assign the buffer object to a_Position variable
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position);

	// Draw the diagonal line of the polygon.
	gl.drawArrays(gl.LINES, 0, 2);
}

// This function is to get the index of the active vertex using canvas
// coordinates of the mouse.
function getVertexByMouseCoordinate(x, y) {
	for (var i = 0; i < vertex_pos.length; i++) {
		if (Math.abs(x - vertex_pos[i][0]) < RADIUS
				&& Math.abs(y - vertex_pos[i][1]) < RADIUS) {
			return i;
		}
	}
	// If no vertex is found, return -1 as an error value.
	return -1;
}

// This function is to get the index of the active polygon using the index of
// the active vertex.
function getActivePolygonByActiveVertex() {
	for (var i = 0; i < polygon.length; i++) {
		// The first polygon that contains the active vertex is the active
		// polygon.
		if (polygon[i].indexOf(activeVertex) > -1) {
			return i;
		}
	}
	// If no active polygon is found, return -1 as an error value.
	return -1;
}

// This function is to update currentAngle and currentScale using the elapsed
// time.
function animate(angle) {
	// Calculate the elapsed time
	var now = Date.now();
	var elapsed = now - g_last;
	g_last = now;
	// Update the current rotation angle (adjusted by the elapsed time)
	currentAngle += (ANGLE_STEP * elapsed) / 1000.0;
	currentAngle %= 360;
	// Update the current scale (adjusted by the elapsed time)
	// isPolygonToGrowLarger is necessary here because the difference between
	// new value and old value of currentScale may be so small that comparisons
	// between floating numbers can be inaccurate.
	if (isPolygonToGrowLarger) {
		currentScale += (SCALE_STEP * elapsed) / 1000.0;
	} else {
		currentScale -= (SCALE_STEP * elapsed) / 1000.0;
	}
	if (currentScale >= 1.0)
		isPolygonToGrowLarger = false;
	else if (currentScale <= 0.2)
		isPolygonToGrowLarger = true;
}

// This function is to map the canvas coordinates to WebGL coordinates.
function mapCoordinate(canvas, canvasX, canvasY) {
	var webglX = (canvasX - canvas.width / 2) / (canvas.width / 2);
	var webglY = (canvas.height / 2 - canvasY) / (canvas.height / 2);
	return {
		"webglX" : webglX,
		"webglY" : webglY
	};
}

function setIsToDrawGrid(gl, isToDrawGrid) {
	// Get storage location of u_isToDrawGrid
	var u_isToDrawGrid = gl.getUniformLocation(gl.program, 'u_isToDrawGrid');
	if (u_isToDrawGrid < 0) {
		console.log('Failed to get the storage location of u_isToDrawGrid');
		return;
	}
	// Set u_isToDrawGrid using isToDrawGrid.
	if (isToDrawGrid) {
		gl.uniform1i(u_isToDrawGrid, 1);
	} else {
		gl.uniform1i(u_isToDrawGrid, 0);
	}
}