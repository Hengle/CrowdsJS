'use strict'

var vertexPositionBuffer
var vertexColorBuffer
var vertexNormalBuffer
var vertexIndexBuffer
var vertexUVBuffer

var vertices = [
  -0.5,  0.0, -0.5, 1.0,
  -0.5,  0.0,  0.5, 1.0,
   0.5,  0.0,  0.5, 1.0,
   0.5,  0.0, -0.5, 1.0,
]

var normals = [
   0.0,  1.0,  0.0, 0.0,
   0.0,  1.0,  0.0, 0.0,
   0.0,  1.0,  0.0, 0.0,
   0.0,  1.0,  0.0, 0.0,
]

var colors = [
  0.8, 0.8, 0.8, 1.0,
  0.8, 0.8, 0.8, 1.0,
  0.8, 0.8, 0.8, 1.0,
  0.8, 0.8, 0.8, 1.0
]

var uvs = [
  0,1,
  0,0,
  1,0,
  1,1
]

var indices = [
  0, 1, 2,      0, 2, 3
]

var Geo = {}

module.exports = {

  get: function() {
    return Geo
  },

  create: function(gl) {
    vertexPositionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    vertexPositionBuffer.itemSize = 4
    vertexPositionBuffer.numItems = 4

    vertexNormalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
    vertexNormalBuffer.itemSize = 4
    vertexNormalBuffer.numItems = 4

    vertexColorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
    vertexColorBuffer.itemSize = 4
    vertexColorBuffer.numItems = 4

    vertexIndexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    vertexIndexBuffer.itemSize = 1
    vertexIndexBuffer.numItems = 6

    vertexUVBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexUVBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW)
    vertexUVBuffer.itemSize = 2
    vertexUVBuffer.numItems = 4

    Geo.positions = vertexPositionBuffer
    Geo.normals = vertexNormalBuffer
    Geo.colors = vertexColorBuffer
    Geo.indices = vertexIndexBuffer
    Geo.uvs = vertexUVBuffer
    Geo.count = 6
    Geo.drawMode = gl.TRIANGLES
  }
}