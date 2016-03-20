'use strict'

var cubeVertexPositionBuffer
var cubeVertexColorBuffer
var cubeVertexNormalBuffer
var cubeVertexIndexBuffer

var vertices = [
  // Front face
  -0.5, -0.5,  0.5, 1.0,
   0.5, -0.5,  0.5, 1.0,
   0.5,  0.5,  0.5, 1.0,
  -0.5,  0.5,  0.5, 1.0,

  // Back face
  -0.5, -0.5, -0.5, 1.0,
  -0.5,  0.5, -0.5, 1.0,
   0.5,  0.5, -0.5, 1.0,
   0.5, -0.5, -0.5, 1.0,

  // Top face
  -0.5,  0.5, -0.5, 1.0,
  -0.5,  0.5,  0.5, 1.0,
   0.5,  0.5,  0.5, 1.0,
   0.5,  0.5, -0.5, 1.0,

  // Bottom face
  -0.5, -0.5, -0.5, 1.0,
   0.5, -0.5, -0.5, 1.0,
   0.5, -0.5,  0.5, 1.0,
  -0.5, -0.5,  0.5, 1.0,

  // Right face
   0.5, -0.5, -0.5, 1.0,
   0.5,  0.5, -0.5, 1.0,
   0.5,  0.5,  0.5, 1.0,
   0.5, -0.5,  0.5, 1.0,

  // Left face
  -0.5, -0.5, -0.5, 1.0,
  -0.5, -0.5,  0.5, 1.0,
  -0.5,  0.5,  0.5, 1.0,
  -0.5,  0.5, -0.5, 1.0
];

var normals = [
  // Front
   0.0,  0.0,  1.0, 0.0,
   0.0,  0.0,  1.0, 0.0,
   0.0,  0.0,  1.0, 0.0,
   0.0,  0.0,  1.0, 0.0,

  // Back
   0.0,  0.0, -1.0, 0.0,
   0.0,  0.0, -1.0, 0.0,
   0.0,  0.0, -1.0, 0.0,
   0.0,  0.0, -1.0, 0.0,

  // Top
   0.0,  1.0,  0.0, 0.0,
   0.0,  1.0,  0.0, 0.0,
   0.0,  1.0,  0.0, 0.0,
   0.0,  1.0,  0.0, 0.0,

  // Bottom
   0.0, -1.0,  0.0, 0.0,
   0.0, -1.0,  0.0, 0.0,
   0.0, -1.0,  0.0, 0.0,
   0.0, -1.0,  0.0, 0.0,

  // Right
   1.0,  0.0,  0.0, 0.0,
   1.0,  0.0,  0.0, 0.0,
   1.0,  0.0,  0.0, 0.0,
   1.0,  0.0,  0.0, 0.0,

  // Left
  -1.0,  0.0,  0.0, 0.0,
  -1.0,  0.0,  0.0, 0.0,
  -1.0,  0.0,  0.0, 0.0,
  -1.0,  0.0,  0.0, 0.0
];

var cubeVertexIndices = [
  0, 1, 2,      0, 2, 3,    // Front face
  4, 5, 6,      4, 6, 7,    // Back face
  8, 9, 10,     8, 10, 11,  // Top face
  12, 13, 14,   12, 14, 15, // Bottom face
  16, 17, 18,   16, 18, 19, // Right face
  20, 21, 22,   20, 22, 23  // Left face
]

var colors = [];
for (var i=0; i < 24; i++) {
  colors = colors.concat([0.8, 0.8, 0.8, 1.0]);
}

var Geo = {}

module.exports = {

  get: function() {
    return Geo
  },

  create: function(gl) {
    cubeVertexPositionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    cubeVertexPositionBuffer.itemSize = 4
    cubeVertexPositionBuffer.numItems = 24

    cubeVertexNormalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
    cubeVertexNormalBuffer.itemSize = 4
    cubeVertexNormalBuffer.numItems = 24

    cubeVertexColorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
    cubeVertexColorBuffer.itemSize = 4
    cubeVertexColorBuffer.numItems = 24

    cubeVertexIndexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW)
    cubeVertexIndexBuffer.itemSize = 1
    cubeVertexIndexBuffer.numItems = 36

    Geo.positions = cubeVertexPositionBuffer
    Geo.normals = cubeVertexNormalBuffer
    Geo.colors = cubeVertexColorBuffer
    Geo.indices = cubeVertexIndexBuffer
    Geo.count = 36
    Geo.drawMode = gl.TRIANGLES
  }
}