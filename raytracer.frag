precision mediump float;

// Constants
#define INFINITY 1.0e+12
#define EPS 1.0e-3
// Maximum depth for rays
#define MAX_RECURSION 8
// Maximum number of lights
#define MAX_LIGHTS 10
#define MAX_MATERIALS 10

/*******************************************
                DATA TYPES
********************************************/
struct Material {
  vec3 kd;
  vec3 ks;
  vec3 ka;
  float shininess;

  float reflectivity;
  float refractionRatio;
};

struct Light {
    vec3 pos;
    vec3 color;
    float falloff;
};

struct Ray {
  vec3 P0;
  vec3 V;
};

struct Intersection {
  vec3 P;
  vec3 N;
};


/*******************************************
                UNIFORMS
********************************************/
// Uniforms set from Javascript that are constant
// over all fragments
uniform float height;
uniform float width;
uniform int numObjects;
uniform int numLights;
uniform Light lights[MAX_LIGHTS];
uniform int numMaterials;
uniform Material materials[MAX_MATERIALS];

// Camera parameters
uniform vec3 eye;
uniform vec3 right;
uniform vec3 up;


void main() {
    vec3 color = vec3(1.0, 0.0, 0.0);
    gl_FragColor = vec4(color, 1.0);
}
