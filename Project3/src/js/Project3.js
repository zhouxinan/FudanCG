// This array is to store texture articles (the floor and the box).
var textureArticleList = [];
// This is the texture object of the box with isTextureImageReady property.
var boxTexture = {texture: -1, isTextureImageReady: 0};
// This is the texture object of the floor with isTextureImageReady property.
var floorTexture = {texture: -1, isTextureImageReady: 0};
// Two shader programs used in this project.
var textureProgram;
var solidProgram;
// currentTime is to store the current time. 
var currentTime = Date.now();
// These three parameters are used in the camera setting.
var eye = new Vector3(CameraPara.eye);
var at = new Vector3(CameraPara.at);
var up = new Vector3(CameraPara.up).normalize();
// Eye direction and right-hand direction.
var eyeDirection = VectorMinus(at, eye).normalize();
var rightDirection = VectorCross(eyeDirection, up).normalize();

var currentAngle = 0.0;

// The keycode map is to map javascript keycodes to motions.
var keycodeMap = {
	'87': 'forward',
	'83': 'back',
	'65': 'left',
	'68': 'right',
	'73': 'up',
	'75': 'down',
	'74': 'leftRot',
	'76': 'rightRot',
	'70': 'flashlight'
};

// keypressStatus is to store key press status. 0 for a released key and 1 for a pressed key.
var keypressStatus = {
	forward: 0,
	back: 0,
	left: 0,
	right: 0,
	up: 0,
	down: 0,
	leftRot: 0,
	rightRot: 0,
	flashlight: 0,
};

// When a key is pressed, set its status to 1.
document.onkeydown = function(e) {
	// Use either which or keyCode, depending on browser support
	var keyCode = e.which || e.keyCode;
	keypressStatus[keycodeMap[keyCode]] = 1;
}

// When a key is released, set its status to 0.
document.onkeyup = function(e) {
	// Use either which or keyCode, depending on browser support
	var keyCode = e.which || e.keyCode;
	keypressStatus[keycodeMap[keyCode]] = 0;
}

// Texture vertex shader program, which is used to draw the box and the ground.
var TEXTURE_VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'uniform mat4 u_MvpMatrix;\n' +
	'attribute vec2 a_TexCoord;\n' +
	'varying vec2 v_TexCoord;\n' +
	'void main() {\n' +
	'  gl_Position = u_MvpMatrix * a_Position;\n' +
	'  v_TexCoord = a_TexCoord;\n' +
	'}\n';

// Texture fragment shader program, which is used to draw the box and the ground.
var TEXTURE_FSHADER_SOURCE =
	'precision mediump float;\n' +
	'uniform sampler2D u_Sampler;\n' +
	'varying vec2 v_TexCoord;\n' +
	'void main() {\n' +
	'  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
	'}\n';

// Solid vertex shader program, which is used to draw other articles from the .obj files.
var SOLID_VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
	'attribute vec4 a_Normal;\n' +
	'uniform mat4 u_MvpMatrix;\n' +
	'uniform mat4 u_NormalMatrix;\n' +			// Transformation matrix of the normal
	'uniform vec3 u_AmbientLight;\n' +			// Ambient light color
	'uniform vec3 u_DirectionLight;\n' +		// Directional light color
	'uniform mat4 u_ModelMatrix;\n' +			// Model matrix
	'uniform vec3 u_PointLightColor;\n' +		// Point light color
	'uniform vec3 u_PointLightPosition;\n' +	// Position of the point light source (in the world coordinate system)
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_Position = u_MvpMatrix * a_Position;\n' +
	'  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
	'  float nDotL = max(dot(normal, u_DirectionLight), 0.0);\n' +
	'  vec3 diffuse = a_Color.rgb * nDotL;\n' +
	'  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
	'  vec3 lightDirection = normalize(u_PointLightPosition-vec3(vertexPosition));\n' +
	'  float nDotL2 = max(dot(normal, lightDirection), 0.0);\n' +
	'  vec3 diffuse2 = u_PointLightColor * a_Color.rgb * nDotL2;\n' +
	'  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
	'  v_Color = vec4(ambient+diffuse+diffuse2 , a_Color.a);\n' +
	'}\n';

