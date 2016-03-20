'use strict'

var PI = 3.14159265
var R = 0.5

var vertices = []
var normals = []
var indices = [0, 1, 2]
var colors = []

var t1 = 0
var t2 = PI - PI / 6
var t3 = PI + PI / 6

var pushAngle = function(theta) {
  var x = Math.cos(theta)
  var z = Math.sin(theta)
  vertices.push.apply(vertices, [R*x, 0, R*z, 1])
  normals.push.apply(normals, [0, 1, 0, 0])
  colors.push.apply(colors, [0.8, 0.8, 0.8, 1])
}

pushAngle(t1)
pushAngle(t2)
pushAngle(t3)

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
    vertexPositionBuffer.numItems = 3

    vertexNormalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
    vertexNormalBuffer.itemSize = 4
    vertexNormalBuffer.numItems = 3

    vertexColorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
    vertexColorBuffer.itemSize = 4
    vertexColorBuffer.numItems = 3

    vertexIndexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    vertexIndexBuffer.itemSize = 1
    vertexIndexBuffer.numItems = 3

    Geo.positions = vertexPositionBuffer
    Geo.normals = vertexNormalBuffer
    Geo.colors = vertexColorBuffer
    Geo.indices = vertexIndexBuffer
    Geo.count = 3
    Geo.drawMode = gl.TRIANGLES
  }
}