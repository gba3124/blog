class MetallicPaint{constructor(t,s,i={}){this.canvas=t,this.imageData=s,this.params={patternScale:2,refraction:.015,edge:.4,patternBlur:.005,liquid:.07,speed:.15,...i},this.gl=null,this.uniforms={},this.totalAnimationTime=0,this.lastRenderTime=0,this.animationId=null,console.log("MetallicPaint initialized with imageData:",this.imageData),this.init()}init(){if(this.gl=this.canvas.getContext("webgl2",{antialias:!0,alpha:!0}),!this.gl){console.error("WebGL2 not supported");return}console.log("WebGL2 context created"),this.initShader(),this.updateUniforms(),this.resizeCanvas(),this.createTexture(),this.startAnimation(),window.addEventListener("resize",()=>{this.resizeCanvas()})}createShader(t,s){const i=this.gl.createShader(s);return i?(this.gl.shaderSource(i,t),this.gl.compileShader(i),this.gl.getShaderParameter(i,this.gl.COMPILE_STATUS)?i:(console.error("Shader compilation error:",this.gl.getShaderInfoLog(i)),this.gl.deleteShader(i),null)):null}initShader(){const t=`#version 300 es
precision mediump float;

in vec2 a_position;
out vec2 vUv;

void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}`,s=`#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
    m = m*m;
    m = m*m;
    vec3 x = 2. * fract(p * C.www) - 1.;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130. * dot(m, g);
}

vec2 get_img_uv() {
    vec2 img_uv = vUv;
    img_uv -= .5;
    if (u_ratio > u_img_ratio) {
        img_uv.x = img_uv.x * u_ratio / u_img_ratio;
    } else {
        img_uv.y = img_uv.y * u_img_ratio / u_ratio;
    }
    float scale_factor = 1.;
    img_uv *= scale_factor;
    img_uv += .5;
    img_uv.y = 1. - img_uv.y;
    return img_uv;
}
vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
float get_color_channel(float c1, float c2, float stripe_p, vec3 w, float extra_blur, float b) {
    float ch = c2;
    float border = 0.;
    float blur = u_patternBlur + extra_blur;
    ch = mix(ch, c1, smoothstep(.0, blur, stripe_p));
    border = w[0];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));
    b = smoothstep(.2, .8, b);
    border = w[0] + .4 * (1. - b) * w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));
    border = w[0] + .5 * (1. - b) * w[1];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));
    border = w[0] + w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));
    float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
    float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
    ch = mix(ch, gradient, smoothstep(border - blur, border + blur, stripe_p));
    return ch;
}
float get_img_frame_alpha(vec2 uv, float img_frame_width) {
    float img_frame_alpha = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
    img_frame_alpha *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
    return img_frame_alpha;
}
void main() {
    vec2 uv = vUv;
    uv.y = 1. - uv.y;
    uv.x *= u_ratio;
    float diagonal = uv.x - uv.y;
    float t = .001 * u_time;
    vec2 img_uv = get_img_uv();
    vec4 img = texture(u_image_texture, img_uv);
    vec3 color = vec3(0.);
    float opacity = 1.;
    vec3 color1 = vec3(.98, 0.98, 1.);
    vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, uv.x + uv.y));
    float edge = img.r;
    vec2 grad_uv = uv;
    grad_uv -= .5;
    float dist = length(grad_uv + vec2(0., .2 * diagonal));
    grad_uv = rotate(grad_uv, (.25 - .2 * diagonal) * PI);
    float bulge = pow(1.8 * dist, 1.2);
    bulge = 1. - bulge;
    bulge *= pow(uv.y, .3);
    float cycle_width = u_patternScale;
    float thin_strip_1_ratio = .12 / cycle_width * (1. - .4 * bulge);
    float thin_strip_2_ratio = .07 / cycle_width * (1. + .4 * bulge);
    float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);
    float thin_strip_1_width = cycle_width * thin_strip_1_ratio;
    float thin_strip_2_width = cycle_width * thin_strip_2_ratio;
    opacity = 1. - smoothstep(.9 - .5 * u_edge, 1. - .5 * u_edge, edge);
    opacity *= get_img_frame_alpha(img_uv, 0.01);
    float noise = snoise(uv - t);
    edge += (1. - edge) * u_liquid * noise;
    float refr = 0.;
    refr += (1. - bulge);
    refr = clamp(refr, 0., 1.);
    float dir = grad_uv.x;
    dir += diagonal;
    dir -= 2. * noise * diagonal * (smoothstep(0., 1., edge) * smoothstep(1., 0., edge));
    bulge *= clamp(pow(uv.y, .1), .3, 1.);
    dir *= (.1 + (1.1 - edge) * bulge);
    dir *= smoothstep(1., .7, edge);
    dir += .18 * (smoothstep(.1, .2, uv.y) * smoothstep(.4, .2, uv.y));
    dir += .03 * (smoothstep(.1, .2, 1. - uv.y) * smoothstep(.4, .2, 1. - uv.y));
    dir *= (.5 + .5 * pow(uv.y, 2.));
    dir *= cycle_width;
    dir -= t;
    float refr_r = refr;
    refr_r += .03 * bulge * noise;
    float refr_b = 1.3 * refr;
    refr_r += 5. * (smoothstep(-.1, .2, uv.y) * smoothstep(.5, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(1., .4, bulge));
    refr_r -= diagonal;
    refr_b += (smoothstep(0., .4, uv.y) * smoothstep(.8, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(.8, .4, bulge));
    refr_b -= .2 * edge;
    refr_r *= u_refraction;
    refr_b *= u_refraction;
    vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
    w[1] -= .02 * smoothstep(.0, 1., edge + bulge);
    float stripe_r = mod(dir + refr_r, 1.);
    float r = get_color_channel(color1.r, color2.r, stripe_r, w, 0.02 + .03 * u_refraction * bulge, bulge);
    float stripe_g = mod(dir, 1.);
    float g = get_color_channel(color1.g, color2.g, stripe_g, w, 0.01 / (1. - diagonal), bulge);
    float stripe_b = mod(dir - refr_b, 1.);
    float b = get_color_channel(color1.b, color2.b, stripe_b, w, .01, bulge);
    color = vec3(r, g, b);
    color *= opacity;
    fragColor = vec4(color, opacity);
}`,i=this.createShader(t,this.gl.VERTEX_SHADER),r=this.createShader(s,this.gl.FRAGMENT_SHADER);if(!i||!r){console.error("Failed to create shaders");return}const o=this.gl.createProgram();if(this.gl.attachShader(o,i),this.gl.attachShader(o,r),this.gl.linkProgram(o),!this.gl.getProgramParameter(o,this.gl.LINK_STATUS)){console.error("Program linking error:",this.gl.getProgramInfoLog(o));return}console.log("Shaders compiled and linked successfully");const l=this.gl.getProgramParameter(o,this.gl.ACTIVE_UNIFORMS);for(let u=0;u<l;u++){const m=this.gl.getActiveUniform(o,u);m&&(this.uniforms[m.name]=this.gl.getUniformLocation(o,m.name))}console.log("Uniforms:",Object.keys(this.uniforms));const e=new Float32Array([-1,-1,1,-1,-1,1,1,1]),c=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,c),this.gl.bufferData(this.gl.ARRAY_BUFFER,e,this.gl.STATIC_DRAW),this.gl.useProgram(o);const g=this.gl.getAttribLocation(o,"a_position");this.gl.enableVertexAttribArray(g),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,c),this.gl.vertexAttribPointer(g,2,this.gl.FLOAT,!1,0,0)}updateUniforms(){!this.gl||!this.uniforms||(this.gl.uniform1f(this.uniforms.u_edge,this.params.edge),this.gl.uniform1f(this.uniforms.u_patternBlur,this.params.patternBlur),this.gl.uniform1f(this.uniforms.u_time,0),this.gl.uniform1f(this.uniforms.u_patternScale,this.params.patternScale),this.gl.uniform1f(this.uniforms.u_refraction,this.params.refraction),this.gl.uniform1f(this.uniforms.u_liquid,this.params.liquid),console.log("Uniforms updated with params:",this.params))}resizeCanvas(){if(!this.imageData)return;const t=this.imageData.width/this.imageData.height,s=this.canvas.className==="metallic-nav-logo";let i;s?i=60:window.innerWidth<=480?i=150:window.innerWidth<=768?i=200:i=300;const r=Math.min(devicePixelRatio,2);this.canvas.width=i*r,this.canvas.height=i*r,this.canvas.style.width=i+"px",this.canvas.style.height=i+"px",this.gl.viewport(0,0,this.canvas.width,this.canvas.height),this.uniforms.u_ratio&&this.gl.uniform1f(this.uniforms.u_ratio,1),this.uniforms.u_img_ratio&&this.gl.uniform1f(this.uniforms.u_img_ratio,t),console.log(`Canvas resized to ${i}x${i} (${this.canvas.width}x${this.canvas.height}), image ratio: ${t}`)}createTexture(){if(!this.imageData){console.error("No image data available for texture");return}const t=this.gl.createTexture();this.gl.activeTexture(this.gl.TEXTURE0),this.gl.bindTexture(this.gl.TEXTURE_2D,t),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,1);try{this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA,this.imageData.width,this.imageData.height,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,this.imageData.data),this.uniforms.u_image_texture&&this.gl.uniform1i(this.uniforms.u_image_texture,0),console.log(`Texture created: ${this.imageData.width}x${this.imageData.height}`)}catch(s){console.error("Error uploading texture:",s)}}startAnimation(){const t=s=>{const i=s-this.lastRenderTime;this.lastRenderTime=s,this.totalAnimationTime+=i*this.params.speed,this.uniforms.u_time&&this.gl.uniform1f(this.uniforms.u_time,this.totalAnimationTime),this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4),this.animationId=requestAnimationFrame(t)};this.lastRenderTime=performance.now(),this.animationId=requestAnimationFrame(t),console.log("Animation started")}updateParams(t){this.params={...this.params,...t},this.updateUniforms(),console.log("Parameters updated:",this.params)}destroy(){this.animationId&&cancelAnimationFrame(this.animationId)}}function parseLogoImage(a){return new Promise((t,s)=>{const i=performance.now(),r=new Image;r.crossOrigin="anonymous",r.onload=function(){console.log("SVG loaded:",r.width,"x",r.height);const o=document.createElement("canvas"),l=o.getContext("2d",{willReadFrequently:!0}),e=512;o.width=e,o.height=e,l.clearRect(0,0,e,e);const c=Math.min(e/r.width,e/r.height)*.9,g=(e-r.width*c)/2,u=(e-r.height*c)/2;l.imageSmoothingEnabled=!0,l.imageSmoothingQuality="high",l.drawImage(r,g,u,r.width*c,r.height*c);const m=document.createElement("canvas"),f=m.getContext("2d",{willReadFrequently:!0});m.width=e,m.height=e,f.drawImage(o,0,0);const E=l.getImageData(0,0,e,e),p=f.getImageData(0,0,e,e),v=2,R=[];for(let n=-v;n<=v;n++)for(let d=-v;d<=v;d++)Math.sqrt(d*d+n*n)<=v&&R.push({dx:d,dy:n});for(let n=0;n<e;n++)for(let d=0;d<e;d++){const b=(n*e+d)*4;if(E.data[b+3]>128)for(const{dx:h,dy:A}of R){const y=d+h,T=n+A;if(y>=0&&y<e&&T>=0&&T<e){const w=(T*e+y)*4;p.data[w]=0,p.data[w+1]=0,p.data[w+2]=0,p.data[w+3]=255}}}l.putImageData(p,0,0);const _=l.getImageData(0,0,e,e).data,S=new Array(e*e).fill(!1);for(let n=0;n<_.length;n+=4){const d=_[n],b=_[n+1],h=_[n+2],y=_[n+3]>128;S[n/4]=y}const I=computeDistanceField(S,e),x=new ImageData(e,e);for(let n=0;n<e*e;n++){const d=n*4,b=I[n];let h;S[n]?h=Math.floor(255*(1-Math.min(b/12,1)*.85)):h=255,x.data[d]=h,x.data[d+1]=h,x.data[d+2]=h,x.data[d+3]=255}const D=performance.now();console.log(`Image processed successfully in ${(D-i).toFixed(2)}ms`),t({imageData:x})},r.onerror=o=>{console.error("Failed to load SVG:",o),s(new Error("Failed to load image"))},r.src=a})}function computeDistanceField(a,t){const s=new Float32Array(t*t);for(let o=0;o<t*t;o++)s[o]=a[o]?0:1/0;const i=25,r=2;for(let o=0;o<t;o++)for(let l=0;l<t;l++){const e=o*t+l;if(!a[e])continue;let c=1/0;for(let g=-i;g<=i;g+=r)for(let u=-i;u<=i;u+=r){const m=l+u,f=o+g;if(m<0||m>=t||f<0||f>=t)continue;const E=f*t+m;if(!a[E]){const p=Math.sqrt(u*u+g*g);c=Math.min(c,p)}}s[e]=c===1/0?0:c}return s}function createControlPanel(a){if(document.querySelector(".metallic-controls"))return;const t=document.createElement("div");t.className="metallic-controls",t.innerHTML=`
    <div class="metallic-controls-header">
      <h3>MetallicPaint Controls</h3>
      <button class="metallic-controls-toggle">\u2212</button>
    </div>
    <div class="metallic-controls-content">
      <div class="control-group">
        <label>Pattern Scale: <span class="value">${a.params.patternScale}</span></label>
        <input type="range" id="patternScale" min="0.5" max="3" step="0.1" value="${a.params.patternScale}">
      </div>
      <div class="control-group">
        <label>Refraction: <span class="value">${a.params.refraction}</span></label>
        <input type="range" id="refraction" min="0" max="0.1" step="0.005" value="${a.params.refraction}">
      </div>
      <div class="control-group">
        <label>Edge: <span class="value">${a.params.edge}</span></label>
        <input type="range" id="edge" min="0.1" max="2" step="0.1" value="${a.params.edge}">
      </div>
      <div class="control-group">
        <label>Pattern Blur: <span class="value">${a.params.patternBlur}</span></label>
        <input type="range" id="patternBlur" min="0" max="0.05" step="0.001" value="${a.params.patternBlur}">
      </div>
      <div class="control-group">
        <label>Liquid: <span class="value">${a.params.liquid}</span></label>
        <input type="range" id="liquid" min="0" max="0.2" step="0.01" value="${a.params.liquid}">
      </div>
      <div class="control-group">
        <label>Speed: <span class="value">${a.params.speed}</span></label>
        <input type="range" id="speed" min="0" max="1" step="0.05" value="${a.params.speed}">
      </div>
      <div class="control-group">
        <button id="resetParams">Reset to Default</button>
      </div>
    </div>
  `;const s=document.createElement("style");s.textContent=`
    .metallic-controls {
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      min-width: 250px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .metallic-controls-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .metallic-controls-header h3 {
      margin: 0;
      font-size: 14px;
    }
    
    .metallic-controls-toggle {
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .control-group {
      margin-bottom: 10px;
    }
    
    .control-group label {
      display: block;
      margin-bottom: 5px;
      font-size: 11px;
    }
    
    .control-group .value {
      color: #4CAF50;
      font-weight: bold;
    }
    
    .control-group input[type="range"] {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      outline: none;
      border-radius: 2px;
    }
    
    .control-group input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      background: #4CAF50;
      border-radius: 50%;
      cursor: pointer;
    }
    
    .control-group button {
      width: 100%;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }
    
    .control-group button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    @media screen and (max-width: 768px) {
      .metallic-controls {
        right: 10px;
        top: 80px;
        min-width: 200px;
        font-size: 10px;
      }
    }
  `,document.head.appendChild(s),document.body.appendChild(t),t.querySelectorAll('input[type="range"]').forEach(l=>{l.addEventListener("input",e=>{const c=e.target.id,g=parseFloat(e.target.value),u=e.target.parentElement.querySelector(".value");u.textContent=g,a.updateParams({[c]:g})})}),t.querySelector("#resetParams").addEventListener("click",()=>{const l={patternScale:1.2,refraction:.015,edge:.9,patternBlur:.005,liquid:.04,speed:.12};a.updateParams(l),Object.keys(l).forEach(e=>{const c=t.querySelector(`#${e}`),g=c.parentElement.querySelector(".value");c.value=l[e],g.textContent=l[e]})});const r=t.querySelector(".metallic-controls-toggle"),o=t.querySelector(".metallic-controls-content");r.addEventListener("click",()=>{o.style.display==="none"?(o.style.display="block",r.textContent="\u2212"):(o.style.display="none",r.textContent="+")})}async function initMetallicPaint(){if(console.log("Initializing MetallicPaint..."),window.innerWidth<=1023){console.log("Mobile device detected, skipping MetallicPaint");return}const a=document.querySelector(".nav-logo img");if(!a){console.error("nav-logo img element not found");return}const t=document.createElement("canvas");t.className="metallic-nav-logo",t.style.display="none",a.parentNode.appendChild(t);try{const s="/images/logos/logo.svg";console.log("Loading SVG from:",s);const i=await parseLogoImage(s);if(i&&i.imageData){console.log("Image data ready, creating canvas..."),a.style.display="none",t.style.display="block",console.log("Canvas added to nav");const r=new MetallicPaint(t,i.imageData,{patternScale:.8,refraction:.025,edge:.2,patternBlur:.005,liquid:.15,speed:.15});document.addEventListener("keydown",o=>{o.ctrlKey&&o.key==="m"&&createControlPanel(r)}),window.addEventListener("resize",()=>{window.innerWidth<=1023?(t.style.display="none",a.style.display="block",r.destroy()):(t.style.display="block",a.style.display="none")})}else console.error("Failed to parse image data, showing original logo"),a.style.display="block",t.remove()}catch(s){console.error("Error initializing MetallicPaint:",s),a.style.display="block",t.remove()}}function maybeInit(){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const t=document.querySelector(".nav-logo img");if(!t)return;new IntersectionObserver((i,r)=>{i.forEach(o=>{o.isIntersecting&&(initMetallicPaint(),r.disconnect())})}).observe(t)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",maybeInit):maybeInit();
