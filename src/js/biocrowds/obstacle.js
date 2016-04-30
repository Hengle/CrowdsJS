'use strict'

var GL = require('../gl')

var Obstacle = function(points) {
  var gl = GL.get()

  var vertices = []
  var normals = []
  var indices = []
  var colors = []
  var N = points.length

  // bottom verts
  for (var i = 0; i < N; i++) {
    vertices.push(vec4.fromValues(points[i][0], 0, points[i][1], 1))
  }

  // top verts
  for (var i = 0; i < N; i++) {
    vertices.push(vec4.fromValues(points[i][0], 1, points[i][1], 1))
  }

  // bottom barrel verts
  for (var i = 0; i < N; i++) {
    vertices.push(vec4.fromValues(points[i][0], 0, points[i][1], 1))
  }

  // top barrel verts
  for (var i = 0; i < N; i++) {
    vertices.push(vec4.fromValues(points[i][0], 1, points[i][1], 1))
  }

  for (var i = 0; i < N; i++) {
    normals.push(vec4.fromValues(0,-1,0,0))
  }

  for (var i = 0; i < N; i++) {
    normals.push(vec4.fromValues(0,1,0,0))
  }

  var up = vec3.fromValues(0,1,0)
  for (var i = 0; i < N; i++) {
    var norm = vec4.create()
    vec3.sub(norm, vertices[i], vertices[(i+1)%N])
    vec3.cross(norm, up, norm)
    vec3.normalize(norm, norm)
    normals.push(norm)
  }

  for (var i = 0; i < N; i++) {
    var norm = vec4.create()
    vec3.sub(norm, vertices[i], vertices[(i+1)%N])
    vec3.cross(norm, up, norm)
    vec3.normalize(norm, norm)
    normals.push(norm)
  }

  for (var i=0; i < 4*N; i++) {
    colors = colors.concat([0.8, 0.8, 0.8, 1.0]);
  }

  // build top vertices
  for (var i = 1; i < N-1; i++) {
    indices = indices.concat([
      0, 
      i, 
      (i+1)%N
    ])
  }

  // build bottom vertices
  for (var i = 1; i < N-1; i++) {
    indices = indices.concat([
      N + 0, 
      N + i, 
      N + (i+1)%N
    ])
  }

  // build barrel vertices
  for (var i=0; i < N; i++) {
    indices = indices.concat([
      2*N + i, 
      2*N + (i+1)%N, 
      2*N + N + (i+1)%N
    ])
    indices = indices.concat([
      2*N + i, 
      2*N + N + (i+1)%N, 
      2*N + N + i
    ])
  }

  vertices = vertices.reduce(function(a, b) {
    a.push.apply(a, b)
    return a
  }, [])

  normals = normals.reduce(function(a, b) {
    a.push.apply(a, b)
    return a
  }, [])

  var Geo = {}

  this.get = function() {
    return Geo
  }

  var vertexPositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  vertexPositionBuffer.itemSize = 4
  vertexPositionBuffer.numItems = vertices.length / 4
  
  var vertexColorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
  vertexColorBuffer.itemSize = 4
  vertexColorBuffer.numItems = colors.length / 4

  var vertexNormalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
  vertexNormalBuffer.itemSize = 4
  vertexNormalBuffer.numItems = normals.length / 4

  var vertexIndexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
  vertexIndexBuffer.itemSize = 1
  vertexIndexBuffer.numItems = indices.length

  Geo.positions = vertexPositionBuffer
  Geo.normals = vertexNormalBuffer
  Geo.colors = vertexColorBuffer
  Geo.indices = vertexIndexBuffer
  Geo.count = indices.length
  Geo.drawMode = gl.TRIANGLES
}

module.exports = Obstacle;