//#gljs varname: 'blur_fragment_shader_src' 

precision highp float;
uniform sampler2D u_image;
uniform vec2 windowSize;
varying vec2 fs_uv;
const int R = 1337;

void main(void) {
  vec4 col = vec4(0,0,0,0);
  int count = 0;
  for (int i = -R; i <= R; i++) {
    for (int j = -R; j <= R; j++) {
      vec2 uv = fs_uv + vec2(i, j) / windowSize;
      if (length(fs_uv * windowSize - uv * windowSize) < float(R) ) {
        col += texture2D(u_image, uv);
        count += 1;
      }
    }
  }
  gl_FragColor = col / float(count);
}