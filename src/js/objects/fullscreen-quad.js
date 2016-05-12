'use strict'

var positions = [
-1,-1,0,1,
1,-1,0,1,
-1,1,0,1,
1,1,0,1
]

var uvs = [
  0,0,
  1,0,
  0,1,
  1,1
]

var indices = [0,1,2,1,2,3]

positions = new Float32Array(positions)
uvs = new Float32Array(uvs)
indices = new Uint16Array(indices)

var Geo = {}

module.exports = {
  get: function() {
    return Geo
  },

  create: function(gl) {
    var v_pos = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, v_pos)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    var v_uv = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, v_uv)
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW)

    var idx = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    Geo.positions = v_pos
    Geo.uvs = v_uv
    Geo.indices =  idx
    Geo.count = 6
    Geo.drawMode = gl.TRIANGLES
  }
}