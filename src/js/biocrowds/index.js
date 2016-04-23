'use strict'

var Sobol = require('../lib/sobol.js')
var sobol = new Sobol(2)
var Cube = require('../objects/cube.js')
var Cylinder = require('../objects/cylinder.js')
var Cone = require('../objects/cone.js')
var Triangle = require('../objects/triangle.js')
var Plane = require('../objects/plane.js')
var ShaderProgram = require('../shaderprogram.js')
var VoronoiGenerator = require('./voronoi-generate')
var Projector = require('./projector')
var VelocityCalculator = require('./velocity-calculate')
var VoronoiRefine = require('./voronoi-refine')
var TexturedPlane = require('./textured-plane')

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

  var gridWidth = Math.ceil(options.sizeX / options.gridSize)
  var gridDepth = Math.ceil(options.sizeZ / options.gridSize)
  options.gridWidth = gridWidth
  options.gridDepth = gridDepth

  var agents= []
  var drawables = []

  var projector
  var voronoiGenerator
  var velocityCalculator
  var voronoiRefine
  var groundPlane
  var groundPlaneObj

  var bioCrowds = {
    init: function() {
      var GL = gl.getGL()
      projector = new Projector(options)
      voronoiGenerator = new VoronoiGenerator(options)
      velocityCalculator = new VelocityCalculator(options)
      voronoiRefine = new VoronoiRefine(options)

      var planeTrans = mat4.create()
      mat4.scale(planeTrans, planeTrans, vec3.fromValues(options.sizeX, 1, options.sizeZ))
      var planeCol = vec4.fromValues(0.8,0.8,0.8,1)

      groundPlaneObj = new TexturedPlane(options)
      var groundPlane = {
        draw: function() {
          groundPlaneObj.setViewProj(gl.viewProj)
          groundPlaneObj.setModelMat(planeTrans)
          groundPlaneObj.draw()
        }
      }
      gl.drawables.push(groundPlane)
      drawables.push(groundPlane)

      this.applyOptions()
    },

    applyOptions: function() {
      if (!options.vis.groundPlane) {
        groundPlaneObj.setTexture(null)  
      } else if (options.vis.groundPlane == 'voronoi') {
        groundPlaneObj.setTexture(voronoiGenerator.tex)
      } else if (options.vis.groundPlane == 'voronoi-refine') {
        groundPlaneObj.setTexture(voronoiRefine.tex)
      } else if (options.vis.groundPlane == 'weights') {
        groundPlaneObj.setTexture(velocityCalculator.tex)
      }
      voronoiGenerator.initAgentBuffers(agents)
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

      voronoiGenerator.setViewProj(projector.viewproj)

      GL.bindFramebuffer(GL.FRAMEBUFFER, voronoiGenerator.fbo)
      GL.viewport(0, 0, options.gridWidth, options.gridDepth)
      GL.clear( GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)
      voronoiGenerator.draw()

      GL.bindFramebuffer(GL.FRAMEBUFFER, null)
      GL.viewport(0, 0, 150, 150)
      GL.clear( GL.DEPTH_BUFFER_BIT )
      voronoiGenerator.draw()

      GL.bindFramebuffer(GL.FRAMEBUFFER, voronoiRefine.fbo)
      GL.viewport(0, 0, options.gridWidth, options.gridDepth)
      voronoiRefine.draw(voronoiGenerator.tex)

      GL.bindFramebuffer(GL.FRAMEBUFFER, null)
      GL.viewport(150, 0, 150, 150)
      voronoiRefine.draw(voronoiGenerator.tex)

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