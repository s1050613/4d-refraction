const selectEl = document.querySelector.bind(document);
const selectEls = document.querySelectorAll.bind(document);

const {floor, min, max, hypot: LENGTH} = Math;

var SCENE_SIZE = +localStorage.getItem("scene_size") || 64;

var gl;

var pixelData;

var camera = [+localStorage.getItem("x") || -0.5, +localStorage.getItem("y")||  0.5, +localStorage.getItem("z")||  -1.5];
console.log(camera)
var rayOrigin = [+localStorage.getItem("x2") || 0, +localStorage.getItem("y2") || 0, +localStorage.getItem("z2") || 0, +localStorage.getItem("w2") || -2];

window.onload = () => {
	var vertCode = selectEl("#vertShader").innerText;
	var fragCode = selectEl("#fragShader").innerText;
	
	
[l3dx.innerText, l3dy.innerText, l3dz.innerText] = camera;
[_3dx.value, _3dy.value, _3dz.value] = camera;
[l4dx.innerText, l4dy.innerText, l4dz.innerText, l4dw.innerText] = rayOrigin;
[_4dx.value, _4dy.value, _4dz.value, _4dw.value] = rayOrigin;
ssi.innerText = SCENE_SIZE;
sceneSizeInp.value = SCENE_SIZE;

	var can = selectEl("#raymarchCan");
	can.width = SCENE_SIZE ** 2;
	can.height = SCENE_SIZE;
	gl = can.getContext("webgl") || can.getContext("experimental-webgl");

	var verts = [
		-1., -1., 0.,
		-1., 1., 0.,
		1., -1., 0.,
		1., 1., 0.
	];
	var indices = [0, 1, 2, 1, 2, 3];
	var il = indices.length;
	
	// Vertices buffer
	var vb = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vb);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	// Index buffer
	var ib = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	// Vertex shader
	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, vertCode);
	gl.compileShader(vs);
	
	// Fragment shader
	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, fragCode);
	
	var compiled = compile(fs);
	if(!compiled) {
		return;
	}
	
	// Shader program
	sp = gl.createProgram();
	gl.attachShader(sp, vs);
	gl.attachShader(sp, fs);
	gl.linkProgram(sp);
	gl.useProgram(sp);
	
	// Attributes...?
	gl.bindBuffer(gl.ARRAY_BUFFER, vb);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
	var coordsAttr = gl.getAttribLocation(sp, "coords");
	gl.vertexAttribPointer(coordsAttr, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(coordsAttr);
	
	// Drawing!
	gl.clearColor(1., 1., 1., 1.);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.viewport(0, 0, can.width, can.height);
	
	passAttr(sp, "2f", "resolution", [can.width, can.height]);
	passAttr(sp, "1f", "size", SCENE_SIZE);
	passAttr(sp, "4f", "ray_origin", rayOrigin);
	gl.drawElements(gl.TRIANGLES, il, gl.UNSIGNED_SHORT, 0);
	
	pixelData = new Uint8Array(can.width * can.height * 4);
	gl.readPixels(0, 0, can.width, can.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
	//console.log(pixelData);

	drawFinalOutput();
};
var finalCan, gl2, sp;
var pixels = [], vertices = [], colors = [], pointSizes = [];
function doMathsWithPixels() {
	pixels = [];
	for(var i = 0; i < /*data.length*/ SCENE_SIZE ** 3 * 4; i += 4) {
		var pixelN = i / 4;
		var imageX = pixelN % (SCENE_SIZE ** 2);
		var imageY = floor(pixelN / (SCENE_SIZE ** 2));
		var x = imageX % SCENE_SIZE;
		var y = 1 - imageY;
		var z = floor(imageX / SCENE_SIZE);
		
		// Transformations
		x /= SCENE_SIZE;
		y /= SCENE_SIZE;
		z /= SCENE_SIZE;
		
		x += camera.x;
		y += camera.y;
		z += camera.z;
		
		pixels.push([[x, y, z], [pixelData[i], pixelData[i + 1], pixelData[i + 2], pixelData[i + 3]]]);
	}
	pixels = projectAndSort(pixels);
	//console.log(pixels);
	
	vertices = [];
	colors = [];
	pointSizes = [];
	for(var i = 0; i < pixels.length; i++) {
		var vert = pixels[i][0];
		var col = pixels[i][1];
		var pointSize = pixels[i][2];
		vertices.push(...vert, !(col[3] > 0));
		colors.push(col[0] / 255, col[1] / 255, col[2] / 255);
		pointSizes.push(120 / (pixels[i][2] * 10));
	}
}
function drawFinalOutput() {
	// Render to 2d canvas
	/*if(!finalCan) {
		finalCan = selectEl("#finalCan");
		gl2 = finalCan.getContext("webgl") || finalCan.getContext("experimental-webgl");
	}*/
	if(finalCanCont.lastChild) {
		finalCanCont.innerHTML="";
	}
	var finalCan = document.createElement("canvas");
	finalCan.id = "finalCan";
	finalCan.width = 2048;
	finalCan.height = 2048;
	finalCanCont.appendChild(finalCan);
	gl2 = finalCan.getContext("webgl") || finalCan.getContext("experimental-webgl");
	
	doMathsWithPixels();

	// Create an empty buffer object to store the vertex buffer
	var vb = gl2.createBuffer();

	//Bind appropriate array buffer to it
	gl2.bindBuffer(gl2.ARRAY_BUFFER, vb);

	// Pass the vertex data to the buffer
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(vertices), gl2.STATIC_DRAW);

	// Unbind the buffer
	gl2.bindBuffer(gl2.ARRAY_BUFFER, null);

	// Create an empty buffer object and store color data
	var color_buffer = gl2.createBuffer ();
	gl2.bindBuffer(gl2.ARRAY_BUFFER, color_buffer);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(colors), gl2.STATIC_DRAW);

	gl2.bindBuffer(gl2.ARRAY_BUFFER, null);
	var pointSizeBuffer = gl2.createBuffer();
	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointSizeBuffer);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(pointSizes), gl2.STATIC_DRAW);


	/*=========================Shaders========================*/

	// vertex shader source code
	var vertCode = `
	attribute vec3 coordinates;
	attribute vec3 color;
	attribute float pointSize;
	varying vec3 vColor;
	void main(void) {
		gl_Position = vec4(coordinates, 1.);
		vColor = color;
		gl_PointSize = pointSize;
	}`;

	// Create a vertex shader object
	var vertShader = gl2.createShader(gl2.VERTEX_SHADER);

	// Attach vertex shader source code
	gl2.shaderSource(vertShader, vertCode);

	// Compile the vertex shader
	gl2.compileShader(vertShader);
	if (!gl2.getShaderParameter(vertShader, gl2.COMPILE_STATUS)) 
		alert(gl2.getShaderInfoLog(vertShader));

	// fragment shader source code
	var fragCode = 'precision mediump float;'+
	'varying vec3 vColor;'+
	'void main(void) {'+
		'gl_FragColor = vec4(vColor, 1.);'+
	'}';

	// Create fragment shader object
	var fragShader = gl2.createShader(gl2.FRAGMENT_SHADER);

	// Attach fragment shader source code
	gl2.shaderSource(fragShader, fragCode);

	// Compile the fragmentt shader
	gl2.compileShader(fragShader);
	if (!gl2.getShaderParameter(fragShader, gl2.COMPILE_STATUS)) 
		alert(gl2.getShaderInfoLog(fragShader));

	// Create a shader program object to store
	// the combined shader program
	var sp = gl2.createProgram();

	// Attach a vertex shader
	gl2.attachShader(sp, vertShader); 

	// Attach a fragment shader
	gl2.attachShader(sp, fragShader);

	// Link both programs
	gl2.linkProgram(sp);
	if ( !gl2.getProgramParameter(sp, gl2.LINK_STATUS) )
		alert(gl2.getProgramInfoLog(sp));

	// Use the combined shader program object
	gl2.useProgram(sp);

	/*======== Associating shaders to buffer objects ========*/

	// Bind vertex buffer object
	gl2.bindBuffer(gl2.ARRAY_BUFFER, vb);

	// Get the attribute location
	var coord = gl2.getAttribLocation(sp, "coordinates");

	// Point an attribute to the currently bound VBO
	gl2.vertexAttribPointer(coord, 3, gl2.FLOAT, false, 0, 0);

	// Enable the attribute
	gl2.enableVertexAttribArray(coord);

	// bind the color buffer
	gl2.bindBuffer(gl2.ARRAY_BUFFER, color_buffer);

	// get the attribute location
	var color = gl2.getAttribLocation(sp, "color");

	// point attribute to the color buffer object
	gl2.vertexAttribPointer(color, 3, gl2.FLOAT, false,0,0) ;

	// enable the color attribute
	gl2.enableVertexAttribArray(color);
	
	gl2.bindBuffer(gl2.ARRAY_BUFFER, pointSizeBuffer);
	var ps = gl2.getAttribLocation(sp, "pointSize");
	gl2.vertexAttribPointer(ps, 1, gl2.FLOAT, false, 0, 0);
	gl2.enableVertexAttribArray(ps);

	/*============= Drawing the primitive ===============*/

	// Clear the canvas
	gl2.clearColor(0, 0, 0, 0);

	// Enable the depth test
	gl2.enable(gl2.DEPTH_TEST);

	// Clear the color buffer bit
	gl2.clear(gl2.COLOR_BUFFER_BIT);

	// Set the view port
	gl2.viewport(0,0,finalCan.width,finalCan.height);

	// Draw the triangle
	gl2.drawArrays(gl2.POINTS, 0, pixels.length);

	//loop();
}

