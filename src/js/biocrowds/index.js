'use strict'

var Sobol = require('../lib/sobol.js')
var sobol = new Sobol(2)
var Cube = require('../objects/cube.js')
var Cylinder = require('../objects/cylinder.js')
var Triangle = require('../objects/triangle.js')
var Plane = require('../objects/plane.js')
var ShaderProgram = require('../shaderprogram.js')

var defaultOptions = {
  originX: -15,
  originZ: -15,
  sizeX: 30,
  sizeZ: 30,
  markerDensity: 10,
  gridSize: 1,
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

  var Grid = function() {
    var gridWidth = Math.ceil(options.sizeX / options.gridSize)
    var gridDepth = Math.ceil(options.sizeZ / options.gridSize)

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

  var bioCrowds = {
    init: function() {
      markerGrid = Grid()

      var numMarkers = options.sizeX*options.sizeZ*options.markerDensity
      for (var i = 0; i < numMarkers; i++) {
        var vec = sobol.nextVector()
        vec = [vec[0]*options.sizeX+options.originX, vec[1]*options.sizeZ+options.originZ]
        var marker = Marker(vec[0], vec[1])
        markerGrid.addItem(i, vec[0], vec[1])
        markers.push(marker)
      }  

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

      bioCrowds.setupMarkerBuffers()
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

      for (var i = 0; i < agents.length; i++) {
        agents[i].done = false
        agents[i].markers = []

        var agent = agentPainter(i)
        gl.drawables.push(agent)
        drawables.push(agent)
      }
    },

    step: function(t) {
      console.log(options)
      var markerIndices = []
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

            if (vec3.length(goalVec) <= 0.1) {
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
      }
    },

    getOptions: function() {
      return options
    }
  }
  return bioCrowds
}

module.exports = BioCrowds