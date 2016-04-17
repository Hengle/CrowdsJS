module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      dist: {
        files: {
          'js/bundle.js': 'src/js/**/*.js'
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'js/bundle.min.js': 'js/bundle.js'
        }
      }
    },
    watch: {
      scripts: {
        files: ['src/js/**/*.js'],
        tasks: ['browserify', 'notify:browserify'],
        options: {
          spawn: false,
        },
      },
      shaders: {
        files: ['src/shaders/**/*.glsl'],
        tasks: ['glsl', 'notify:glsl'],
        options: {
          spawn: false,
        },
      }
    },
    notify: {
      options: {
        enabled: true,
        title: "CrowdsJS",
        success: true,
        duration: 3
      },
      browserify: {
        options: {
          message: "Built bundle.js"
        }
      },
      glsl: {
        options: {
          message: "Shader compilation done"
        }
      },
      uglify: {
        options: {
          message: "Minification complete"
        }
      }
    },
    glsl: {
      dist: {
        options: {
          oneString: false
        },
        files: {
          'js/shaders.js': [ 'src/shaders/*.glsl' ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-glsl');
  grunt.registerTask('default', ['glsl', 'browserify', 'uglify']);
}