var lastFrame = 0;
function loop() {
	//camera = [_3dx.value, _3dy.value, _3dz.value]
	//drawFinalOutput();
	localStorage.setItem("x",_3dx.value);
	localStorage.setItem("y",_3dy.value);
	localStorage.setItem("z",_3dz.value);

	localStorage.setItem("x2",_4dx.value);
	localStorage.setItem("y2",_4dy.value);
	localStorage.setItem("z2",_4dz.value);
	localStorage.setItem("w2",_4dw.value);

	localStorage.setItem("scene_size", sceneSizeInp.value);
	location.reload();
	
	//doMathsWithPixels();
	

	/*console.log("FPS: " + 1000 / (performance.now() - lastFrame));
	lastFrame = performance.now();
	window.requestAnimationFrame(loop);*/
}

function compile(shader) {
	var startT = performance.now();
	gl.compileShader(shader);
	var elapsed = performance.now() - startT;
	
	var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	console.log("Compiled: " + compiled);
	
	console.log("Compilation time: " + elapsed);
	
	var compilation = gl.getShaderInfoLog(shader);
	console.log("Shader log: " + compilation);
	return compiled;
}
function passAttr(program, dataType, name, stuffs) {
	var loc = gl.getUniformLocation(program, name);
	if(!loc) {
		console.log("could not find that thingy " + name);
		return;
	}
	var thing = `uniform${dataType}`;
	if(stuffs instanceof Array) {
		gl[thing](loc, ...stuffs);
	} else {
		gl[thing](loc, stuffs);
	}
	console.log("passed thingy " + name + " as " + stuffs);
}

function projectAndSort(points) {
	return points.map(p => [LENGTH(...p[0]), [p[0][0] / p[0][2], p[0][1] / p[0][2]], p[1]]).sort((a, b) => a[0] - b[0]).map(p => [p[1], p[2], p[0]]);
}
