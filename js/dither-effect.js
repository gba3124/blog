(function(){function z(n){if(typeof THREE!="undefined"){n();return}const c="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",v=document.querySelector('script[src="'+c+'"]');if(v){v.addEventListener("load",n,{once:!0});return}const i=document.createElement("script");i.src=c,i.async=!0,i.onload=n,i.onerror=function(){console.warn("Three.js failed to load. Falling back to static gradient background.");const t=document.querySelector(".wall-bg");t&&(t.style.background="radial-gradient(circle at 50% 20%, rgba(90, 90, 90, 0.4), rgba(10, 10, 10, 0.95))")},document.head.appendChild(i)}document.addEventListener("DOMContentLoaded",()=>{const n=document.querySelector(".wall-bg");n&&z(function(){if(typeof THREE=="undefined")return;const c=window.innerWidth<768,i=(navigator.hardwareConcurrency||4)<=4,t={waveSpeed:.05,waveFrequency:3,waveAmplitude:.35,waveColor:new THREE.Color(.55,.58,.62),colorNum:i?3:4,pixelSize:c?4:i?3.5:3,enableMouseInteraction:!c&&!i,mouseRadius:.65,disableAnimation:i&&c};let e,l,w,b,s=null,p=!0,x=!1;const g=new THREE.Clock,R=new THREE.Vector2(.5,.5),d={time:new THREE.Uniform(0),resolution:new THREE.Uniform(new THREE.Vector2(1,1)),waveSpeed:new THREE.Uniform(t.waveSpeed),waveFrequency:new THREE.Uniform(t.waveFrequency),waveAmplitude:new THREE.Uniform(t.waveAmplitude),waveColor:new THREE.Uniform(t.waveColor.clone()),mousePos:new THREE.Uniform(new THREE.Vector2(.5,.5)),enableMouseInteraction:new THREE.Uniform(t.enableMouseInteraction?1:0),mouseRadius:new THREE.Uniform(t.mouseRadius),colorNum:new THREE.Uniform(t.colorNum),pixelSize:new THREE.Uniform(t.pixelSize)},q=`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,A=`
      precision highp float;

      uniform vec2 resolution;
      uniform float time;
      uniform float waveSpeed;
      uniform float waveFrequency;
      uniform float waveAmplitude;
      uniform vec3 waveColor;
      uniform vec2 mousePos;
      uniform int enableMouseInteraction;
      uniform float mouseRadius;
      uniform float colorNum;
      uniform float pixelSize;

      varying vec2 vUv;

      vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

      float cnoise(vec2 P) {
        vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
        vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
        Pi = mod289(Pi);
        vec4 ix = Pi.xzxz;
        vec4 iy = Pi.yyww;
        vec4 fx = Pf.xzxz;
        vec4 fy = Pf.yyww;
        vec4 i = permute(permute(ix) + iy);
        vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
        vec4 gy = abs(gx) - 0.5;
        vec4 tx = floor(gx + 0.5);
        gx = gx - tx;
        vec2 g00 = vec2(gx.x, gy.x);
        vec2 g10 = vec2(gx.y, gy.y);
        vec2 g01 = vec2(gx.z, gy.z);
        vec2 g11 = vec2(gx.w, gy.w);
        vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
        g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
        float n00 = dot(g00, vec2(fx.x, fy.x));
        float n10 = dot(g10, vec2(fx.y, fy.y));
        float n01 = dot(g01, vec2(fx.z, fy.z));
        float n11 = dot(g11, vec2(fx.w, fy.w));
        vec2 fade_xy = fade(Pf.xy);
        vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
        return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
      }

      const int OCTAVES = 4;
      float fbm(vec2 p, float frequency, float amplitude) {
        float value = 0.0;
        float amp = 1.0;
        float freq = frequency;
        for (int i = 0; i < OCTAVES; i++) {
          value += amp * abs(cnoise(p));
          p *= freq;
          amp *= amplitude;
        }
        return value;
      }

      float pattern(vec2 p, float speed, float frequency, float amplitude) {
        vec2 p2 = p - time * speed;
        return fbm(p + fbm(p2, frequency, amplitude), frequency, amplitude);
      }

      const float bayerMatrix8x8[64] = float[64](
        0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
        32.0/64.0,16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0,19.0/64.0, 47.0/64.0, 31.0/64.0,
        8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0,59.0/64.0,  7.0/64.0, 55.0/64.0,
        40.0/64.0,24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0,27.0/64.0, 39.0/64.0, 23.0/64.0,
        2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0,49.0/64.0, 13.0/64.0, 61.0/64.0,
        34.0/64.0,18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0,17.0/64.0, 45.0/64.0, 29.0/64.0,
        10.0/64.0,58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0,57.0/64.0,  5.0/64.0, 53.0/64.0,
        42.0/64.0,26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0,25.0/64.0, 37.0/64.0, 21.0/64.0
      );

      vec3 applyDither(vec2 fragCoord, vec3 color) {
        float steps = max(colorNum - 1.0, 1.0);
        vec2 scaledCoord = floor(fragCoord / max(pixelSize, 1.0));
        int x = int(mod(scaledCoord.x, 8.0));
        int y = int(mod(scaledCoord.y, 8.0));
        float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
        float stepSize = 1.0 / steps;
        color += threshold * stepSize;
        color = clamp(color - 0.2, 0.0, 1.0);
        return floor(color * steps + 0.5) / steps;
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 pixelCoord = floor(fragCoord / max(pixelSize, 1.0)) * max(pixelSize, 1.0) + 0.5 * max(pixelSize, 1.0);
        vec2 uv = pixelCoord / resolution;

        vec2 centered = uv - 0.5;
        centered.x *= resolution.x / resolution.y;

        float f = pattern(centered, waveSpeed, waveFrequency, waveAmplitude);

        if (enableMouseInteraction == 1) {
          vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
          mouseNDC.x *= resolution.x / resolution.y;
          float dist = length(centered - mouseNDC);
          float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
          f -= 0.5 * effect;
        }

        vec3 baseColor = mix(vec3(0.0), waveColor, f);
        vec3 color = applyDither(fragCoord, baseColor);
        gl_FragColor = vec4(color, 1.0);
      }
    `;function L(){l=new THREE.Scene,w=new THREE.OrthographicCamera(-1,1,1,-1,0,1);const o=new THREE.PlaneGeometry(2,2,1,1),r=new THREE.ShaderMaterial({uniforms:d,vertexShader:q,fragmentShader:A});b=new THREE.Mesh(o,r),l.add(b),e=new THREE.WebGLRenderer({antialias:!1,alpha:!1,powerPreference:i?"low-power":"high-performance"});const a=Math.min(window.devicePixelRatio||1,i?1:1.75);e.setPixelRatio(a),h(),e.domElement.style.width="100%",e.domElement.style.height="100%",e.domElement.style.display="block",n.innerHTML="",n.appendChild(e.domElement),E()}function h(){if(!e)return;const{width:o,height:r}=n.getBoundingClientRect(),a=Math.max(o,1),f=Math.max(r,1);e.setSize(a,f,!1),d.resolution.value.set(e.domElement.width,e.domElement.height)}function C(o,r){if(!t.enableMouseInteraction)return;const a=n.getBoundingClientRect(),f=e?e.getPixelRatio():window.devicePixelRatio||1,U=Math.min(Math.max(o-a.left,0),a.width),F=Math.min(Math.max(r-a.top,0),a.height);R.set(U*f,F*f)}function T(o){C(o.clientX,o.clientY)}function m(o){if(!o.touches||o.touches.length===0)return;const r=o.touches[0];C(r.clientX,r.clientY)}function S(){x||!e||(d.time.value=g.getElapsedTime(),t.enableMouseInteraction&&d.mousePos.value.lerp(R,.15),e.render(l,w),s=requestAnimationFrame(S))}function E(){if(s===null){if(t.disableAnimation){e.render(l,w);return}g.start(),s=requestAnimationFrame(S)}}function y(){s!==null&&(cancelAnimationFrame(s),s=null,g.stop())}function H(){document.hidden?y():p&&!t.disableAnimation&&E()}function M(){h()}function P(){x||(x=!0,y(),window.removeEventListener("resize",M),window.removeEventListener("mousemove",T),window.removeEventListener("touchmove",m),window.removeEventListener("touchstart",m),document.removeEventListener("visibilitychange",H),window.removeEventListener("beforeunload",P),u&&u.disconnect(),e&&(e.dispose(),e.domElement&&e.domElement.parentNode===n&&n.removeChild(e.domElement)),l&&l.traverse(o=>{o.isMesh&&(o.geometry&&o.geometry.dispose(),o.material&&o.material.dispose())}))}let u;function I(){u=new IntersectionObserver(o=>{o.forEach(r=>{r.target===n&&(p=r.isIntersecting,p&&!document.hidden&&!t.disableAnimation?E():y())})},{threshold:.05}),u.observe(n)}L(),I(),window.addEventListener("resize",M),document.addEventListener("visibilitychange",H),window.addEventListener("beforeunload",P),t.enableMouseInteraction&&(window.addEventListener("mousemove",T,{passive:!0}),window.addEventListener("touchstart",m,{passive:!0}),window.addEventListener("touchmove",m,{passive:!0})),requestAnimationFrame(()=>{h(),d.mousePos.value.set(e.domElement.width*.5,e.domElement.height*.5)})})})})();
