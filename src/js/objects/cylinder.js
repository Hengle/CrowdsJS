'use strict'

var CYL_COUNT = 20
var PI = 3.14159265
var R = 0.5
var H = 0.5

var vertices = []
var normals = []
var indices = []
var colors = []

// top barrel
for (var i = 0; i < CYL_COUNT; i++) {
  var theta = 2*PI*i / CYL_COUNT
  var x = Math.cos(theta)
  var z = Math.sin(theta)
  vertices.push.apply(vertices, [R*x, H, R*z, 1])
  normals.push.apply(normals, [x, 0, z, 0])
  colors.push.apply(colors, [0.8, 0.8, 0.8, 1])
}

// bottom barrel
for (var i = 0; i < CYL_COUNT; i++) {
  var theta = 2*PI*i / CYL_COUNT
  var x = Math.cos(theta)
  var z = Math.sin(theta)
  vertices.push.apply(vertices, [R*x, -H, R*z, 1])
  normals.push.apply(normals, [x, 0, z, 0])
  colors.push.apply(colors, [0.8, 0.8, 0.8, 1])
}

// top face
for (var i = 0; i < CYL_COUNT; i++) {
  var theta = 2*PI*i / CYL_COUNT
  var x = Math.cos(theta)
  var z = Math.sin(theta)
  vertices.push.apply(vertices, [R*x, H, R*z, 1])
  normals.push.apply(normals, [0, 1, 0, 0])
  colors.push.apply(colors, [0.8, 0.8, 0.8, 1])
}

// bottom face
for (var i = 0; i < CYL_COUNT; i++) {
  var theta = 2*PI*i / CYL_COUNT
  var x = Math.cos(theta)
  var z = Math.sin(theta)
  vertices.push.apply(vertices, [R*x, -H, R*z, 1])
  normals.push.apply(normals, [0, -1, 0, 0])
  colors.push.apply(colors, [0.8, 0.8, 0.8, 1])
}

// barrel indices
for (var i = 0; i < CYL_COUNT; i++) {
  var idx1 = i
  var idx2 = i+1
  var idx3 = i+CYL_COUNT
  var idx4 = i+CYL_COUNT+1

  if (idx2 >= CYL_COUNT) {
    idx2 -= CYL_COUNT
  }

  if (idx4 >= 2*CYL_COUNT) {
    idx4 -= CYL_COUNT
  }

  indices.push.apply(indices, [idx1, idx2, idx3])
  indices.push.apply(indices, [idx2, idx3, idx4])
}

for (var i = 2*CYL_COUNT + 1; i < 3*CYL_COUNT - 1; i++) {
  indices.push.apply(indices, [2*CYL_COUNT, i, i+1])
}

for (var i = 3*CYL_COUNT + 1; i < 4*CYL_COUNT - 1; i++) {
  indices.push.apply(indices, [3*CYL_COUNT, i, i+1])
}

var Geo = {}
var vertexPositionBuffer
var vertexColorBuffer
var vertexNormalBuffer
var vertexIndexBuffer

module.exports = {

  get: function() {
    return Geo
  },

  create: function(gl) {
    vertexPositionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    vertexPositionBuffer.itemSize = 4
    vertexPositionBuffer.numItems = 4*CYL_COUNT

    vertexNormalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
    vertexNormalBuffer.itemSize = 4
    vertexNormalBuffer.numItems = 4*CYL_COUNT

    vertexColorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
    vertexColorBuffer.itemSize = 4
    vertexColorBuffer.numItems = 4*CYL_COUNT

    vertexIndexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    vertexIndexBuffer.itemSize = 1
    vertexIndexBuffer.numItems = CYL_COUNT*2*3 + (CYL_COUNT-2)*2*3

    Geo.positions = vertexPositionBuffer
    Geo.normals = vertexNormalBuffer
    Geo.colors = vertexColorBuffer
    Geo.indices = vertexIndexBuffer
    Geo.count = CYL_COUNT*2*3 + (CYL_COUNT-2)*2*3
    Geo.drawMode = gl.TRIANGLES
  }
}