var textureArticleList = [];
var boxTexure = {texture: -1, isTextureImageReady: 0};
var floorTexure = {texture: -1, isTextureImageReady: 0};
var texureProgram;

// Texture vertex shader program, which is used to draw the big box and the ground.
var TEXTURE_VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'uniform mat4 u_MvpMatrix;\n' +
	'attribute vec2 a_TexCoord;\n' +
	'varying vec2 v_TexCoord;\n' +
	'void main() {\n' +
	'  gl_Position = u_MvpMatrix * a_Position;\n' +
	'  v_TexCoord = a_TexCoord;\n' +
	'}\n';

// Texture fragment shader program, which is used to draw the big box and the ground.
var TEXTURE_FSHADER_SOURCE =
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
	texureProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE,
			TEXTURE_FSHADER_SOURCE);
	// if (!solidProgram || !texureProgram) {
	if (!texureProgram) {
		console.log('Failed to intialize shaders.');
		return;
	}

	// Get storage locations of attribute and uniform variables in program
	// object for texture drawing
	texureProgram.a_Position = gl
			.getAttribLocation(texureProgram, 'a_Position');
	texureProgram.u_MvpMatrix = gl.getUniformLocation(texureProgram,
			'u_MvpMatrix');
	texureProgram.a_TexCoord = gl
			.getAttribLocation(texureProgram, 'a_TexCoord');
	texureProgram.u_Sampler = gl.getUniformLocation(texureProgram, 'u_Sampler');

	if (texureProgram.a_Position < 0 || texureProgram.a_TexCoord < 0
			|| !texureProgram.u_MvpMatrix || !texureProgram.u_Sampler) {
		console
				.log('Failed to get the storage location of attribute or uniform variable');
		return;
	}

	// Set texture
	if (!initTextures(gl, boxTexure, boxRes.texImagePath, texureProgram)) {
		console.log('Failed to intialize the box texture.');
		return;
	}
	if (!initTextures(gl, floorTexure, floorRes.texImagePath, texureProgram)) {
		console.log('Failed to intialize the floor texture.');
		return;
	}

	var obj = initVertexBuffersForTexObj(gl, boxRes);
	obj.texObj = boxTexure;
	obj.translate = boxRes.translate;
	obj.scale = boxRes.scale;
	textureArticleList.push(obj);

	obj = initVertexBuffersForTexObj(gl, floorRes);
	obj.texObj = floorTexure;
	obj.translate = floorRes.translate;
	obj.scale = floorRes.scale;
	textureArticleList.push(obj);

	// Model matrix
	modelMatrix = new Matrix4();
	// View matrix
	viewMatrix = new Matrix4();
	// Projection matrix
	projMatrix = new Matrix4();
	// Model view projection matrix
	mvpMatrix = new Matrix4();

	// Calculate the view matrix and the projection matrix
	viewMatrix.setLookAt(CameraPara.eye[0], CameraPara.eye[1],
			CameraPara.eye[2], CameraPara.at[0], CameraPara.at[1],
			CameraPara.at[2], CameraPara.up[0], CameraPara.up[1],
			CameraPara.up[2]);
	projMatrix.setPerspective(CameraPara.fov, canvas.width / canvas.height,
			CameraPara.near, CameraPara.far);
	var tick = function() {
		drawEverything(gl);
		anime = requestAnimationFrame(tick, canvas);
	};
	tick();
}

function initVertexBuffersForTexObj(gl, res) {
	var verticesCoords = new Float32Array(res.vertex);
	var texCoords = new Float32Array(res.texCoord);
	// Indices of the vertices
	var indices = new Uint8Array(res.index);

	var o = new Object();
	o.vertexBuffer = initArrayBufferForLaterUse(gl, verticesCoords, 3, gl.FLOAT);
	o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
	o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices,
			gl.UNSIGNED_BYTE);
	// The number of vertices
	o.numIndices = indices.length;
	if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer)
		return null;
	return o;
}

function initTextures(gl, tex, imagePath, program) {
	// Create a texture object
	tex.texture = gl.createTexture();
	if (!tex.texture) {
		console.log('Failed to create the texture object');
		return false;
	}
	var image = new Image(); // Create the image object
	if (!image) {
		console.log('Failed to create the image object');
		return false;
	}
	// Register the event handler to be called on loading an image
	image.onload = function() {
		loadTexture(gl, tex, program.u_Sampler, image);
	};
	// Tell the browser to load an image
	image.src = imagePath;
	return true;
}

function loadTexture(gl, tex, u_Sampler, image) {
	// Flip the image's y axis
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	// Enable texture unit0
	gl.activeTexture(gl.TEXTURE0);
	// Bind the texture object to the target
	gl.bindTexture(gl.TEXTURE_2D, tex.texture);
	// Set the texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	// Set the texture image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	// Set the texture unit 0 to the sampler
	gl.uniform1i(u_Sampler, 0);

	tex.isTextureImageReady = 1;
}

function drawEverything(gl) {
	gl.useProgram(texureProgram);
	// Set clear color and enable hidden surface removal
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for (var i = 0; i < textureArticleList.length; i++) {
		var textureArticle = textureArticleList[i];
		modelMatrix.setTranslate(textureArticle.translate[0], textureArticle.translate[1],
				textureArticle.translate[2]);
		modelMatrix.scale(textureArticle.scale[0], textureArticle.scale[1], textureArticle.scale[2]);
		// Calculate the model view projection matrix
		mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
		gl.uniformMatrix4fv(texureProgram.u_MvpMatrix, false,
				mvpMatrix.elements);

		initAttributeVariable(gl, texureProgram.a_Position, textureArticle.vertexBuffer);
		initAttributeVariable(gl, texureProgram.a_TexCoord, textureArticle.texCoordBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, textureArticle.indexBuffer);
		if (textureArticle.texObj.isTextureImageReady) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, textureArticle.texObj.texture);
			gl.uniform1i(texureProgram.u_Sampler, 0);
			gl.drawElements(gl.TRIANGLES, textureArticle.numIndices,
					textureArticle.indexBuffer.type, 0);
		}
	}
}

function initArrayBufferForLaterUse(gl, data, num, type) {
	var buffer = gl.createBuffer(); // Create a buffer object
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return null;
	}
	// Write date into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

	// Keep the information necessary to assign to the attribute variable later
	buffer.num = num;
	buffer.type = type;

	return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
	// Create a buffer object
	var buffer = gl.createBuffer();
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return null;
	}
	// Write date into the buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

	buffer.type = type;

	return buffer;
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
	gl.enableVertexAttribArray(a_attribute);
}