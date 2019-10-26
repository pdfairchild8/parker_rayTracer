precision mediump float;

#define INF 1.0e+12
#define EPS 1.0e-3 // Reflect/shadow/transmission ray offset
#define MAX_RECURSION 4 // Maximum depth for rays
#define MAX_LIGHTS 10
#define MAX_MATERIALS 10
#define M_PI 3.1415926535897932384626433832795
#define SOFT_NUMBER 10

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
  int special;
};

struct Light {
    vec3 pos;
    vec3 color;
    vec3 atten;
    vec3 towards;
    float angle;
};

struct Ray {
  vec3 p0;
  vec3 v;
};

struct Intersection {
  vec3 p; // Point of intersection
  vec3 n; // Normal of intersection
  int mIdx; // Index into materials array
  float sCoeff; // Coefficient for checkerboard or special material
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
uniform int showLights;
uniform float beaconRadius;

// Ray tracer special options
uniform int orthographic;

// Camera parameters
uniform vec3 eye;
uniform vec3 right;
uniform vec3 up;
uniform float fovx;
uniform float fovy;


/*******************************************
           RAY CASTING FUNCTIONS
********************************************/

// TODO: Put helper functions here if you'd like

/** TODO: PUT YOUR CODE HERE **/


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
    float denom = dot(ray.v, n);
    float t = INF;
    if (abs(denom) > 0.0) {
        // The ray is not parallel to the plane
        float num = dot(p - ray.p0, n);
        t = num / denom;
        if (t > 0.0) {
            // Plane is in front of ray
            intersect.p = ray.p0 + t*ray.v;
            intersect.n = n;
            intersect.mIdx = mIdx;
        }
        else {
            t = INF;
        }
    }
    return t;
}

