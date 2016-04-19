'use strict'

var Sobol = require('../lib/sobol.js')
var sobol = new Sobol(2)
var Cube = require('../objects/cube.js')
var Cylinder = require('../objects/cylinder.js')
var Cone = require('../objects/cone.js')
var Triangle = require('../objects/triangle.js')
var Plane = require('../objects/plane.js')
var ShaderProgram = require('../shaderprogram.js')
var BlockGenerator = require('./block-generate')
var VoronoiGenerator = require('./voronoi-generate')
var Projector = require('./projector')
var VelocityCalculator = require('./velocity-calculate')
var VoronoiRefine = require('./voronoi-refine')

var defaultOptions = {
  originX: -16,
  originZ: -16,
  sizeX: 32,
  sizeZ: 32,
  markerDensity: 10,
  // gridSize: 0.0625,
  gridSize: 0.125,
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
  options.gridWidth = gridWidth
  options.gridDepth = gridDepth

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

  var voronoiBuffer = new Uint8Array(options.gridWidth*options.gridDepth*4)

  var projector
  var blockGenerator
  var voronoiGenerator
  var velocityCalculator
  var voronoiRefine
  var voronoi_texture
  var voronoi_fbo
  var velocity_fbo

  var bioCrowds = {
    init: function() {
      markerGrid = Grid()

      var GL = gl.getGL()
      projector = new Projector(options)
      blockGenerator = new BlockGenerator(GL, projector, options)
      voronoiGenerator = new VoronoiGenerator(GL, projector, options)
      velocityCalculator = new VelocityCalculator(options)
      voronoiRefine = new VoronoiRefine(options)

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

      voronoi_texture = GL.createTexture()
      GL.bindTexture(GL.TEXTURE_2D, voronoi_texture)
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST)
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST)

      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, options.gridWidth, options.gridDepth, 0, GL.RGBA, GL.UNSIGNED_BYTE, null)

      voronoi_fbo = GL.createFramebuffer()
      GL.bindFramebuffer(GL.FRAMEBUFFER, voronoi_fbo)

      GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, voronoi_texture, 0)

      var renderbuffer = GL.createRenderbuffer();
      GL.bindRenderbuffer(GL.RENDERBUFFER, renderbuffer);
      GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, options.gridWidth, options.gridDepth)

      GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, voronoi_texture, 0)
      GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, renderbuffer)

      // ---------------------------------------------------------

      var velocity_texture = GL.createTexture()

      GL.bindTexture(GL.TEXTURE_2D, velocity_texture)
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST)
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST)

      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, options.gridWidth, options.gridDepth, 0, GL.RGBA, GL.UNSIGNED_BYTE, null)

      velocity_fbo = GL.createFramebuffer()
      GL.bindFramebuffer(GL.FRAMEBUFFER, velocity_fbo)

      GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, velocity_texture, 0)

      renderbuffer = GL.createRenderbuffer();
      GL.bindRenderbuffer(GL.RENDERBUFFER, renderbuffer);
      GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, options.gridWidth, options.gridDepth)

      GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, velocity_texture, 0)
      GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, renderbuffer)

      // ------------------------------------------------------------------------------------

      GL.bindTexture(GL.TEXTURE_2D, null)
      GL.bindRenderbuffer(GL.RENDERBUFFER, null)
      GL.bindFramebuffer(GL.FRAMEBUFFER, null)

      // bioCrowds.setupMarkerBuffers()
    },

    deinit: function() {
      for (var i = 0; i < drawables.length; i++) {
        var idx =gl.drawables.indexOf(drawables[i])
        gl.drawables.splice(idx, 1)
      }
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
            if (agents[idx].finished) return
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
      velocityCalculator.init(agents, projector)
      voronoiGenerator.initAgentBuffers(agents)
    },

    step: function(t) {
      var GL = gl.getGL()

      gl.VoronoiShader.setViewProj(projector.viewproj)

      GL.bindFramebuffer(GL.FRAMEBUFFER, voronoi_fbo)
      GL.viewport(0, 0, options.gridWidth, options.gridDepth)
      GL.clear( GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)
      gl.VoronoiShader.draw(voronoiGenerator.buffer(), true)

      GL.bindFramebuffer(GL.FRAMEBUFFER, null)
      GL.viewport(0, 0, 150, 150)
      GL.clear( GL.DEPTH_BUFFER_BIT )
      gl.VoronoiShader.draw(voronoiGenerator.buffer(), true)

      GL.bindFramebuffer(GL.FRAMEBUFFER, voronoiRefine.fbo)
      GL.viewport(0, 0, options.gridWidth, options.gridDepth)
      voronoiRefine.draw(voronoi_texture)
      GL.bindFramebuffer(GL.FRAMEBUFFER, null)
      GL.viewport(150, 0, 150, 150)
      voronoiRefine.draw(voronoi_texture)

      velocityCalculator.setupDraw(agents, projector.viewproj, voronoiRefine.tex)
      GL.viewport(300, 0, 150, 150)
      velocityCalculator.drawWeights()

      GL.viewport(options.gridWidth, 0, options.gridWidth, options.gridDepth)
      GL.viewport(0, 0, options.gridWidth, options.gridDepth)
      velocityCalculator.draw()

      var projected = vec3.create()
      for (var i = 0; i < agents.length; i++) {
        if (agents[i].finished) continue
        vec3.transformMat4(projected, agents[i].pos, projector.viewproj)
        var u = 0.5*(projected[0]+1)
        var v = 0.5*(projected[1]+1)

        var vel = velocityCalculator.getVelocityAt(u, v)
        if (vec3.length(vel) > 0) {
          vec3.lerp(agents[i].forward, agents[i].forward, vel, vec3.length(vel)/8);
          // vec3.copy(agents[i].forward, vel)
        }
        vec3.copy(agents[i].vel, vel)
        vec3.scaleAndAdd(agents[i].pos, agents[i].pos, agents[i].vel, t)

        if (vec3.distance(agents[i].pos, agents[i].goal) < 0.5) {
          agents[i].finished = true;
        }
      }
      
      velocityCalculator.teardown()
      voronoiGenerator.updateBuffers()
    },

    getOptions: function() {
      return options
    }
  }
  return bioCrowds
}

module.exports = BioCrowds