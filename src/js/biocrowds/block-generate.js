'use strict'

var GridChunker = require('./grid-chunk')

var evaluateMarkerWeight = function(x, y, ax, ay, gx, gy) {
  var v1 = vec2.fromValues(x-ax, y-ay)
  var v2 = vec2.fromValues(gx-ax, gy-ay)
  vec2.normalize(v1,v1)
  vec2.normalize(v2,v2)
  return 1 + vec2.dot(v1,v2)
}

module.exports = function(GL, projector, options) {

  var edgeid = GL.createBuffer()
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, edgeid)
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, 0, GL.DYNAMIC_DRAW)

  var edgepos = GL.createBuffer()
  GL.bindBuffer(GL.ARRAY_BUFFER, edgepos)
  GL.bufferData(GL.ARRAY_BUFFER, 0, GL.DYNAMIC_DRAW)

  var edgecol = GL.createBuffer()
  GL.bindBuffer(GL.ARRAY_BUFFER, edgecol)
  GL.bufferData(GL.ARRAY_BUFFER, 0, GL.DYNAMIC_DRAW)

  var bufferData

  var chunker = new GridChunker()

  this.chunk = function(agents, buffer, options) {
    for (var i = 0; i < agents.length; i++) {
      agents[i].blocks = []
    }

    var edge_pos = []
    var edge_cols = []
    var edge_ids = []
    var edgeCount = 0

    var screenPos = vec3.create()

    chunker.init(buffer, options)
    chunker.chunk(0,0,options.gridWidth,options.gridDepth, function(x,y,X,Y,col) {
      var id = projector.col2ID(col)

      if (id < agents.length) {
        vec3.transformMat4(screenPos, agents[id].pos, projector.viewproj)
        var ax = 0.5*(screenPos[0]+1)*options.gridWidth
        var ay = 0.5*(screenPos[1]+1)*options.gridDepth
        vec3.transformMat4(screenPos, agents[id].goal, projector.viewproj)
        var gx = 0.5*(screenPos[0]+1)*options.gridWidth
        var gy = 0.5*(screenPos[1]+1)*options.gridDepth

        chunker.filterRadius(x,X,y,Y,25,ax,ay, id, function(x,X,y,Y, id) {
          var w1 = evaluateMarkerWeight(x, y, ax, ay, gx, gy)
          var w2 = evaluateMarkerWeight(X, y, ax, ay, gx, gy)
          var w3 = evaluateMarkerWeight(x, Y, ax, ay, gx, gy)
          var w4 = evaluateMarkerWeight(X, Y, ax, ay, gx, gy)
          var W = w1+w2+w3+w4

          var pos = vec2.fromValues(
            (x-ax)*w1/W + (X-ax)*w2/W + (x-ax)*w3/W + (X-ax)*w4/W, 
            (y-ay)*w1/W + (y-ay)*w2/W + (Y-ay)*w3/W + (Y-ay)*w4/W)

          agents[id].blocks.push({
            pos: pos, 
            weight: W*(X-x)*(Y-y)
          })

          var l = edgeCount
          edge_ids.push.apply(edge_ids, [l,l+1, l+1,l+2, l+2,l+3, l+3,l])
          var nx = x / options.gridWidth * 2 - 1
          var nX = X / options.gridWidth * 2 - 1
          var ny = y / options.gridDepth * 2 - 1
          var nY = Y / options.gridDepth * 2 - 1
          edge_pos.push.apply(edge_pos,[
            nx,ny,0.5,1,
            nX,ny,0.5,1,
            nX,nY,0.5,1,
            nx,nY,0.5,1
          ])
          edgeCount += 4
          var r = agents[id].col[0]
          var g = agents[id].col[1]
          var b = agents[id].col[2]

          edge_cols.push.apply(edge_cols, [
            r, g, b, 1,
            r, g, b, 1,
            r, g, b, 1,
            r, g, b, 1
          ])
        })
      }
    })

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, edgeid)
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(edge_ids), GL.DYNAMIC_DRAW)

    GL.bindBuffer(GL.ARRAY_BUFFER, edgepos)
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(edge_pos), GL.DYNAMIC_DRAW)

    GL.bindBuffer(GL.ARRAY_BUFFER, edgecol)
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(edge_cols), GL.DYNAMIC_DRAW)

    bufferData = {
      positions: edgepos,
      colors: edgecol,
      indices: edgeid,
      drawMode: GL.LINES,
      count: edge_ids.length
    }
  }

  this.buffer = function() {
    return bufferData
  }
}