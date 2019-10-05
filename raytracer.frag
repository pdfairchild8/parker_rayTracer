precision mediump float;

#define INF 1.0e+12
// Numerical tolerance
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
  vec3 kt;
  float shininess;
  float refraction;
};

struct Light {
    vec3 pos;
    vec3 color;
    float falloff;
};

struct Ray {
  vec3 p0;
  vec3 v;
};

struct Intersection {
  vec3 p; // Point of intersection
  vec3 n; // Normal of intersection
  int mIdx; // Index into materials array
};


/*******************************************
                UNIFORMS
********************************************/
// Uniforms set from Javascript that are constant
// over all fragments
uniform float canvas_height;
uniform float canvas_width;
uniform int numObjects;
uniform int numLights;
uniform Light lights[MAX_LIGHTS];
uniform int numMaterials;
uniform Material materials[MAX_MATERIALS];

// Camera parameters
uniform vec3 eye;
uniform vec3 right;
uniform vec3 up;


/*******************************************
           RAY CASTING FUNCTIONS
********************************************/


/**
* Given a point on a plane and a normal, intersect a ray
* with the plane they determine
*
* @param {Ray} ray : The ray in world coordinates
* @param {vec3} n : The plane normal
* @param {vec3} p : A point on the plane
* @param {int} mIdx : Array index of material that the plane is made of
* @param {Intersection (out)} intersect : The intersection
* 
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectPlane(Ray ray, vec3 n, vec3 p, int mIdx, out Intersection intersect) {
    float num = dot(ray.v, n);
    if (abs(num) < EPS) {
        // The ray is parallel to the plane
        return INF;
    }
    float denom = dot(ray.p0, n) - dot(p, n);
    float t = -num/denom;
    if (t < -EPS) {
        // Ray points away from the plane
        return INF;
    }
    intersect.p = ray.p0 + t*ray.v;
    intersect.n = n;
    intersect.mIdx = mIdx;
    return t;
}


/**
* Intersect a ray with a given triangle /\abc, assuming a, b, and c
* have been specified in CCW order with respect to the triangle normal
*
* @param {Ray} ray : The ray in world coordinates
* @param {vec3} a : Point a on the triangle
* @param {vec3} b : Point b on the triangle
* @param {vec3} c: Point c on the triangle
* @param {int} mIdx : Array index of material that the triangle is made of
* @param {mat4} M: A transformation to apply to the triangle before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
* 
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectTriangle(Ray ray, vec3 a, vec3 b, vec3 c, 
                            int mIdx, mat4 M, mat3 N,
                            out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index
    // TODO: The below three are dummy values
    intersect.p = vec3(0, 0, 0);
    intersect.n = vec3(0, 0, 0);
    return INF; 
}


/**
* Intersect a ray with a given sphere
*
* @param {Ray} ray : The ray in world coordinates
* @param {vec3} c : Center of the sphere
* @param {float} r : Radius of the sphere
* @param {int} mIdx : Array index of material that the sphere is made of
* @param {mat4} M: A transformation to apply to the sphere before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
* 
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectSphere(Ray ray, vec3 c, float r, 
                            int mIdx, mat4 M, mat3 N,
                            out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index
    // TODO: The below three are dummy values
    intersect.p = vec3(0, 0, 0);
    intersect.n = vec3(0, 0, 0);
    return INF; 
}


/**
* Intersect a ray with a (possibly transformed) box, whose extent
* in untransformed space is [center[0]-width/2, center[0]+width/2],
*                           [center[1]-height/2, center[1]+height/2],
*                           [center[2]-length/2, center[2]+length/2]
*
* @param {Ray} ray : The ray in world coordinates
* @param {float} width : Extent of the box along the x dimension
* @param {float} height : Extent of the box along the y dimension
* @param {float} length : Extent of the box along the z dimension
* @param {vec3} c : Center of the box
* @param {int} mIdx : Array index of material that the box is made of
* @param {mat4} M: A transformation to apply to the box before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
* 
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectBox(Ray ray, float width, float height, float length, 
                        vec3 c, int mIdx, mat4 M, mat3 N, 
                        out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index
    // TODO: The below three are dummy values
    intersect.p = vec3(0, 0, 0);
    intersect.n = vec3(0, 0, 0);
    return INF; 
}


/**
* Intersect a ray with a given cylinder
*
* @param {Ray} ray : The ray in world coordinates
* @param {vec3} c : Center of cylinder
* @param {float} r : Radius of cylinder
* @param {float} h : Height of cylinder
* @param {int} mIdx : Array index of material that the cylinder is made of
* @param {mat4} M: A transformation to apply to the cylinder before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
* 
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectCylinder(Ray ray, vec3 c, float r, float h,
                            int mIdx, mat4 M, mat3 N,
                            out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index
    // TODO: The below three are dummy values
    intersect.p = vec3(0, 0, 0);
    intersect.n = vec3(0, 0, 0);
    return INF; 
}


/**
* Intersect a ray with a given cone
*
* @param {Ray} ray : The ray in world coordinates
* @param {vec3} c : Center of cone
* @param {float} r : Radius of cone
* @param {float} h : Height of cone
* @param {int} mIdx : Array index of material that the cone is made of
* @param {mat4} M: A transformation to apply to the cone before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
* 
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectCone(Ray ray, vec3 c, float r, float h,
                            int mIdx, mat4 M, mat3 N,
                            out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index
    // TODO: The below three are dummy values
    intersect.p = vec3(0, 0, 0);
    intersect.n = vec3(0, 0, 0);
    return INF; 
}


/**
* A function which intersects a ray with a scene, returning the
* t parameter of the closest intersection, or INF if no intersection
* happened, along with an out parameter storing the point, normal,
* and material of the intersection
* NOTE: This function is merely declared here; it is defined in its
* entirety in Javascript before this shader is compiled, since information
* about the scene must be hardcoded into the shader
*
* @param {Ray} ray : The ray in world coordinates
* @param {Intersection (out)} intersect : The intersection
* 
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectScene(Ray ray, out Intersection intersect);


/*******************************************
        RAY ILLUMINATION FUNCTIONS
********************************************/

/** 
* Determine whether a point is in the shadow of a light
*
* @param {vec3} p : Location of the point we're checking
* @param {int} lightIndex : Index into the array of lights of
*                           the light we want to check
*/
bool pointInShadow(vec3 p, int lightIndex) {
    return true; // TODO: This is a dummy value
}


void main() {
    vec3 c = vec3(gl_FragCoord.x / canvas_width, gl_FragCoord.y / canvas_height, 0);
    c *= lights[0].color;
    gl_FragColor = vec4(c, 1.0);
}