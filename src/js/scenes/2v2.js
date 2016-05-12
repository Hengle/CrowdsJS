'use strict'

var Color = require('onecolor') 

var RES = 10

var scene = {
  options: function() {
    return {
      originX: -16,
      originZ: -16,
      sizeX: 32,
      sizeZ: 32,
      gridSize: 0.125,
    }
  },

  agents: [],

  create: function() {
    var ID = 0;
    scene.agents = []
    scene.obstacles = []

    var makeRobber = function(x, z) {
      var idr = ID % RES
      var idg = Math.floor(ID / RES) % RES
      var idb = Math.floor(ID / (RES*RES))
      ++ID

      scene.agents.push({
        pos: vec3.fromValues(x, 0, z),
        forward: vec3.fromValues(0,0,1),
        col: vec4.fromValues(1,0,0,1),
        vel: vec3.create(),
        goal: vec3.fromValues(x, 0, z),
        id: vec3.fromValues(idr/RES,idg/RES,idb/RES),
        type: 'ROBBER'
      })
    }

    var makeCop = function(x, z) {
      var idr = ID % RES
      var idg = Math.floor(ID / RES) % RES
      var idb = Math.floor(ID / (RES*RES))
      ++ID

      scene.agents.push({
        pos: vec3.fromValues(x, 0, z),
        forward: vec3.fromValues(0,0,1),
        col: vec4.fromValues(0,0,1,1),
        vel: vec3.create(),
        goal: vec3.fromValues(x, 0, z),
        id: vec3.fromValues(idr/RES,idg/RES,idb/RES),
        type: 'COP'
      })
    }

    makeRobber(5, 5)
    makeRobber(5, -5)

    makeCop(-5, 5)
    makeCop(-5, -5)

    /*for (var i = -10; i < 10; i+=1) {
      var idr = ID % RES
      var idg = Math.floor(ID / RES) % RES
      var idb = Math.floor(ID / (RES*RES))
      ++ID

      scene.agents.push({
        pos: vec3.fromValues(i, 0, 15),
        forward: vec3.fromValues(0,0,-1),
        col: vec4.fromValues(0,0,1,1),
        vel: vec3.create(),
        goal: vec3.fromValues(i, 0, -15),
        id: vec3.fromValues(idr/RES,idg/RES,idb/RES),
        type: 'COP'
      })
    }*/
/*
    scene.obstacles.push({
      points: [
        [2+0,4+8],
        [2+10,8+0],
        [2+0,4+-8]
        // [5+3,0]
      ]
    })
    scene.obstacles.push({
      points: [
        [-2+0,-4+8],
        // [-5+-3,0],
        [-2+0,-4+-8],
        [-2-10,-8+0]
      ]
    })*/
  }
}

module.exports = scene