float getTriangleArea(vec3 a, vec3 b, vec3 c) {
    vec3 ab = b-a;
    vec3 ac = c-a;
    return length(cross(ab,ac))/2.0;
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
* @param {mat4} MInv: Inverse of the transformation M that's applied to the triangle before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
*
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectTriangle(Ray ray, vec3 a, vec3 b, vec3 c,
                            int mIdx, mat4 MInv, mat3 N,
                            out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index
    
    vec4 temp;
    vec3 newP0;
    vec3 newV;
    vec3 oldP0 = ray.p0;
    vec3 oldV = ray.v;


    temp = MInv * vec4(ray.p0,1.0);
    newP0 = vec3(temp[0],temp[1],temp[2]);
    temp = MInv * vec4(ray.v, 0.0);
    newV = vec3(temp[0],temp[1],temp[2]);

    ray.p0 = newP0;
    ray.v = newV;


    vec3 ab = b-a;
    vec3 ac = c-a;
    vec3 n = normalize(N*cross(ab,ac));
    float t = dot(a-ray.p0,n)/dot(ray.v,n);

    


    if (t >= 0.0) {
        intersect.p = ray.p0 + ray.v*t;
        intersect.n = n;

        float ABCarea = getTriangleArea(a,b,c);
        float alpha = getTriangleArea(c, intersect.p, b)/ABCarea;
        float beta = getTriangleArea(a, intersect.p, c)/ABCarea;
        float gamma = getTriangleArea(a,b,intersect.p)/ABCarea;

        if (alpha + beta + gamma == 1.0 || alpha + beta + gamma < 1.01) {
            return t;
        } else {
            return INF;
        }
    } else {
        return INF;
    }
    
}


/**
* Intersect a ray with a given sphere
*
* @param {Ray} ray : The ray in world coordinates
* @param {vec3} c : Center of the sphere
* @param {float} r : Radius of the sphere
* @param {int} mIdx : Array index of material that the sphere is made of
* @param {mat4} MInv: Inverse of the transformation M that's applied to the sphere before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
*
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectSphere(Ray ray, vec3 c, float r,
                            int mIdx, mat4 MInv, mat3 N,
                            out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index

    vec4 temp;
    vec3 newP0;
    vec3 newV;
    vec3 oldP0 = ray.p0;
    vec3 oldV = ray.v;


    temp = MInv * vec4(ray.p0,1.0);
    newP0 = vec3(temp[0],temp[1],temp[2]);
    temp = MInv * vec4(ray.v, 0.0);
    newV = vec3(temp[0],temp[1],temp[2]);

    ray.p0 = newP0;
    ray.v = newV;

    vec3 cp = ray.p0-c;

    float A = dot(ray.v,ray.v);
    float B = 2.0 * dot(cp,ray.v);
    float C = dot(cp,cp) - (r*r);

    float disc = B*B - 4.0*A*C;
    float t1 = (-B - sqrt(disc))/(2.0*A);
    float t2 = (-B + sqrt(disc))/(2.0*A);

    if (disc >= 0.0) {
        if (t1 > 0.0) {
            intersect.p = oldP0 + oldV*t1;
            intersect.n = normalize(N*(newP0 + newV*t1-c));
            intersect.sCoeff = 1.0; // TODO: Change this for special material extra task
            return t1;
        } else if (t2 > 0.0) {
            intersect.p = oldP0 + oldV*t2;
            intersect.n = normalize(N*(newP0 + newV*t2-c));
            intersect.sCoeff = 1.0; // TODO: Change this for special material extra task
            return t2;
        } else {
            return INF;
        }
    } else {
        return INF;
    }
}


/**
* Intersect a ray with a (possibly transformed) box, whose extent
* in untransformed space is [center[0]-width/2, center[0]+width/2],
*                           [center[1]-height/2, center[1]+height/2],
*                           [center[2]-length/2, center[2]+length/2]
*
* @param {Ray} ray : The ray in world coordinates
* @param {float} W : Extent of the box along the x dimension
* @param {float} H : Extent of the box along the y dimension
* @param {float} L : Extent of the box along the z dimension
* @param {vec3} c : Center of the box
* @param {int} mIdx : Array index of material that the box is made of
* @param {mat4} MInv: Inverse of the transformation M that's applied to the box before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
*
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectBox(Ray ray, float W, float H, float L,
                        vec3 c, int mIdx, mat4 MInv, mat3 N,
                        out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index

    vec4 temp;
    vec3 newP0;
    vec3 newV;
    vec3 oldP0 = ray.p0;
    vec3 oldV = ray.v;


    temp = MInv * vec4(ray.p0,1.0);
    newP0 = vec3(temp[0],temp[1],temp[2]);
    temp = MInv * vec4(ray.v, 0.0);
    newV = vec3(temp[0],temp[1],temp[2]);

    ray.p0 = newP0;
    ray.v = newV;


    float xmax = c[0] + W/2.0;;
    float xmin = c[0] - W/2.0;
    float ymax = c[1] + H/2.0;
    float ymin = c[1] - H/2.0;
    float zmax = c[2] + L/2.0;
    float zmin = c[2] - L/2.0;

    vec3 p1 = c;
    p1[0] = xmax;
    vec3 n1 = vec3(1.0,0.0,0.0);
    Intersection intersect1;
    float t1 = rayIntersectPlane(ray, n1, p1, mIdx, intersect1);

    vec3 p2 = c;
    p2[0] = xmin;
    vec3 n2 = vec3(1.0,0.0,0.0);
    Intersection intersect2;
    float t2 = rayIntersectPlane(ray, n2, p2, mIdx, intersect2);

    vec3 p3 = c;
    p3[1] = ymax;
    vec3 n3 = vec3(0.0,1.0,0.0);
    Intersection intersect3;
    float t3 = rayIntersectPlane(ray, n3, p3, mIdx, intersect3);

    vec3 p4 = c;
    p4[1] = ymin;
    vec3 n4 = vec3(0.0,1.0,0.0);
    Intersection intersect4;
    float t4 = rayIntersectPlane(ray, n4, p4, mIdx, intersect4);

    vec3 p5 = c;
    p5[2] = zmax;
    vec3 n5 = vec3(0.0,0.0,1.0);
    Intersection intersect5;
    float t5 = rayIntersectPlane(ray, n5, p5, mIdx, intersect5);

    vec3 p6 = c;
    p6[2] = zmin;
    vec3 n6 = vec3(0.0,0.0,1.0);
    Intersection intersect6;
    float t6 = rayIntersectPlane(ray, n6, p6, mIdx, intersect6);
    

    float t = INF;

    if (t1 < t && t1 >= 0.0) {
        if  (ymin < intersect1.p.y && intersect1.p.y < ymax && zmin < intersect1.p.z && intersect1.p.z < zmax){
            t = t1;
            intersect.p = oldP0 + t1*oldV;
            intersect.n = normalize(N*intersect1.n);
        }
        
    }

    if (t2 < t && t2 >= 0.0) {
        if (ymin < intersect2.p.y && intersect2.p.y < ymax && zmin < intersect2.p.z && intersect2.p.z < zmax) {
            t = t2;
            intersect.p = oldP0 + t2*oldV;
            intersect.n = normalize(N*intersect2.n);
        }
    }

    if (t3 < t && t3 >= 0.0) {
        if(xmin < intersect3.p.x && intersect3.p.x < xmax && zmin < intersect3.p.z && intersect3.p.z < zmax) {
            t = t3;
            intersect.p = oldP0 + t3*oldV;
            intersect.n = normalize(N*intersect3.n);
        }
    }

    if (t4 < t && t4 >= 0.0) {
        if(xmin < intersect4.p.x && intersect4.p.x < xmax && zmin < intersect4.p.z && intersect4.p.z < zmax) {
            t = t4;
            intersect.p = oldP0 + t4*oldV;
            intersect.n = normalize(N*intersect4.n);
        }
    }

    if (t5 < t && t5 >= 0.0) {
        if(xmin < intersect5.p.x && intersect5.p.x < xmax && ymin < intersect5.p.y  && intersect5.p.y < ymax) {
            t = t5;
            intersect.p = oldP0 + t5*oldV;
            intersect.n = normalize(N*intersect5.n);
        }
    }

    if (t6 < t && t6 >= 0.0) {
        if (xmin < intersect6.p.x && intersect6.p.x < xmax && ymin < intersect6.p.y && intersect6.p.y < ymax) {
            t = t6;
            intersect.p = oldP0 + t6*oldV;
            intersect.n = normalize(N*intersect6.n);
        }
    }


    intersect.sCoeff = 1.0; // TODO: Change this for special material extra task
    return t;

}


/**
* Intersect a ray with a given cylinder
*
* @param {Ray} ray : The ray in world coordinates
* @param {vec3} c : Center of cylinder
* @param {float} r : Radius of cylinder
* @param {float} h : Height of cylinder
* @param {int} mIdx : Array index of material that the cylinder is made of
* @param {mat4} MInv: Inverse of the transformation M that's applied to the cylinder before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
*
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectCylinder(Ray ray, vec3 c, float r, float h,
                            int mIdx, mat4 MInv, mat3 N,
                            out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index
    intersect.sCoeff = 1.0; // TODO: Change this for special material extra task
/** TODO: PUT YOUR CODE HERE **/
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
* @param {mat4} MInv: Inverse of the transformation M that's applied to the cone before ray intersection
* @param {mat3} N: The normal transformation associated to M
* @param {Intersection (out)} intersect : The intersection
*
* @returns {float} t : Parameter t so that point of intersection is ray.P0 + t*ray.V
*/
float rayIntersectCone(Ray ray, vec3 c, float r, float h,
                            int mIdx, mat4 MInv, mat3 N,
                            out Intersection intersect) {
    intersect.mIdx = mIdx; // Store away the material index
    intersect.sCoeff = 1.0; // TODO: Change this for special material extra task
/** TODO: PUT YOUR CODE HERE **/
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
float rayIntersectScene(Ray ray, out Intersection intersect){return INF;}


/*******************************************
        RAY ILLUMINATION FUNCTIONS
********************************************/

/**
* Pull a material out of the list of materials, based on its
* index.  This function is necessary, because it is not possible
* to use non-constant indices into arrays in GLSL, so one must
* loop over the entire array of materials to find the right one
*
* @param {int} mIdx : The index into the materials array of the
*                     material we seekd
*
* @returns {Material} m : The appropriate material struct
*/
Material getMaterial(int mIdx) {
    Material m;
    for (int i = 0; i < MAX_MATERIALS; i++) {
        if (i == mIdx) {
            m = materials[i];
        }
    }
    return m;
}

/**
* Determine whether a point is in the shadow of a light
*
* @param {Intersection} intersect : Intersection point we're checking
* @param {int} lightIndex : Index into the array of lights of
*                           the light we want to check
*/
bool pointInShadow(Intersection intersect, Light l) {
    Ray ray;
    vec3 dir = l.pos - intersect.p;
    ray.v = dir;
    ray.p0 = intersect.p + EPS*normalize(dir);
    Intersection intersect2;
    float t = rayIntersectScene(ray, intersect2);
    
    if (t >= 1.0) {
        return false;
    } else {
        return true;
    }
}

float pointInSoftShadow(Intersection intersect, Light l) {
    Ray ray;
    vec3 dir = l.pos - intersect.p;
    ray.v = dir;
    ray.p0 = intersect.p + EPS*normalize(dir);
    Intersection intersect2;
    float t = rayIntersectScene(ray, intersect2);
    
    if (t >= 1.0) {
        return 1.0;
    } else {
        return 0.0;
    }
}


float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}



float softShadow(Intersection intersect, Light l) {
    float shadow;
    float counter = 0.0;
    float x = random(intersect.p.xy);
    float y = random(intersect.p.yz);
    float z = random(intersect.p.xz);
    vec3 oldPosition = l.pos;

    counter += pointInSoftShadow(intersect,l);
    vec3 randomValues;

    for (int i=0; i < SOFT_NUMBER; i++) {
        randomValues = beaconRadius * normalize(vec3(x,y,z));
        l.pos = oldPosition + randomValues;
        counter += pointInSoftShadow(intersect,l);

        x = random(vec2(x,y));
        y = random(vec2(y,z));
        z = random(vec2(z,x));
    }

    shadow = counter /(float(SOFT_NUMBER)+1.0);

    return shadow;
}

/**
* Get the phong illumination color
*/
vec3 getPhongColor(Intersection intersect, Material m) {
    vec3 color = vec3(0.0, 0.0, 0.0);
    vec3 ci = vec3(0.0,0.0,0.0);
    vec3 d = vec3(0.0,0.0,0.0);
    vec3 diffuse;
    vec3 specular;

    // To help with debugging, color the fragment based on the
    // normal of the intersection.  But this should eventually
    // be replaced with code to do Phong illumination below
    //color = 0.5*(intersect.n + 1.0);

    intersect.n = normalize(intersect.n);
    

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i < numLights) {
            float spotlight;
            float shadow = softShadow(intersect,lights[i]);
            vec3 normalizedTowards = normalize(lights[i].towards);
            d = lights[i].pos - intersect.p;
            float towardsAngle = dot(-normalize(d),normalizedTowards);
            
            

            
            if (towardsAngle <= cos(lights[i].angle)) {
                spotlight = 0.0;
            } else {
                spotlight = 1.0;
            }

           
            ci = lights[i].color / (lights[i].atten.x + lights[i].atten.y * length(d) + lights[i].atten.z * dot(d,d)); 
            ci *= spotlight; 
        
            d = normalize(d);
            float kdCoeff = dot(d,intersect.n);
            if (kdCoeff >= 0.0) {
                diffuse = m.kd * kdCoeff; //N dot L;
            } else {
                diffuse = vec3(0.0,0.0,0.0);
            }

            vec3 dh = normalize(eye - intersect.p);
            vec3 h = -reflect(d, intersect.n);
            float ksCoeff = dot(h,dh);
            ksCoeff = pow(ksCoeff, m.shininess);
            if (ksCoeff >= 0.0) {
                specular = m.ks * ksCoeff;
            } else {
                specular = vec3(0.0,0.0,0.0);
            }
            
            color += ci * shadow * (diffuse + specular);
        } else {
            break;
        }
    } 
    


    return color;
}


