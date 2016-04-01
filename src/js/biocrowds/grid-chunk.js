'use strict'

module.exports = function(thebuffer, theoptions) {
  var buffer = thebuffer
  var options = theoptions

  var indexOf = function(x, y) {
    return 4*(x + y * options.sizeX/options.gridSize)
  }

  var colEq = function(c1, c2) {
    return c1[0] == c2[0] && c1[1] == c2[1] && c1[2] == c2[2]
  }

  var chunkGrid = function(x, y, X, Y, cb) {
    if (X-x <= 1 && Y-y <= 1) return

    var i1 = indexOf(x,y)
    var i2 = indexOf(X-1,y)
    var i3 = indexOf(x,Y-1)
    var i4 = indexOf(X-1,Y-1)

    var c1 = [buffer[i1], buffer[i1+1], buffer[i1+2]]
    var c2 = [buffer[i2], buffer[i2+1], buffer[i2+2]]
    var c3 = [buffer[i3], buffer[i3+1], buffer[i3+2]]
    var c4 = [buffer[i4], buffer[i4+1], buffer[i4+2]]

    var xm = Math.floor((x+X)/2)
    var ym = Math.floor((y+Y)/2)

    // console.log(c1,c2,c3,c4)
    // console.log(x,X,y,Y)

    if (colEq(c1,c2) && colEq(c3,c4) && colEq(c1,c3)) {
      // all same
      cb(x, y, X, Y, c1)
    } else if (colEq(c1,c2) && colEq(c3,c4) && !colEq(c1,c3)) {
      // only vertical split
      chunkGrid(x, y, X, ym, cb)
      chunkGrid(x, ym, X, Y, cb)
    } else if (colEq(c1,c3) && colEq(c2,c4) && !colEq(c1,c2)) {
      // only horizontal split
      chunkGrid(x, y, xm, Y, cb)
      chunkGrid(xm, y, X, Y, cb)
    } else if (colEq(c1,c2) && (!colEq(c1,c3) || !colEq(c2,c4))) {
      // vertical split, split top horizontally
      chunkGrid(x, y, X, ym, cb)
      chunkGrid(x, ym, xm, Y, cb)
      chunkGrid(xm, ym, X, Y, cb)
    } else if (colEq(c3,c4) && (!colEq(c1,c3) || !colEq(c2,c4))) {
      // vertical split, split bottom horizontally
      chunkGrid(x, y, xm, ym, cb)
      chunkGrid(xm, y, X, ym, cb)
      chunkGrid(x, ym, X, Y, cb)
    } else if (colEq(c1,c3) && (!colEq(c1,c2) || !colEq(c3,c4))) {
      // horizontal split, split right vertically
      chunkGrid(x, y, xm, Y, cb)
      chunkGrid(xm, y, X, ym, cb)
      chunkGrid(xm, ym, X, Y, cb)
    } else if (colEq(c2,c4) && (!colEq(c1,c2) || !colEq(c3,c4))) {
      // horizontal split, split left vertically
      chunkGrid(x, y, xm, ym, cb)
      chunkGrid(x, ym, xm, Y, cb)
      chunkGrid(xm, y, X, Y, cb)
    } else {
      // split all
      chunkGrid(x, y, xm, ym, cb)
      chunkGrid(x, ym, xm, Y, cb)
      chunkGrid(xm, y, X, ym, cb)
      chunkGrid(xm, ym, X, Y, cb)
    }
  }

  this.chunk = function(x, y, w, h, cb) {
    chunkGrid(x, y, w, h, cb)
  }

  this.filterRadius = function(x, X, y, Y, r, px, py, id, cb) {
    if (X-x <= 1 && Y-y <= 1) return
    var point = vec2.fromValues(px, py)
    var ll = vec2.dist(vec2.fromValues(x, y), point) < r
    var lr = vec2.dist(vec2.fromValues(X, y), point) < r
    var ul = vec2.dist(vec2.fromValues(x, Y), point) < r
    var ur = vec2.dist(vec2.fromValues(X, Y), point) < r

    var xm = Math.floor((x+X)/2)
    var ym = Math.floor((y+Y)/2)

    if (x > px+r || X < px-r || y > py+r || Y < py-r) {
      return
    } else if (ll && lr && ul && ur) {
      return cb(x,X,y,Y, id)
    } else {
      this.filterRadius(xm,X,ym,Y,r,px,py,id,cb)
      this.filterRadius(x,xm,y,ym,r,px,py,id,cb)
      this.filterRadius(xm,X,y,ym,r,px,py,id,cb)
      this.filterRadius(x,xm,ym,Y,r,px,py,id,cb)
    }
  }
}