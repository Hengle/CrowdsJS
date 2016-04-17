'use strict'

var Color = require('onecolor') 

var RES = 10

var scene = {
  options: function() {
    return {
      rightPreference: true,
      searchRadius: 2,
      originX: -16,
      originZ: -16,
      sizeX: 32,
      sizeZ: 32,
      markerDensity: 24
    }
  },

  agents: [],

  create: function() {
    var ID = 0;
    scene.agents = []



    for (var i = -7.5; i < 7.5; i+=1.5) {
      var idr = ID % RES
      var idg = Math.floor(ID / RES) % RES
      var idb = Math.floor(ID / (RES*RES))
      ++ID

      scene.agents.push({
        pos: vec3.fromValues(i, 0, -10),
        forward: vec3.fromValues(0,0,1),
        col: vec4.fromValues(1,0,0,1),
        vel: vec3.create(),
        goal: vec3.fromValues(0, 0, 10),
        id: vec3.fromValues(idr/RES,idg/RES,idb/RES)
      })

      idr = ID % RES
      idg = Math.floor(ID / RES) % RES
      idb = Math.floor(ID / (RES*RES))
      ++ID

      scene.agents.push({
        pos: vec3.fromValues(i, 0, -8),
        forward: vec3.fromValues(0,0,1),
        col: vec4.fromValues(1,0,0,1),
        vel: vec3.create(),
        goal: vec3.fromValues(0, 0, 10),
        id: vec3.fromValues(idr/RES,idg/RES,idb/RES)
      })

      idr = ID % RES
      idg = Math.floor(ID / RES) % RES
      idb = Math.floor(ID / (RES*RES))
      ++ID

      scene.agents.push({
        pos: vec3.fromValues(i, 0, 10),
        forward: vec3.fromValues(0,0,-1),
        col: vec4.fromValues(0,0,1,1),
        vel: vec3.create(),
        goal: vec3.fromValues(0, 0, -10),
        id: vec3.fromValues(idr/RES,idg/RES,idb/RES)
      })

      idr = ID % RES
      idg = Math.floor(ID / RES) % RES
      idb = Math.floor(ID / (RES*RES))
      ++ID

      scene.agents.push({
        pos: vec3.fromValues(i, 0, 8),
        forward: vec3.fromValues(0,0,-1),
        col: vec4.fromValues(0,0,1,1),
        vel: vec3.create(),
        goal: vec3.fromValues(0, 0, -10),
        id: vec3.fromValues(idr/RES,idg/RES,idb/RES)
      })
      
    }
  }
}

module.exports = scene