/**
*
*/
varying vec2 v_position;
Ray getRay() {
    Ray ray;
    ray.p0 = eye;
    vec3 towards = normalize(cross(up,right));

    
    if (orthographic == 1) {

        ray.p0 = eye + 10.0 * v_position.x * right + 10.0 * v_position.y * up;
        ray.v = normalize(towards);
    }
    else {
        ray.v = normalize(towards + v_position.x*tan(fovx/2.0)*right + v_position.y*tan(fovy/2.0)*up);
    }
    return ray;
}

void showLightBeacons(Ray rayInitial, float tInitial) {
    // Show light beacons if the user so chooses
    // (NOTE: This requires a working implementation of rayIntersectSphere)
    mat4 identity4 = mat4(1.0);
    mat3 identity3 = mat3(1.0);
    Intersection intersect;
    if (showLights == 1) {
        for (int i = 0; i < MAX_LIGHTS; i++) {
            if (i < numLights) {
                Light light = lights[i];
                float tlight = rayIntersectSphere(rayInitial, light.pos, beaconRadius,
                                                  0, identity4, identity3, intersect);
                if (tlight < tInitial) {
                    gl_FragColor = vec4(light.color, 1.0);
                }
            }
        }
    }
}

void main() {
    Ray ray = getRay();
    Ray rayInitial = ray;
    bool insideObj = false;
    Intersection intersect;
    intersect.sCoeff = 1.0;
    vec3 color = vec3(0.0, 0.0, 0.0);
    vec3 weight = vec3(1.0, 1.0, 1.0);
    float t;
    float tInitial;
    for (int depth = 0; depth < MAX_RECURSION; depth++) {
        t = rayIntersectScene(ray, intersect);
        if (depth == 0) {
            tInitial = t;
        }
        if (t < INF) {
            Material m = getMaterial(intersect.mIdx);
            // Figure out whether the ray is inside the object it
            // intersected by using the dot product between a vector
            // from the endpoint of the ray and the intersection
            // point and the intersection normal
            if (dot(ray.p0 - intersect.p, intersect.n) < 0.0) {
                intersect.n *= -1.0;
                insideObj = true;
            }
            else {
                insideObj = false;
            }
            color += weight*getPhongColor(intersect, m);
            vec3 reflectedRay = reflect(ray.v,intersect.n);
            weight*=m.ks;
            ray.p0 = intersect.p + EPS * reflectedRay;
            ray.v = reflectedRay;

            // TODO: Reflect ray, multiply weight by specular of this object,
            // and recursively continue
            // If doing extra task on transmission, only reflect if the
            // transmission coefficient kt is zero in all components
            // Otherwise, do transmission with snell's law

/** TODO: PUT YOUR CODE HERE **/
        }
        else {
            // Ray doesn't intersect anything, so no use continuing
            break;
        }
    }
    gl_FragColor = vec4(color, 1.0);
    showLightBeacons(rayInitial, tInitial);
}
