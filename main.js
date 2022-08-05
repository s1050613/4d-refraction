const selectEl = document.querySelector.bind(document);
const selectEls = document.querySelectorAll.bind(document);

const {floor, min, max, hypot: LENGTH} = Math;

var SCENE_SIZE = 128;

var gl;

window.onload = () => {
	var vertCode = selectEl("#vertShader").innerText;
	var fragCode = selectEl("#fragShader").innerText;
	
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
	gl.drawElements(gl.TRIANGLES, il, gl.UNSIGNED_SHORT, 0);
	
	var pixels = new Uint8Array(can.width * can.height * 4);
	gl.readPixels(0, 0, can.width, can.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	console.log(pixels);

	drawFinalOutput(pixels);
};
function drawFinalOutput(data) {
	// Render to 2d canvas
	var finalCan = selectEl("#finalCan");
	var gl2 = finalCan.getContext("webgl") || can.getContext("experimental-webgl");
	
	var camera = [-0.5, 0.5, -1.5];
	var pixels = [];
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
		
		pixels.push([[x, y, z], [data[i], data[i + 1], data[i + 2], data[i + 3]]]);
	}
	pixels = projectAndSort(pixels);
	console.log(pixels);
	
	/*var vertices = [
		-0.5,0.5,0.0,
		-0.002,0.5,0.0, 
		0.0,0.5,0.0,
	];

	var colors = [0,0,1,  0,1,0,1,0,0,];*/
	var vertices = [];
	var colors = [];
	for(var i = 0; i < pixels.length; i++) {
		//vertices.push(...pixels[i][0]);
		//colors.push(...pixels[i][1]);
		var vert = pixels[i][0];
		var col = pixels[i][1];
		vertices.push(...vert, !(col[3] > 0));
		colors.push(col[0] / 255, col[1] / 255, col[2] / 255);
	}
	console.log(vertices);
	console.log(colors);

	// Create an empty buffer object to store the vertex buffer
	var vertex_buffer = gl2.createBuffer();

	//Bind appropriate array buffer to it
	gl2.bindBuffer(gl2.ARRAY_BUFFER, vertex_buffer);

	// Pass the vertex data to the buffer
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(vertices), gl2.STATIC_DRAW);

	// Unbind the buffer
	gl2.bindBuffer(gl2.ARRAY_BUFFER, null);

	// Create an empty buffer object and store color data
	var color_buffer = gl2.createBuffer ();
	gl2.bindBuffer(gl2.ARRAY_BUFFER, color_buffer);
	gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(colors), gl2.STATIC_DRAW);


	/*=========================Shaders========================*/

	// vertex shader source code
	var vertCode = 'attribute vec3 coordinates;'+
	'attribute vec3 color;'+
	'varying vec3 vColor;'+
	'void main(void) {' +
		' gl_Position = vec4(coordinates, 1.0);' +
		'vColor = color;'+
		'gl_PointSize = 2.0;'+
	'}';

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
	var shaderProgram = gl2.createProgram();

	// Attach a vertex shader
	gl2.attachShader(shaderProgram, vertShader); 

	// Attach a fragment shader
	gl2.attachShader(shaderProgram, fragShader);

	// Link both programs
	gl2.linkProgram(shaderProgram);
	if ( !gl2.getProgramParameter(shaderProgram, gl2.LINK_STATUS) )
		alert(gl2.getProgramInfoLog(shaderProgram));

	// Use the combined shader program object
	gl2.useProgram(shaderProgram);

	/*======== Associating shaders to buffer objects ========*/

	// Bind vertex buffer object
	gl2.bindBuffer(gl2.ARRAY_BUFFER, vertex_buffer);

	// Get the attribute location
	var coord = gl2.getAttribLocation(shaderProgram, "coordinates");

	// Point an attribute to the currently bound VBO
	gl2.vertexAttribPointer(coord, 3, gl2.FLOAT, false, 0, 0);

	// Enable the attribute
	gl2.enableVertexAttribArray(coord);

	// bind the color buffer
	gl2.bindBuffer(gl2.ARRAY_BUFFER, color_buffer);

	// get the attribute location
	var color = gl2.getAttribLocation(shaderProgram, "color");

	// point attribute to the color buffer object
	gl2.vertexAttribPointer(color, 3, gl2.FLOAT, false,0,0) ;

	// enable the color attribute
	gl2.enableVertexAttribArray(color);

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
	return points.map(p => [LENGTH(...p[0]), [p[0][0] / p[0][2], p[0][1] / p[0][2]], p[1]]).sort((a, b) => a[0] - b[0]).map(p => [p[1], p[2]]);
}