// Solid fragment shader program, which is used to draw other articles from the .obj files.
var SOLID_FSHADER_SOURCE =
	'precision mediump float;\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_FragColor = v_Color;\n' +
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
	textureProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE,
			TEXTURE_FSHADER_SOURCE);
	solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
	if (!solidProgram || !textureProgram) {
		console.log('Failed to intialize shaders.');
		return;
	}

	solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
	solidProgram.a_Color = gl.getAttribLocation(solidProgram, 'a_Color');
	solidProgram.a_Normal = gl.getAttribLocation(solidProgram, 'a_Normal');
	solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram,
			'u_MvpMatrix');
	solidProgram.u_NormalMatrix = gl.getUniformLocation(solidProgram,
			'u_NormalMatrix');
	solidProgram.u_AmbientLight = gl.getUniformLocation(solidProgram,
			'u_AmbientLight');
	solidProgram.u_DirectionLight = gl.getUniformLocation(solidProgram,
			'u_DirectionLight');
	solidProgram.u_ModelMatrix = gl.getUniformLocation(solidProgram,
			'u_ModelMatrix');
	solidProgram.u_PointLightColor = gl.getUniformLocation(solidProgram,
			'u_PointLightColor');
	solidProgram.u_PointLightPosition = gl.getUniformLocation(solidProgram,
			'u_PointLightPosition');

	// Get storage locations of attribute and uniform variables in program
	// object for texture drawing
	textureProgram.a_Position = gl.getAttribLocation(textureProgram,
			'a_Position');
	textureProgram.u_MvpMatrix = gl.getUniformLocation(textureProgram,
			'u_MvpMatrix');
	textureProgram.a_TexCoord = gl.getAttribLocation(textureProgram,
			'a_TexCoord');
	textureProgram.u_Sampler = gl.getUniformLocation(textureProgram,
			'u_Sampler');

	if (textureProgram.a_Position < 0 || textureProgram.a_TexCoord < 0
			|| !textureProgram.u_MvpMatrix || !textureProgram.u_Sampler
			|| solidProgram.a_Position < 0 || solidProgram.a_Color < 0
			|| solidProgram.a_Normal < 0 || !solidProgram.u_MvpMatrix
			|| !solidProgram.u_NormalMatrix || !solidProgram.u_AmbientLight
			|| !solidProgram.u_DirectionLight || !solidProgram.u_ModelMatrix
			|| !solidProgram.u_PointLightColor
			|| !solidProgram.u_PointLightPosition) {
		console
				.log('Failed to get the storage location of attribute or uniform variable');
		return;
	}

	// Set texture
	if (!initTextures(gl, boxTexture, boxRes.texImagePath, textureProgram)) {
		console.log('Failed to intialize the box texture.');
		return;
	}
	if (!initTextures(gl, floorTexture, floorRes.texImagePath, textureProgram)) {
		console.log('Failed to intialize the floor texture.');
		return;
	}

	var obj = initVertexBuffersForTexObj(gl, boxRes);
	obj.texObj = boxTexture;
	obj.translate = boxRes.translate;
	obj.scale = boxRes.scale;
	textureArticleList.push(obj);

	obj = initVertexBuffersForTexObj(gl, floorRes);
	obj.texObj = floorTexture;
	obj.translate = floorRes.translate;
	obj.scale = floorRes.scale;
	textureArticleList.push(obj);

	for (var i = 0; i < ObjectList.length; i++) {
		ObjectList[i].model = initVertexBuffers(gl, solidProgram);
		if (!ObjectList[i].model) {
			console.log('Failed to set the vertex information');
			return;
		}
		readOBJFile(ObjectList[i].objFilePath, gl, ObjectList[i], 1.0, true);
	}

	// Model matrix
	modelMatrix = new Matrix4();
	// View matrix
	viewMatrix = new Matrix4();
	// Projection matrix
	projMatrix = new Matrix4();
	// Model view projection matrix
	mvpMatrix = new Matrix4();
	// Normal matrix
	normalMatrix = new Matrix4();
	// View projection matrix
	viewProjMatrix = new Matrix4();

	var tick = function() {
		drawEverything(gl, canvas);
		anime = requestAnimationFrame(tick, canvas);
	};
	tick();
}

