// Vertex shader program
var VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'uniform mat4 u_MvpMatrix;\n' +
	'attribute vec2 a_TexCoord;\n' +
	'varying vec2 v_TexCoord;\n' +
	'void main() {\n' +
	'  gl_Position = u_MvpMatrix * a_Position;\n' +
	'  v_TexCoord = a_TexCoord;\n' +
	'}\n';

// Fragment shader program
var FSHADER_SOURCE =
	'precision mediump float;\n' +
	'uniform sampler2D u_Sampler;\n' +
	'varying vec2 v_TexCoord;\n' +
	'void main() {\n' +
	'  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
	'}\n';

function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

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

	// Set the vertex information
	var n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	// Get the storage location of u_MvpMatrix
	var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
	if (!u_MvpMatrix) {
		console.log('Failed to get the storage location of u_MvpMatrix');
		return;
	}

	// Model matrix
	var modelMatrix = new Matrix4();
	// View matrix
	var viewMatrix = new Matrix4();
	// Projection matrix
	var projMatrix = new Matrix4();
	// Model view projection matrix
	var mvpMatrix = new Matrix4();

	// Calculate the view matrix and the projection matrix
	modelMatrix.setTranslate(boxRes.translate[0], boxRes.translate[1],
			boxRes.translate[2]);
	modelMatrix.scale(boxRes.scale[0], boxRes.scale[1], boxRes.scale[2]);
	viewMatrix.setLookAt(CameraPara.eye[0], CameraPara.eye[1],
			CameraPara.eye[2], CameraPara.at[0], CameraPara.at[1],
			CameraPara.at[2], CameraPara.up[0], CameraPara.up[1],
			CameraPara.up[2]);
	projMatrix.setPerspective(CameraPara.fov, canvas.width / canvas.height,
			CameraPara.near, CameraPara.far);
	// Calculate the model view projection matrix
	mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	// Pass the model view projection matrix
	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

	

	// Set texture
	if (!initTextures(gl, n)) {
		console.log('Failed to intialize the texture.');
		return;
	}
}

function initVertexBuffers(gl) {
	var verticesCoords = new Float32Array(boxRes.vertex);
	var texCoords = new Float32Array(boxRes.texCoord);
	// Indices of the vertices
	var indices = new Uint8Array(boxRes.index);
	var n = 4; // The number of vertices

	// Create the buffer object
	var vertexCoordBuffer = gl.createBuffer();
	var texCoordBuffer = gl.createBuffer();
	var indexBuffer = gl.createBuffer();
	if (!vertexCoordBuffer) {
		console.log('Failed to create vertexCoordBuffer');
		return -1;
	}
	if (!texCoordBuffer) {
		console.log('Failed to create texCoordBuffer');
		return -1;
	}
	if (!indexBuffer) {
		console.log('Failed to create indexBuffer');
		return -1;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesCoords, gl.STATIC_DRAW);

	var FSIZE = verticesCoords.BYTES_PER_ELEMENT;
	// Get the storage location of a_Position, assign and enable buffer
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 3, 0);
	gl.enableVertexAttribArray(a_Position); // Enable the assignment of the
	// buffer object

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
	// Get the storage location of a_TexCoord
	var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
	if (a_TexCoord < 0) {
		console.log('Failed to get the storage location of a_TexCoord');
		return -1;
	}
	// Assign the buffer object to a_TexCoord variable
	gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 2, 0);
	gl.enableVertexAttribArray(a_TexCoord); // Enable the assignment of the
	// buffer object

	// Write the indices to the buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	return indices.length;
}

function initTextures(gl, n) {
	var texture = gl.createTexture(); // Create a texture object
	if (!texture) {
		console.log('Failed to create the texture object');
		return false;
	}

	// Get the storage location of u_Sampler
	var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
	if (!u_Sampler) {
		console.log('Failed to get the storage location of u_Sampler');
		return false;
	}
	var image = new Image(); // Create the image object
	if (!image) {
		console.log('Failed to create the image object');
		return false;
	}
	// Register the event handler to be called on loading an image
	image.onload = function() {
		loadTexture(gl, n, texture, u_Sampler, image);
	};
	// Tell the browser to load an image
	image.src = 'image/boxface.bmp';

	return true;
}

function loadTexture(gl, n, texture, u_Sampler, image) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
	// Enable texture unit0
	gl.activeTexture(gl.TEXTURE0);
	// Bind the texture object to the target
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Set the texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	// Set the texture image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

	// Set the texture unit 0 to the sampler
	gl.uniform1i(u_Sampler, 0);

	// Set clear color and enable hidden surface removal
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}
