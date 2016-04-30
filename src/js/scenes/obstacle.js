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

    for (var i = -15; i < 15; i+=1) {
      for (var j = 12; j < 16; j+=2) {

      
        var idr = ID % RES
        var idg = Math.floor(ID / RES) % RES
        var idb = Math.floor(ID / (RES*RES))
        ++ID

        scene.agents.push({
          pos: vec3.fromValues(i, 0, -j),
          forward: vec3.fromValues(0,0,1),
          col: vec4.fromValues(1,0,0,1),
          vel: vec3.create(),
          goal: vec3.fromValues(i, 0, 10),
          id: vec3.fromValues(idr/RES,idg/RES,idb/RES)
        })

        idr = ID % RES
        idg = Math.floor(ID / RES) % RES
        idb = Math.floor(ID / (RES*RES))
        ++ID

        scene.agents.push({
          pos: vec3.fromValues(i, 0, j),
          forward: vec3.fromValues(0,0,-1),
          col: vec4.fromValues(0,0,1,1),
          vel: vec3.create(),
          goal: vec3.fromValues(i, 0, -10),
          id: vec3.fromValues(idr/RES,idg/RES,idb/RES)
        })

      }      
    }

    /*scene.obstacles.push({
      points: [
        [-4 - 2, -4 + 2],
        [-4 - 2, 4 + 2],
        [4 - 2, 4 + 2],
        // [4,-4]        
      ]
    })

    scene.obstacles.push({
      points: [
        [-4 + 2, -4 - 2],
        // [-4,4],
        [4 + 2, 4 - 2],
        [4 + 2, -4 - 2]        
      ]
    })*/

    scene.obstacles.push({
      // points: [
      //   [-1,-1],
      //   [-1,1],
      //   [1,1],
      //   [1,-1]
      // ]
      points: [
        [0,3],
        [-3,0],
        [0,-3],
        [3,0]
      ]
    })
  }
}

module.exports = scene