function drawEverything(gl, canvas) {
	gl.useProgram(textureProgram);
	// Set clear color and enable hidden surface removal
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var deltaTime = getElapsedTime();
	calculateCameraParameters((MOVE_VELOCITY * deltaTime) / 1000.0,
			(ROT_VELOCITY * deltaTime) / 1000.0);
	// Calculate the view matrix and the projection matrix
	viewMatrix.setLookAt(eye.elements[0], eye.elements[1], eye.elements[2],
			at.elements[0], at.elements[1], at.elements[2], up.elements[0],
			up.elements[1], up.elements[2]);
	projMatrix.setPerspective(CameraPara.fov, canvas.width / canvas.height,
			CameraPara.near, CameraPara.far);
	// Calculate viewProjMatrix to improve efficiency.
	viewProjMatrix.set(projMatrix).multiply(viewMatrix);
	for (var i = 0; i < textureArticleList.length; i++) {
		var textureArticle = textureArticleList[i];
		modelMatrix.setTranslate(textureArticle.translate[0],
				textureArticle.translate[1], textureArticle.translate[2]);
		modelMatrix.scale(textureArticle.scale[0], textureArticle.scale[1],
				textureArticle.scale[2]);
		// Calculate the model view projection matrix
		mvpMatrix.set(viewProjMatrix).multiply(modelMatrix);
		gl.uniformMatrix4fv(textureProgram.u_MvpMatrix, false,
				mvpMatrix.elements);
		initAttributeVariable(gl, textureProgram.a_Position,
				textureArticle.vertexBuffer);
		initAttributeVariable(gl, textureProgram.a_TexCoord,
				textureArticle.texCoordBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, textureArticle.indexBuffer);
		if (textureArticle.texObj.isTextureImageReady) {
			gl.bindTexture(gl.TEXTURE_2D, textureArticle.texObj.texture);
			// Set the texture unit 0 to the sampler
			gl.uniform1i(textureProgram.u_Sampler, 0);
			gl.drawElements(gl.TRIANGLES, textureArticle.numIndices,
					textureArticle.indexBuffer.type, 0);
		}
	}

	// Switch shader program.
	gl.useProgram(solidProgram);
	// Set ambient light color.
	gl.uniform3f(solidProgram.u_AmbientLight, sceneAmbientLight[0],
			sceneAmbientLight[1], sceneAmbientLight[2]);
	// Set directional light color.
	gl.uniform3f(solidProgram.u_DirectionLight, sceneDirectionLight[0],
			sceneDirectionLight[1], sceneDirectionLight[2]);
	// Set point light position.
	gl.uniform3f(solidProgram.u_PointLightPosition, eye.elements[0],
			eye.elements[1], eye.elements[2]);
	// If 'F' is pressed, set scenePointLightColor to u_PointLightColor. Otherwise, set black color to u_PointLightColor.
	if (keypressStatus.flashlight) {
		gl.uniform3f(solidProgram.u_PointLightColor, scenePointLightColor[0],
				scenePointLightColor[1], scenePointLightColor[2]);
	} else {
		gl.uniform3f(solidProgram.u_PointLightColor, 0.0, 0.0, 0.0);
	}
	for (var i = 0; i < ObjectList.length; i++) {
		var solidArticle = ObjectList[i];
		if (solidArticle.objDoc != null && solidArticle.objDoc.isMTLComplete()) {
			solidArticle.drawingInfo = onReadComplete(gl, solidArticle.model, solidArticle.objDoc);
			solidArticle.objname = solidArticle.objDoc.objects[0].name;
			solidArticle.objDoc = null;
		}
		if (solidArticle.drawingInfo) {
			modelMatrix.setIdentity();
				for (var j = 0; j < solidArticle.transform.length; j++) {
					var trans = solidArticle.transform[j];
					if (trans.type === "translate") {
						if (solidArticle.objname === "bird") {
							currentAngle = (currentAngle + (90.0 * deltaTime) / 1000.0) % 360.0;
							var angle = currentAngle * Math.PI / 180.0;
							modelMatrix.translate(10.0 * Math.sin(angle), 5.0 + 1.5 * Math.sin(angle * 2), 10.0 * Math.cos(angle));
							modelMatrix.rotate(currentAngle, 0.0, 1.0, 0.0);
						} else {
							modelMatrix.translate(trans.content[0],
							trans.content[1], trans.content[2]);
						}
					} else if (trans.type === "rotate") {
						modelMatrix.rotate(trans.content[0], trans.content[1],
								trans.content[2], trans.content[3]);
					} else if (trans.type === "scale") {
						modelMatrix.scale(trans.content[0], trans.content[1],
								trans.content[2]);
					}
				}
			gl.uniformMatrix4fv(solidProgram.u_ModelMatrix, false,
					modelMatrix.elements);
			mvpMatrix.set(viewProjMatrix).multiply(modelMatrix);

			gl.uniformMatrix4fv(solidProgram.u_MvpMatrix, false,
					mvpMatrix.elements);

			normalMatrix.setInverseOf(modelMatrix);
			normalMatrix.transpose();
			gl.uniformMatrix4fv(solidProgram.u_NormalMatrix, false,
					normalMatrix.elements);
			initAttributeVariable(gl, solidProgram.a_Position,
					solidArticle.model.vertexBuffer);
			initAttributeVariable(gl, solidProgram.a_Normal,
					solidArticle.model.normalBuffer);
			// Set article color.
			gl.vertexAttrib3f(solidProgram.a_Color, solidArticle.color[0],
			solidArticle.color[1], solidArticle.color[2]);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, solidArticle.model.indexBuffer);
			gl.drawElements(gl.TRIANGLES, solidArticle.drawingInfo.indices.length,
					gl.UNSIGNED_SHORT, 0);
		}
	}
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
	// Create the image object
	var image = new Image();
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
	// Set the isTextureImageReady to true
	tex.isTextureImageReady = 1;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
	var buffer = gl.createBuffer(); // Create a buffer object
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return null;
	}
	// Write data into the buffer object
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
	// Write data into the buffer object
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

