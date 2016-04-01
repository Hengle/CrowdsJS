'use strict'

var Sobol = require('../lib/sobol.js')
var sobol = new Sobol(2)
var Cube = require('../objects/cube.js')
var Cylinder = require('../objects/cylinder.js')
var Cone = require('../objects/cone.js')
var Triangle = require('../objects/triangle.js')
var Plane = require('../objects/plane.js')
var ShaderProgram = require('../shaderprogram.js')
var GridChunker = require('./grid-chunk')

var defaultOptions = {
  originX: -15,
  originZ: -15,
  sizeX: 30,
  sizeZ: 30,
  markerDensity: 10,
  gridSize: 0.1,
  searchRadius: 3,
  rightPreference: false,
  drawMarkers: false
}

var BioCrowds = function(gl, options) {

  for (var key in defaultOptions) {
    if (!options.hasOwnProperty(key)) {
      options[key] = defaultOptions[key]
    }
  }

  console.log(options)

  var Marker = function(x, z) {
    return {
      pos: vec3.fromValues(x, 0, z),
      col: [0.2, 0.2, 0.2, 1]
    }
  }

  var gridWidth = Math.ceil(options.sizeX / options.gridSize)
  var gridDepth = Math.ceil(options.sizeZ / options.gridSize)

  var Grid = function() {
    
    var GridCell = function(x, z) {
      var cell = {
        items: [],

        getIdx: function() {
          return [x, z]
        }
      }

      return cell
    }

    var grid = {
      cells: [],

      cellIdx: function(x, z) {
        return parseInt(x) + parseInt(z) * gridDepth
      },

      cellAt: function(x, z) {
        var xIdx = (x - options.originX) / options.gridSize
        var zIdx = (z - options.originZ) / options.gridSize
        if (xIdx < 0 || xIdx >= gridWidth || zIdx < 0 || zIdx >= gridDepth) {
          return -1
        }
        return grid.cellIdx(xIdx, zIdx)
      },

      cellAtPos: function(vec) {
        return grid.cellAt(vec[0], vec[2])
      },

      addItem: function(item, x, z) {
        grid.cells[grid.cellAt(x, z)].items.push(item)
      },

      cellsInRadius: function(pos, r) {
        var xL = pos[0]-r//parseInt((pos[0]-r - options.originX) / options.gridSize)
        var xH = pos[0]+r//parseInt((pos[0]+r - options.originX) / options.gridSize)
        var zL = pos[2]-r//parseInt((pos[2]-r - options.originZ) / options.gridSize)
        var zH = pos[2]+r//parseInt((pos[2]+r - options.originZ) / options.gridSize)
        
        var cells = []
        /*for (var x = xL; x <= xH; x += 1) {
          for (var z = zL; z <= zH ; z += 1) {
            if (x >= 0 && x < gridWidth && z >= 0 && z < gridDepth) {
              cells.push(grid.cellIdx(x, z))
            }
          }
        }*/
        for (var x = xL; x <= xH; x += options.gridSize) {
          for (var z = zL; z <= zH ; z += options.gridSize) {
            var cell = grid.cellAt(x, z)
            if (cell >= 0) {
              cells.push(cell)
            }
          }
        }
        return cells
      },

      itemsInRadius: function(pos, r) {
        var cells = grid.cellsInRadius(pos, r)
        var items = []
        for (var i = 0; i < cells.length; i++) {
          items.push.apply(items, grid.cells[i].items)
        }
        return items
      }
    }

    for (var cellX = 0; cellX < gridWidth; cellX++) {
      for (var cellZ = 0; cellZ < gridDepth; cellZ++) {
        grid.cells.push(GridCell(cellX, cellZ))
      }   
    }

    return grid
  }

  var markers = []
  var markerGrid
  var agents= []
  var drawables = []
  var voronoiFBO
  var voronoiBuffer = new Uint8Array(gridWidth*gridDepth*4)
  var viewproj = mat4.create()
  var invviewproj = mat4.create()
  var Sprite
  var offsetBuffer
  var offsetArray

  var edgeid
  var edgepos
  var edgecol

  var bioCrowds = {
    init: function() {
      markerGrid = Grid()

      // var numMarkers = options.sizeX*options.sizeZ*options.markerDensity
      // for (var i = 0; i < numMarkers; i++) {
      //   var vec = sobol.nextVector()
      //   vec = [vec[0]*options.sizeX+options.originX, vec[1]*options.sizeZ+options.originZ]
      //   var marker = Marker(vec[0], vec[1])
      //   markerGrid.addItem(i, vec[0], vec[1])
      //   markers.push(marker)
      // }
      // var i = 0
      // for (var x = 0; x < options.sizeX; x+=options.gridSize) {
      //   for (var z = 0; z < options.sizeZ; z+=options.gridSize) {
      //     for (var a = 0; a < options.markerDensity*options.gridSize; a++) {
      //       var xpos = x + Math.random() * options.gridSize + options.originX
      //       var zpos = z + Math.random() * options.gridSize + options.originZ
      //       var marker = Marker(xpos, zpos)
      //       markerGrid.addItem(i++, xpos, zpos)
      //       markers.push(marker)
      //     }
      //   }
      // } 

      var planeTrans = mat4.create()
      mat4.scale(planeTrans, planeTrans, vec3.fromValues(options.sizeX, 1, options.sizeZ))
      var planeCol = vec4.fromValues(0.8,0.8,0.8,1)
      var groundPlane = {
        draw: function() {
          gl.Lambert.setColor(planeCol),
          gl.Lambert.setModelMat(planeTrans),
          gl.Lambert.draw(Plane.get())   
        }
      }
      drawables.push(groundPlane)
      gl.drawables.push(groundPlane)

      // bioCrowds.setupMarkerBuffers()

      var GL = gl.getGL()
      var voronoiFBO = GL.createFramebuffer()
      GL.bindFramebuffer(GL.FRAMEBUFFER, voronoiFBO);
      var rttTexture = GL.createTexture();
      GL.bindTexture(GL.TEXTURE_2D, rttTexture);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST)
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST)
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, gridWidth, gridDepth, 0, GL.RGBA, GL.UNSIGNED_BYTE, null)

      var renderbuffer = GL.createRenderbuffer();
      GL.bindRenderbuffer(GL.RENDERBUFFER, renderbuffer);
      GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, gridWidth, gridDepth)
      GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, rttTexture, 0)
      GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, renderbuffer)

      GL.bindFramebuffer(GL.FRAMEBUFFER, null)
      GL.bindRenderbuffer(GL.RENDERBUFFER, null)
      GL.bindTexture(GL.TEXTURE_2D, null)

      var view = mat4.create()
      var projection = mat4.create()
      mat4.lookAt(view, vec3.fromValues(0,100,0), vec3.fromValues(0,0,0), vec3.fromValues(0,0,-1))
      mat4.ortho(projection, 
        options.originX, options.sizeX + options.originX, 
        options.originZ, options.sizeZ + options.originZ, 
        0.1, 200)
      mat4.multiply(viewproj, projection, view)
      mat4.invert(invviewproj, viewproj)



      edgeid = GL.createBuffer()
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, edgeid)
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, null, GL.DYNAMIC_DRAW)

      edgepos = GL.createBuffer()
      GL.bindBuffer(GL.ARRAY_BUFFER, edgepos)
      GL.bufferData(GL.ARRAY_BUFFER, null, GL.DYNAMIC_DRAW)

      edgecol = GL.createBuffer()
      GL.bindBuffer(GL.ARRAY_BUFFER, edgecol)
      GL.bufferData(GL.ARRAY_BUFFER, null, GL.DYNAMIC_DRAW)
    },

    deinit: function() {
      for (var i = 0; i < drawables.length; i++) {
        var idx =gl.drawables.indexOf(drawables[i])
        gl.drawables.splice(idx, 1)
      }
    },

    setupMarkerBuffers: function() {
      var GL = gl.getGL()
      var positions = []
      var colors = []
      var indices = []
      for (var i = 0; i < markers.length; i++) {
        positions.push(markers[i].pos[0])
        positions.push(markers[i].pos[1])
        positions.push(markers[i].pos[2])
        positions.push(1)
        colors = colors.concat(markers[i].col)
        indices.push(i)
      }

      var position_buffer = GL.createBuffer()
      GL.bindBuffer(GL.ARRAY_BUFFER, position_buffer)
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(positions), GL.STATIC_DRAW)
      positions.itemSize = 4
      positions.numItems = markers.length

      var color_buffer = GL.createBuffer()
      GL.bindBuffer(GL.ARRAY_BUFFER, color_buffer)
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(colors), GL.STATIC_DRAW)
      colors.itemSize = 4
      colors.numItems = markers.length

      var index_buffer = GL.createBuffer()
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, index_buffer)
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), GL.STATIC_DRAW)
      index_buffer.itemSize = 1
      index_buffer.numItems = markers.length

      var markersDrawable = {
        positions: position_buffer,
        colors: color_buffer,
        indices: index_buffer,
        count: markers.length,
        drawMode: GL.POINTS
      }

      var markerDraw = {
        draw: function() {
          gl.MarkerShader.draw(markersDrawable)
        }
      }
      drawables.push(markerDraw)
      gl.drawables.push(markerDraw)
    },

    initAgents: function(theagents) {
      agents = theagents

      var agentTransMat = mat4.create()
      var agentOffset = vec3.fromValues(0, 0.5, 0)
      var arrowOffset = vec3.fromValues(0, 0.6, 0)
      var goalScale = vec3.fromValues(0.25, 2, 0.25)
      var agentPainter = function(idx) {
        return {
          draw: function() {
            mat4.identity(agentTransMat)
            mat4.translate(agentTransMat, agentTransMat, agents[idx].pos)
            mat4.translate(agentTransMat, agentTransMat, agentOffset)
            mat4.rotateY(agentTransMat, agentTransMat, Math.atan2(-agents[idx].forward[2], agents[idx].forward[0]))
            gl.Lambert.setColor(agents[idx].col)
            gl.Lambert.setModelMat(agentTransMat)
            gl.Lambert.draw(Cylinder.get())

            mat4.translate(agentTransMat, agentTransMat, arrowOffset)
            gl.Lambert.setModelMat(agentTransMat)
            gl.Lambert.draw(Triangle.get())

            mat4.identity(agentTransMat)
            mat4.translate(agentTransMat, agentTransMat, agents[idx].goal)
            mat4.translate(agentTransMat, agentTransMat, agentOffset)
            mat4.scale(agentTransMat, agentTransMat, goalScale)
            gl.Lambert.setModelMat(agentTransMat)
            gl.Lambert.draw(Cylinder.get())

            if (options.drawMarkers) {
              for (var i = 0; i < agents[idx].markers.length; i++) {
                var markerScale = vec3.fromValues(0.1, 0.1, 0.1)
                vec3.scale(markerScale, markerScale, markers[agents[idx].markers[i]].weight)

                mat4.identity(agentTransMat)
                mat4.translate(agentTransMat, agentTransMat, markers[agents[idx].markers[i]].pos)
                mat4.scale(agentTransMat, agentTransMat, markerScale)
                gl.Lambert.setModelMat(agentTransMat)
                gl.Lambert.draw(Cylinder.get())
              }
            }
          }
        }
      }

      var ids = [];
      // var offsets = [];
      offsetArray = new Float32Array(agents.length*3)

      for (var i = 0; i < agents.length; i++) {
        agents[i].done = false
        agents[i].markers = []
        var offset = agents[i].pos
        offsetArray[3*i] = offset[0]
        offsetArray[3*i+1] = offset[1]
        offsetArray[3*i+2] = offset[2]
        // offsets.push.apply(offsets, [offset[0], offset[1], offset[2]])
        ids.push.apply(ids, agents[i].id)

        var agent = agentPainter(i)
        gl.drawables.push(agent)
        drawables.push(agent)
      }

      var GL = gl.getGL()
      var cone = Cone.get()
      offsetBuffer = GL.createBuffer()
      GL.bindBuffer(GL.ARRAY_BUFFER, offsetBuffer)
      GL.bufferData(GL.ARRAY_BUFFER, offsetArray, GL.DYNAMIC_DRAW)
      offsetBuffer.itemSize = 3
      offsetBuffer.numItems = agents.length

      var idBuffer = GL.createBuffer()
      GL.bindBuffer(GL.ARRAY_BUFFER, idBuffer)
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(ids), GL.DYNAMIC_DRAW)
      idBuffer.itemSize = 3
      idBuffer.numItems = agents.length

      Sprite = {
        positions: cone.positions,
        normals: cone.normals,
        colors: cone.colors,
        indices: cone.indices,
        count: cone.count,
        drawMode: cone.drawMode,
        offsets: offsetBuffer,
        ids: idBuffer
      }
    },

    step: function(t) {
      var GL = gl.getGL()
      // GL.bindFramebuffer(GL.FRAMEBUFFER, voronoiFBO)
      GL.clear( GL.DEPTH_BUFFER_BIT)
      GL.viewport(0, 0, gridWidth, gridDepth)
      gl.VoronoiShader.setViewProj(viewproj)
      gl.VoronoiShader.draw(Sprite, true)
      GL.readPixels(0,0,gridWidth,gridDepth, GL.RGBA, GL.UNSIGNED_BYTE, voronoiBuffer)
      // console.log(voronoiBuffer)

      for (var i = 0; i < agents.length; i++) {
        agents[i].blocks = []
      }
      var edges = []
      var edge_cols = []
      var edge_ids = []
      var edgeCount = 0
      var RES = 10
      var screenPos = vec3.create()
      var chunker = new GridChunker(voronoiBuffer, options)
      chunker.chunk(0,0,gridWidth,gridDepth, function(x,y,X,Y,col) {

        var id = [Math.round(col[0]/255*RES), Math.round(col[1]/255*RES), Math.round(col[2]/255*RES)]
        id = id[0] + id[1]*RES + id[2]*RES*RES

        if (id < agents.length) {
          vec3.transformMat4(screenPos, agents[id].pos, viewproj)
          var ax = 0.5*(screenPos[0]+1)*gridWidth
          var ay = 0.5*(screenPos[1]+1)*gridDepth
          vec3.transformMat4(screenPos, agents[id].goal, viewproj)
          var gx = 0.5*(screenPos[0]+1)*gridWidth
          var gy = 0.5*(screenPos[1]+1)*gridDepth
          
          chunker.filterRadius(x,X,y,Y,25,ax,ay, id, function(x,X,y,Y, id) {

            var evaluateWeight = function(a, b, x, z, y) {
              var r = Math.sqrt(gx*gx+gy*gy)
              var x2 = Math.pow(x,2)
              var z2 = Math.pow(z,2)
              var y2 = Math.pow(y,2)
              var x3 = Math.pow(x,3)
              var z3 = Math.pow(z,3)
              var y3 = Math.pow(y,3)
              var ax = Math.abs(x)
              var az = Math.abs(z)
              var ay = Math.abs(y)

              var mx = -(a*y3*Math.asinh(z/ay) - a*y3*Math.asinh(x/ay) - 2*a*z3*Math.asinh(y/az) + 2*a*x3*Math.asinh(y/ax) - 2*b*Math.pow(y2+z2, 3/2) - a*z*y*Math.sqrt(y2+z2) + 2*b*Math.pow(y2+x2, 3/2) + a*x*y*Math.sqrt(y2+x2) + (3*r*x2 - 3*r*z2)*y) / (6*r)
              var my = (2*b*y3*Math.asinh(z/ay) - 2*b*y3*Math.asinh(x/ay) - b*z3*Math.asinh(y/az) + b*x3*Math.asinh(y/ax) + 2*a*Math.pow(y2+z2, 3/2) + b*z*y*Math.sqrt(y2+z2) - 2*a*Math.pow(y2+x2, 3/2) - b*z*y*Math.sqrt(y2+x2) + (3*r*z - 3*r*x)*y2) / (6*r)
              var w = (b*y2*Math.asinh(z/ay) - b*y2*Math.asinh(x/ay) + a*z2*Math.asinh(y/az) - a*x2*Math.asinh(y/ax) + (a*y+b*z)*Math.sqrt(y2+z2) + (-a*y-b*x)*Math.sqrt(y2+x2) + (2*r*z-2*r*x)*y) / (2*r)

              return [mx, my, w]
            }

            var evaluateMarkerWeight = function(x, y) {
              var v1 = vec2.fromValues(x-ax, y-ay)
              var v2 = vec2.fromValues(gx-ax, gy-ay)
              vec2.normalize(v1,v1)
              vec2.normalize(v2,v2)
              return 1 + vec2.dot(v1,v2)
            }

            var w1 = evaluateMarkerWeight(x, y)
            var w2 = evaluateMarkerWeight(X, y)
            var w3 = evaluateMarkerWeight(x, Y)
            var w4 = evaluateMarkerWeight(X, Y)
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
            var nx = x / gridWidth * 2 - 1
            var nX = X / gridWidth * 2 - 1
            var ny = y / gridDepth * 2 - 1
            var nY = Y / gridDepth * 2 - 1
            edges.push.apply(edges,[
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
          //agents[id].blocks.push([])
          
          // var v1 = evaluateWeight(gx-ax, gy-ay, x-ax, X-ax, y-ay)
          // var v2 = evaluateWeight(gx-ax, gy-ay, x-ax, X-ax, Y-ay)

          // agents[id].blocks.push([ v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2] ])
        }
      })

      // edge_ids = [0,1,1,2]
      // edges = [-1,0,0,1, 0,-1,0,1, 1,1,0,1]
      // edge_cols = [1,0,0,1, 0,1,0,1, 0,0,1,1]

      // console.log(edge_cols)

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, edgeid)
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(edge_ids), GL.DYNAMIC_DRAW)

      GL.bindBuffer(GL.ARRAY_BUFFER, edgepos)
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(edges), GL.DYNAMIC_DRAW)

      GL.bindBuffer(GL.ARRAY_BUFFER, edgecol)
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(edge_cols), GL.DYNAMIC_DRAW)

      var bufferData = {
        positions: edgepos,
        colors: edgecol,
        indices: edgeid,
        drawMode: GL.LINES,
        count: edge_ids.length
      }
      GL.clear( GL.DEPTH_BUFFER_BIT)
      // GL.viewport(0,0,GL.viewportWidth, GL.viewportHeight)
      GL.viewport(gridWidth, 0, gridWidth, gridDepth)
      gl.PixelShader.draw(bufferData)

      for (var i = 0; i < agents.length; i++) {
        var totalW = 0
        var mvec = vec2.fromValues(0,0)

        for (var j = 0; j < agents[i].blocks.length; j++) {
          totalW += agents[i].blocks[j].weight
        }

        for (var j = 0; j < agents[i].blocks.length; j++) {
          if (isNaN(agents[i].blocks[j].pos[0])) {
            continue
          }
          vec2.scaleAndAdd(mvec, mvec, agents[i].blocks[j].pos, agents[i].blocks[j].weight / totalW)
        }

        screenPos = vec3.fromValues(2*mvec[0]/gridWidth, 2*mvec[1]/gridDepth, 0)
        vec3.transformMat4(screenPos, screenPos, invviewproj)
        screenPos[1] = 0

        agents[i].vel = screenPos
        // agents[i].acc = screenPos
        agents[i].forward = screenPos
      }

      for (var i = 0; i < agents.length; i++) {
        if (!agents[i].done) {   
          // vec3.scaleAndAdd(agents[i].vel, agents[i].vel, agents[i].acc, t)
          // var speed = vec3.length(agents[i].vel)
          // if (speed > 1.2) {
            // vec3.scale(agents[i].vel, agents[i].vel, 1.2/speed)
          // }
          var test = vec3.create()
          var r = vec3.create()
          var scale = 1


          vec3.scaleAndAdd(test, agents[i].pos, agents[i].vel, t*scale)
          vec3.normalize(r, agents[i].vel)
          vec3.scaleAndAdd(test, test, r, 0.5)
          vec3.transformMat4(test, test, viewproj)
          // console.log(test)
          var x = 0.5*(test[0]+1)*gridWidth
          var y = 0.5*(test[1]+1)*gridDepth
          var idx = 4*(parseInt(x) + parseInt(y) * gridWidth)
          var c = [voronoiBuffer[idx], voronoiBuffer[idx+1], voronoiBuffer[idx+2]]
          var id = [Math.round(c[0]/255*RES), Math.round(c[1]/255*RES), Math.round(c[2]/255*RES)]
          id = id[0] + id[1]*RES + id[2]*RES*RES
          
          if (id != i) {
            console.log(i, 'hit', id, 'at', x, y, c)
          } else {
            vec3.scaleAndAdd(agents[i].pos, agents[i].pos, agents[i].vel, t)

            if (vec3.distance(agents[i].pos, agents[i].goal) < 0.5) {
              agents[i].pos[0] = 1000000000
              agents[i].goal[0] = 100000000
            }
          }
        }

        var offset = agents[i].pos
        offsetArray[3*i] = offset[0]
        offsetArray[3*i+1] = offset[1]
        offsetArray[3*i+2] = offset[2]
      }

      GL.bindBuffer(GL.ARRAY_BUFFER, offsetBuffer)
      GL.bufferData(GL.ARRAY_BUFFER, offsetArray, GL.DYNAMIC_DRAW)


      /*var markerIndices = []
      var agentGrid = Grid()
      var markerGridCells = new Set()

      for (var i = 0; i < agents.length; i++) {
        if (!agents[i].done) {   
          agents[i].markers = []
          agentGrid.addItem(i, agents[i].pos[0], agents[i].pos[2]) 

          var cells = markerGrid.cellsInRadius(agents[i].pos, options.searchRadius)
          for (var j = 0; j < cells.length; j++) {
            markerGridCells.add(cells[j])
          }
        }
      }

      markerGridCells.forEach(function(cell) {
        markerIndices.push.apply(markerIndices, markerGrid.cells[cell].items)
      })

      for (var i = 0; i < markerIndices.length; i++) {
        var markerIdx = markerIndices[i]
        var agentIndices = []
        var cells = agentGrid.cellsInRadius(markers[markerIdx].pos, options.searchRadius)
        for (var j = 0; j < cells.length; j++) {
          agentIndices.push.apply(agentIndices, agentGrid.cells[cells[j]].items)
        }

        var closest = -1
        var bestWeight
        for (var j = 0; j < agentIndices.length; j++) {
          var agentIdx = agentIndices[j]
          var dist = vec3.distance(agents[agentIdx].pos, markers[markerIdx].pos)
          if (dist < options.searchRadius) {
            var markerVec = vec3.create()
            vec3.subtract(markerVec, markers[markerIdx].pos, agents[agentIdx].pos)
            vec3.normalize(markerVec, markerVec)

            var weight = 1/dist
            if (options.rightPreference) {
              weight *= (0.5 + 0.5*Math.abs(vec3.dot(agents[agentIdx].forward, markerVec)))
            }
            if (closest == -1 || weight > bestWeight) {
              bestWeight = weight
              closest = agentIdx
            } 
          }
        }
        if (closest != -1) {
          agents[closest].markers.push(markerIdx)
        }
      }

      for (var i = 0; i < agents.length; i++) {
        if (!agents[i].done) {   
          var totalWeight = 0
          
          for (var j = 0; j < agents[i].markers.length; j++) {
            var goalVec = vec3.create()
            var markerVec = vec3.create()

            vec3.subtract(goalVec, agents[i].goal, agents[i].pos)
            vec3.subtract(markerVec, markers[agents[i].markers[j]].pos, agents[i].pos)

            var weight = 1 + vec3.dot(goalVec, markerVec) / (vec3.length(goalVec) * vec3.length(markerVec))

            markers[agents[i].markers[j]].weight = weight
            totalWeight += weight

            if (vec3.length(goalVec) <= 0.5) {
              agents[i].done = true
            }
          }

          var motionVec = vec3.create()
          var markerVec = vec3.create()
          for (var j = 0; j < agents[i].markers.length; j++) {
            vec3.subtract(markerVec, markers[agents[i].markers[j]].pos, agents[i].pos)
            vec3.scaleAndAdd(motionVec, motionVec, markerVec, markers[agents[i].markers[j]].weight/totalWeight)
          }

          vec3.copy(agents[i].vel, motionVec)
          vec3.normalize(motionVec, motionVec)
          vec3.copy(agents[i].forward, motionVec)

          vec3.scaleAndAdd(agents[i].pos, agents[i].pos, agents[i].vel, t)
        }
      }*/

      // GL.bindFramebuffer(GL.FRAMEBUFFER, null)
      // GL.viewport(0, 0, GL.viewportWidth, GL.viewportHeight)
      // // GL.viewport(0, 0, gridWidth, gridDepth)
      // GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)
      // gl.VoronoiShader.setViewProj(viewproj)
      // gl.VoronoiShader.draw(Sprite, true)


    },

    getOptions: function() {
      return options
    }
  }
  return bioCrowds
}

module.exports = BioCrowds