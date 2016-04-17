'use strict'

var Cone = require('../objects/cone.js')

module.exports = function(GL, projector, options) {
  var voronoiFBO = GL.createFramebuffer()
  GL.bindFramebuffer(GL.FRAMEBUFFER, voronoiFBO);
  var rttTexture = GL.createTexture();
  GL.bindTexture(GL.TEXTURE_2D, rttTexture);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST)
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST)
  GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, options.gridWidth, options.gridDepth, 0, GL.RGBA, GL.UNSIGNED_BYTE, null)

  var renderbuffer = GL.createRenderbuffer();
  GL.bindRenderbuffer(GL.RENDERBUFFER, renderbuffer);
  GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, options.gridWidth, options.gridDepth)
  GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, rttTexture, 0)
  GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, renderbuffer)

  GL.bindFramebuffer(GL.FRAMEBUFFER, null)
  GL.bindRenderbuffer(GL.RENDERBUFFER, null)
  GL.bindTexture(GL.TEXTURE_2D, null)

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

    var cone = Cone.get()
    offsetBuffer = GL.createBuffer()
    GL.bindBuffer(GL.ARRAY_BUFFER, offsetBuffer)
    GL.bufferData(GL.ARRAY_BUFFER, offsetArray, GL.DYNAMIC_DRAW)
    offsetBuffer.itemSize = 3
    offsetBuffer.numItems = agents.length

    velocityBuffer = GL.createBuffer()
    GL.bindBuffer(GL.ARRAY_BUFFER, velocityBuffer)
    GL.bufferData(GL.ARRAY_BUFFER, velocityArray, GL.DYNAMIC_DRAW)
    offsetBuffer.itemSize = 3
    offsetBuffer.numItems = agents.length

    var idBuffer = GL.createBuffer()
    GL.bindBuffer(GL.ARRAY_BUFFER, idBuffer)
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(ids), GL.DYNAMIC_DRAW)
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
      offsetArray[3*i] = offset[0]
      offsetArray[3*i+1] = offset[1]
      offsetArray[3*i+2] = offset[2]

      offset = agents[i].forward
      velocityArray[3*i] = offset[0]
      velocityArray[3*i+1] = offset[1]
      velocityArray[3*i+2] = offset[2]
    }
    GL.bindBuffer(GL.ARRAY_BUFFER, offsetBuffer)
    GL.bufferData(GL.ARRAY_BUFFER, offsetArray, GL.DYNAMIC_DRAW)

    GL.bindBuffer(GL.ARRAY_BUFFER, velocityBuffer)
    GL.bufferData(GL.ARRAY_BUFFER, velocityArray, GL.DYNAMIC_DRAW)
  }

  this.buffer = function() {
    return sprites
  }
}