function getElapsedTime() {
	var newTime = Date.now();
	var elapsedTime = newTime - currentTime;
	currentTime = newTime;
	return elapsedTime;
}

function calculateCameraParameters(move, rotate) {
	var angle = rotate * Math.PI / 180.0;
	if (keypressStatus.forward || keypressStatus.back) {
		var deltaVector = keypressStatus.forward ? eyeDirection
				: VectorReverse(eyeDirection);
		deltaVector = VectorMultNum(deltaVector, move);
		at = VectorAdd(at, deltaVector);
		eye = VectorAdd(eye, deltaVector);
	}
	if (keypressStatus.left || keypressStatus.right) {
		var deltaVector = keypressStatus.right ? rightDirection
				: VectorReverse(rightDirection);
		deltaVector = VectorMultNum(deltaVector, move);
		at = VectorAdd(at, deltaVector);
		eye = VectorAdd(eye, deltaVector);
	}
	if (keypressStatus.leftRot || keypressStatus.rightRot) {
		var deltaVector = keypressStatus.rightRot ? rightDirection
				: VectorReverse(rightDirection);
		deltaVector = VectorMultNum(deltaVector, Math.tan(angle));
		eyeDirection = VectorAdd(eyeDirection, deltaVector);
		eyeDirection.normalize();
		at = VectorAdd(eye, eyeDirection);
		rightDirection = VectorCross(eyeDirection, up).normalize();
	}
	if (keypressStatus.up || keypressStatus.down) {
		var deltaVector = keypressStatus.up ? up : VectorReverse(up);
		deltaVector = VectorMultNum(deltaVector, Math.tan(angle));
		eyeDirection = VectorAdd(eyeDirection, deltaVector);
		eyeDirection.normalize();
		at = VectorAdd(eye, eyeDirection);
		up = VectorCross(rightDirection, eyeDirection);
		up.normalize();
	}
}

// Create an buffer object and perform an initial configuration
function initVertexBuffers(gl, program) {
	// Utilize Object object to return multiple buffer
	var o = new Object();
	// objects
	o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
	o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
	o.indexBuffer = gl.createBuffer();
	if (!o.vertexBuffer || !o.normalBuffer || !o.indexBuffer) {
		return null;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return o;
}

// Create a buffer object, assign it to attribute variables, and enable the
// assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
	// Create a buffer object
	var buffer = gl.createBuffer();
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return null;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	// Assign the buffer object to the attribute variable
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	// Enable the assignment
	gl.enableVertexAttribArray(a_attribute); 
	buffer.num = num;
	buffer.type = gl.FLOAT;

	return buffer;
}

// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
	var request = new XMLHttpRequest();

	request.onreadystatechange = function() {
		if (request.readyState === 4 && request.status !== 404) {
			onReadOBJFile(request.responseText, fileName, gl, model, scale,
					reverse);
		}
	}
	// Create a request to acquire the file.
	request.open('GET', fileName, true); 
	request.send(); // Send the request
}

// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
	// Create a OBJDoc object
	var objDoc = new OBJDoc(fileName);
	// Parse the file
	var result = objDoc.parse(fileString, scale, reverse);
	if (!result) {
		o.objDoc = null;
		o.drawingInfo = null;
		console.log("OBJ file parsing error.");
		return;
	}
	o.objDoc = objDoc;
}

// OBJ File has been read compreatly
function onReadComplete(gl, model, objDoc) {
	// Acquire the vertex coordinates from OBJ file
	var drawingInfo = objDoc.getDrawingInfo();

	// Write data into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

	// Write the indices to the buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

	return drawingInfo;
}