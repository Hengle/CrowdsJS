'use strict'

var Color = require('onecolor') 

var RES = 10//Math.ceil(Math.pow(20, 0.3334))//10

var scene = {
  options: function() {
    return {
      rightPreference: true,
      markerDensity: 24
    }
  },

  agents: [],

  create: function() {
    scene.agents = []
    var PI = 3.14159256
    var R = 10
    var ID = 0;
    for (var a = 0; a < 2*PI; a += 2*PI/20) {
      var hue = a / (2*PI) * 360
      var col = Color('hsv(' + hue + ', 100, 100)')
      
      var idr = ID % RES
      var idg = Math.floor(ID / RES) % RES
      var idb = Math.floor(ID / (RES*RES))
      ++ID

      scene.agents.push({
        pos: vec3.fromValues(R * Math.cos(a), 0, R * Math.sin(a)),
        forward: vec3.fromValues(Math.cos(a + PI), 0, Math.sin(a + PI)),
        col: vec4.fromValues(col.red(),col.green(),col.blue(),1),
        vel: vec3.create(),
        goal: vec3.fromValues(R * Math.cos(a + PI), 0, R * Math.sin(a + PI)),
        id: vec3.fromValues(idr/RES,idg/RES,idb/RES)
      })
    }
  }

}

module.exports = scene