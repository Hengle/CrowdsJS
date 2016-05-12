'use strict'

var Sobol = require('../lib/sobol.js')
var sobol = new Sobol(2)
var Cube = require('../objects/cube.js')
var Cylinder = require('../objects/cylinder.js')
var Cone = require('../objects/cone.js')
var Triangle = require('../objects/triangle.js')
var Plane = require('../objects/plane.js')
var ShaderProgram = require('../shaderprogram.js')
var VoronoiGenerator = require('./programs/voronoi-generate')
var Projector = require('./projector')
var VelocityCalculator = require('./programs/velocity-calculate')
var VoronoiRefine = require('./programs/voronoi-refine')
var TexturedPlane = require('./objects/textured-plane')
var NoiseGenerator = require('./programs/noise-generator')
var Obstacle = require('./objects/obstacle')
var BlurCalculator = require('./programs/blur-calculate')
var WeightCalculator = require('./programs/weight-calculate')
var AgentData = require('./programs/agent-data')
var Deque = require('double-ended-queue')
var ProximityCalulator = require('./programs/proximity-calculate')
var ReachabilityGradient = require('./programs/reachability-gradient')

var defaultOptions = {
  originX: -16,
  originZ: -16,
  sizeX: 32,
  sizeZ: 32,
  gridSize: 0.125,
  searchRadius: 2
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
  var obstacles = []
  var drawables = []

  var projector
  var voronoiGenerator
  var velocityCalculator
  var voronoiRefine
  var groundPlane
  var groundPlaneObj
  var comfortTex
  var blurCalculator
  var obstacleTex
  var weightCalculator
  var agentData
  var robberProximity
  var copReachability
  var copData
  var numCops = 0

  var frameNum = 0

  var bioCrowds = {
    init: function() {
      var GL = gl.getGL()
      var noiseGenerator = new NoiseGenerator()
      projector = new Projector(options)
      voronoiGenerator = new VoronoiGenerator(options)
      velocityCalculator = new VelocityCalculator(options)
      voronoiRefine = new VoronoiRefine(options)
      blurCalculator = new BlurCalculator(options)
      weightCalculator = new WeightCalculator(options)
      agentData = new AgentData(options, function(agent) {return true})
      copData = new AgentData(options, function(agent) {
        return agent.type == 'COP'
      })
      robberProximity = new ProximityCalulator(options, function(agent) {
        return agent.type == 'ROBBER'
      })
      copReachability = new ReachabilityGradient(options)

      blurCalculator.set(10)
      obstacleTex = require('../gl').makeTexture(options.gridWidth, options.gridDepth)
      // console.log(gl)
      //comfortTex = noiseGenerator.generate(options.gridWidth, options.gridDepth, 3)

      if (options.comfortTexture) {
        comfortTex = require('../gl').loadImageTexture(options.comfortTexture)
      }

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
        groundPlaneObj.setTexture(weightCalculator.tex)
      } else if (options.vis.groundPlane == 'comfort') {
        groundPlaneObj.setTexture(comfortTex)
      } else if (options.vis.groundPlane == 'robber-proximity') {
        groundPlaneObj.setTexture(robberProximity.tex)
      } else if (options.vis.groundPlane == 'cop-gradient') {
        groundPlaneObj.setTexture(copReachability.tex)
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
          }
        }
      }

      var trailSize = 100
      for (var i = 0; i < agents.length; i++) {
        agents[i].done = false
        agents[i].markers = []
        agents[i].trail = new Deque(trailSize)
        for (var j = 0; j < trailSize; j++) {
          agents[i].trail.push(agents[i].pos)
        }
        if (agents[i].type == 'COP') {
          numCops += 1
        }

        var agent = agentPainter(i)
        gl.drawables.push(agent)
        drawables.push(agent)
      }

      agentData.init(agents, projector)
      if (numCops > 0) {
        copData.init(agents, projector)
      }
      weightCalculator.init(agents, comfortTex)
      velocityCalculator.init(projector)
      voronoiGenerator.initAgentBuffers(agents)
      robberProximity.initAgentBuffers(agents)
    },

    initObstacles: function(theobstacles) {
      if (!theobstacles) return
      obstacles = theobstacles
      var iden = mat4.create()
      var col = vec4.fromValues(0.2, 0.2, 0.2, 1)

      var obstacleDrawable = function(idx) {
        var obj = obstacles[idx].obj.get()
        return {
          draw: function() {
            gl.Lambert.setColor(col)
            gl.Lambert.setModelMat(iden)
            gl.Lambert.draw(obj)
          }
        }
      }

      for (var i = 0; i < obstacles.length; i++) {
        obstacles[i].obj = new Obstacle(obstacles[i].points)
        var obj = obstacleDrawable(i)
        gl.drawables.push(obj)
        drawables.push(obj)
      }
    },

    step: function(t) {
      frameNum += 1
      var GL = gl.getGL()

      agentData.draw()
      if (numCops > 0) copData.draw()

      voronoiGenerator.setViewProj(projector.viewproj)
      robberProximity.setViewProj(projector.viewproj)

      GL.viewport(0, 0, options.gridWidth, options.gridDepth)

      GL.bindFramebuffer(GL.FRAMEBUFFER, voronoiGenerator.fbo)
      GL.clear( GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)
      voronoiGenerator.draw()

      gl.Lambert.setViewProj(projector.viewproj)
      gl.Lambert.setColor(vec4.fromValues(1,1,1,1))
      gl.Lambert.setModelMat(mat4.create())
      for (var i = 0; i < obstacles.length; i++) {
        gl.Lambert.draw(obstacles[i].obj.get())
      }

      GL.bindFramebuffer(GL.FRAMEBUFFER, obstacleTex.fbo)
      GL.clear(GL.DEPTH_BUFFER_BIT)
      gl.Lambert.setViewProj(projector.viewproj)
      gl.Lambert.setColor(vec4.fromValues(1,1,1,1))
      gl.Lambert.setModelMat(mat4.create())
      for (var i = 0; i < obstacles.length; i++) {
        gl.Lambert.draw(obstacles[i].obj.get())
      }

      GL.bindFramebuffer(GL.FRAMEBUFFER, voronoiRefine.fbo)
      voronoiRefine.draw(voronoiGenerator.tex)

      GL.bindFramebuffer(GL.FRAMEBUFFER, weightCalculator.fbo)
      weightCalculator.draw(voronoiRefine.tex, agentData.tex)

      velocityCalculator.draw(
        voronoiRefine.tex,
        weightCalculator.tex, agentData, agents.length)

      GL.bindFramebuffer(GL.FRAMEBUFFER, null)
      
      GL.viewport(0, 0, 150, 150)
      voronoiGenerator.draw()
      
      GL.viewport(150, 0, 150, 150)
      voronoiRefine.draw(voronoiGenerator.tex)

      GL.viewport(300, 0, 150, 150)
      weightCalculator.draw(voronoiRefine.tex, agentData.tex)

      GL.viewport(0, 150, 150, 150)
      robberProximity.draw()

      GL.viewport(0, 0, options.gridWidth, options.gridDepth)

      GL.bindFramebuffer(GL.FRAMEBUFFER, robberProximity.fbo)
      GL.clear( GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)
      robberProximity.draw()

      GL.bindFramebuffer(GL.FRAMEBUFFER, copReachability.fbo)
      if (numCops > 0) {
        copReachability.draw(copData, obstacleTex.tex)
      }

      var samplePos = []

      for (var i = 1; i < 5; i ++) { 
        var d = Math.pow(2, i);
        samplePos.push(vec3.fromValues(-d, 0, 0))
        samplePos.push(vec3.fromValues(d, 0, 0))
        samplePos.push(vec3.fromValues(0, 0, -d))
        samplePos.push(vec3.fromValues(0, 0, d))
        samplePos.push(vec3.fromValues(-d, 0, -d))
        samplePos.push(vec3.fromValues(d, 0, -d))
        samplePos.push(vec3.fromValues(-d, 0, d))
        samplePos.push(vec3.fromValues(d, 0, d))
      }

      var projected = vec3.create()
      var velDir = vec3.create()
      for (var i = 0; i < agents.length; i++) {
        if (agents[i].finished) continue
        vec3.transformMat4(projected, agents[i].pos, projector.viewproj)
        var u = 0.5*(projected[0]+1)
        var v = 0.5*(projected[1]+1)

        var vel = velocityCalculator.getVelocityAt(u, v)
        
        if (isNaN(vel[0]) || isNaN(vel[2])) {
          continue
        }

        vec3.normalize(velDir, vel)

        if (vec3.length(vel) > 0) {
          vec3.lerp(agents[i].forward, agents[i].forward, velDir, Math.min(0.75,t/0.1));
          vec3.copy(agents[i].vel, vel)
          if (agents[i].inactive) {
            continue
          }
          vec3.scaleAndAdd(agents[i].pos, agents[i].pos, agents[i].vel, t)
        }
        agents[i].trail.unshift(agents[i].pos)
        agents[i].trail.pop()

        if (frameNum / 10 == parseInt(frameNum / 10) && agents[i].type == 'ROBBER') {
          var test = vec3.create()
          var best
          var bestWt = false
          for (var j = 0; j < samplePos.length; j++) {
            vec3.add(test, samplePos[j], agents[i].pos)
            vec3.transformMat4(projected, test, projector.viewproj)
            u = 0.5*(projected[0]+1)
            v = 0.5*(projected[1]+1)
            if (u <= 0.01 || v <= 0.01 || u >= 0.99 || v >= 0.99) continue
            var wt = copReachability.getValueAt(u, v)
            if (wt == 1) continue
            if (!bestWt || wt > bestWt) {
              bestWt = wt
              best = samplePos[j]
            }
          }
          if (bestWt) {
            vec3.add(test, best, agents[i].pos)
            vec3.copy(agents[i].goal, test)
          }
        }
        
        // console.log(best)
        // var samples = [
        //   copReachability.getValueAt(u,v),
        //   copReachability.getValueAt(u,v),
        //   copReachability.getValueAt(u,v),
        //   copReachability.getValueAt(u,v),
        //   copReachability.getValueAt(u,v),
        //   copReachability.getValueAt(u,v),
        //   copReachability.getValueAt(u,v),
        //   copReachability.getValueAt(u,v)
        // ]
        
        var nearestID
        if (agents[i].type == 'COP') {
          vec3.transformMat4(projected, agents[i].pos, projector.viewproj)
          var u = 0.5*(projected[0]+1)
          var v = 0.5*(projected[1]+1)
          nearestID = robberProximity.getNearest(u, v)
          if (agents[nearestID]) {
            agents[i].inactive = false
            vec3.lerp(agents[i].goal, agents[i].goal, agents[nearestID].pos, 0.2)
          } else {
            agents[i].inactive = true
          }
        }
        
        if (vec3.distance(agents[i].pos, agents[i].goal) < 0.5) {
          

          if (agents[i].type == 'COP') {
            if (agents[nearestID]) {
              agents[nearestID].finished = true
            }
          } else if (agents[i].type == 'ROBBER') {
            
          } else {
            agents[i].finished = true
          }
        }
      }
      
      voronoiGenerator.updateBuffers()
      robberProximity.updateBuffers()
    },

    getOptions: function() {
      return options
    }
  }
  return bioCrowds
}

module.exports = BioCrowds