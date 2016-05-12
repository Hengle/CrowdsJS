//#gljs varname: 'voronoi_refine_fragment_shader_src' 

precision highp float;
uniform sampler2D u_image;
uniform vec2 windowSize;
uniform float u_gScale;
varying vec2 fs_uv;
const int R = 1337;

void main(void) {
  vec4 col = texture2D(u_image, fs_uv);
  gl_FragColor = col;
  for (int i = -R; i < R; i++) {
    for (int j = -R; j < R; j++) {

      vec2 uv = fs_uv + vec2(i, j) / windowSize;

      // vec2 dir = uv - fs_uv;
      // float dist = length(dir);
      // dir = normalize(dir);

      // for (int d = 0; d < R; d++) {
      //   vec2 r_uv = fs_uv + ( float(d) / max(windowSize.x, windowSize.y) )*dir;

      //   vec4 col2 = texture2D(u_image, r_uv);
      //   if (col != col2) {
      //     gl_FragColor = vec4(1,1,1,1);
      //     return;
      //   }
      // }

      // for (float d = 0.0; d < float(R) / max(windowSize.x, windowSize.y); d += 1.0/min(windowSize.x, windowSize.y)) {
      //   if (d < dist) {
      //     vec2 r_uv = uv + d*dir;

      //     vec4 col2 = texture2D(u_image, r_uv);
      //     if (col != col2) {
      //       gl_FragColor = vec4(1,1,1,1);
      //       return;
      //     }
      //   }
      // }

      vec4 col2 = texture2D(u_image, uv);
      if (col != col2) {
        gl_FragColor = vec4(1,1,1,1);
        return;
      }
    }
  }
}