'use strict'

var Cone = require('../objects/cone.js')
var SkewedCone = require('../objects/skewed-cone.js')
var GL = require('../gl.js')

module.exports = function(options) {
  var gl = GL.get()
  var ext = gl.getExtension("ANGLE_instanced_arrays")

  var shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, GL.getShader(voronoi_vertex_shader_src, gl.VERTEX_SHADER))
  gl.attachShader(shaderProgram, GL.getShader(voronoi_fragment_shader_src, gl.FRAGMENT_SHADER))
  gl.linkProgram(shaderProgram)

  shaderProgram.attrPos = gl.getAttribLocation(shaderProgram, "vs_pos")
  shaderProgram.attrCol = gl.getAttribLocation(shaderProgram, "vs_col")
  shaderProgram.attrNor = gl.getAttribLocation(shaderProgram, "vs_nor")

  shaderProgram.unifViewProj = gl.getUniformLocation(shaderProgram, "u_ViewProj")
  
  shaderProgram.attrOffset = gl.getAttribLocation(shaderProgram, "vs_offset")
  shaderProgram.attrVelocity = gl.getAttribLocation(shaderProgram, "vs_velocity")
  shaderProgram.attrId = gl.getAttribLocation(shaderProgram, "vs_id")

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not link program!");
  }

  var voronoi_tex = GL.makeTexture(options.gridWidth, options.gridDepth)
  this.tex = voronoi_tex.tex
  this.fbo = voronoi_tex.fbo

  var offsetArray
  var offsetBuffer
  var velocityArray
  var velocityBuffer
  var sprites
  var agents

  this.initAgentBuffers = function(theagents) {
    agents = theagents

    var ids = []
    offsetArray = new Float32Array(agents.length*3)
    velocityArray = new Float32Array(agents.length*3)

    for (var i = 0; i < agents.length; i++) {
      var offset = agents[i].pos
      offsetArray[3*i] = offset[0]
      offsetArray[3*i+1] = offset[1]
      offsetArray[3*i+2] = offset[2]

      offset = agents[i].forward
      velocityArray[3*i] = offset[0]
      velocityArray[3*i+1] = offset[1]
      velocityArray[3*i+2] = offset[2]

      ids.push.apply(ids, agents[i].id)
    }

    var cone
    if (options.sim.rightPreference) {
      cone = SkewedCone.get()
    } else {
      cone = Cone.get()
    }
    offsetBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, offsetArray, gl.DYNAMIC_DRAW)
    offsetBuffer.itemSize = 3
    offsetBuffer.numItems = agents.length

    velocityBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, velocityArray, gl.DYNAMIC_DRAW)
    offsetBuffer.itemSize = 3
    offsetBuffer.numItems = agents.length

    var idBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ids), gl.DYNAMIC_DRAW)
    idBuffer.itemSize = 3
    idBuffer.numItems = agents.length

    sprites = {
      positions: cone.positions,
      normals: cone.normals,
      colors: cone.colors,
      indices: cone.indices,
      count: cone.count,
      drawMode: cone.drawMode,
      offsets: offsetBuffer,
      ids: idBuffer,
      velocities: velocityBuffer
    }
  }

  this.updateBuffers = function() {
    for (var i = 0; i < agents.length; i++) {
      var offset = agents[i].pos
      if (agents[i].finished) {
        offsetArray[3*i] = 99999.0
        offsetArray[3*i+1] = 99999.0
        offsetArray[3*i+2] = 99999.0
      } else {
        offsetArray[3*i] = offset[0]
        offsetArray[3*i+1] = offset[1]
        offsetArray[3*i+2] = offset[2]
      }

      offset = agents[i].forward
      velocityArray[3*i] = offset[0]
      velocityArray[3*i+1] = offset[1]
      velocityArray[3*i+2] = offset[2]

    }
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, offsetArray, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, velocityArray, gl.DYNAMIC_DRAW)
  }

  this.draw = function() {
    gl.useProgram(shaderProgram)

    if (shaderProgram.attrPos != -1 && sprites.positions) {
      gl.bindBuffer(gl.ARRAY_BUFFER, sprites.positions)
      gl.enableVertexAttribArray(shaderProgram.attrPos);
      gl.vertexAttribPointer(shaderProgram.attrPos, 4, gl.FLOAT, false, 0, 0);
      ext.vertexAttribDivisorANGLE(shaderProgram.attrPos, 0);
    }
    if (shaderProgram.attrNor != -1 && sprites.normals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, sprites.normals)
      gl.enableVertexAttribArray(shaderProgram.attrNor);
      gl.vertexAttribPointer(shaderProgram.attrNor, 4, gl.FLOAT, false, 0, 0);
      ext.vertexAttribDivisorANGLE(shaderProgram.attrNor, 0);
    }
    if (shaderProgram.attrCol != -1 && sprites.colors) {
      gl.bindBuffer(gl.ARRAY_BUFFER, sprites.colors)
      gl.enableVertexAttribArray(shaderProgram.attrCol);
      gl.vertexAttribPointer(shaderProgram.attrCol, 4, gl.FLOAT, true, 0, 0);
      ext.vertexAttribDivisorANGLE(shaderProgram.attrCol, 0);
    }

    if (shaderProgram.attrOffset != -1 && sprites.offsets) {
      gl.bindBuffer(gl.ARRAY_BUFFER, sprites.offsets)
      gl.enableVertexAttribArray(shaderProgram.attrOffset)
      gl.vertexAttribPointer(shaderProgram.attrOffset, 3, gl.FLOAT, false, 0, 0);
      ext.vertexAttribDivisorANGLE(shaderProgram.attrOffset, 1);
    }
    if (shaderProgram.attrVelocity != -1 && sprites.velocities) {
      gl.bindBuffer(gl.ARRAY_BUFFER, sprites.velocities)
      gl.enableVertexAttribArray(shaderProgram.attrVelocity)
      gl.vertexAttribPointer(shaderProgram.attrVelocity, 3, gl.FLOAT, false, 0, 0);
      ext.vertexAttribDivisorANGLE(shaderProgram.attrVelocity, 1);
    }
    if (shaderProgram.attrId != -1 && sprites.ids) {
      gl.bindBuffer(gl.ARRAY_BUFFER, sprites.ids)
      gl.enableVertexAttribArray(shaderProgram.attrId)
      gl.vertexAttribPointer(shaderProgram.attrId, 3, gl.FLOAT, false, 0, 0); 
      ext.vertexAttribDivisorANGLE(shaderProgram.attrId, 1);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sprites.indices);
    ext.drawElementsInstancedANGLE(sprites.drawMode, sprites.count, gl.UNSIGNED_SHORT, 0, sprites.ids.numItems);

    if (shaderProgram.attrPos != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrPos)
    }
    if (shaderProgram.attrNor != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrNor)
    }
    if (shaderProgram.attrCol != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrCol)
    }

    if (shaderProgram.attrOffset != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrOffset)
    }
    if (shaderProgram.attrVelocity != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrVelocity)
    }
    if (shaderProgram.attrId != -1) {
      gl.disableVertexAttribArray(shaderProgram.attrId)
    }
  }

  this.setViewProj = function(matrix) {
    gl.useProgram(shaderProgram);
    if (shaderProgram.unifViewProj != -1) {
      gl.uniformMatrix4fv(shaderProgram.unifViewProj, false, matrix);
    }
  }
}