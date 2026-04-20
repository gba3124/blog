(function(){"use strict";const P=`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,g=`
        precision highp float;

        uniform float iTime;
        uniform vec3 iResolution;
        uniform vec3 uColor;
        uniform float uAmplitude;
        uniform float uDistance;
        uniform vec2 uMouse;
        uniform float uLineWidth;

        varying vec2 vUv;

        #define PI 3.1415926538

        const int u_line_count = 40;
        const float u_line_blur = 15.0;

        float Perlin2D(vec2 P) {
            vec2 Pi = floor(P);
            vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
            vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
            Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
            Pt += vec2(26.0, 161.0).xyxy;
            Pt *= Pt;
            Pt = Pt.xzxz * Pt.yyww;
            vec4 hash_x = fract(Pt * (1.0 / 951.135664));
            vec4 hash_y = fract(Pt * (1.0 / 642.949883));
            vec4 grad_x = hash_x - 0.49999;
            vec4 grad_y = hash_y - 0.49999;
            vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
                * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
            grad_results *= 1.4142135623730950;
            vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
                       * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
            vec4 blend2 = vec4(blend, vec2(1.0 - blend));
            return dot(grad_results, blend2.zxzx * blend2.wwyy);
        }

        float pixel(float count, vec2 resolution) {
            return (1.0 / max(resolution.x, resolution.y)) * count;
        }

        float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
            float split_offset = (perc * 0.4);
            float split_point = 0.1 + split_offset;

            // \u6ED1\u9F20X\u4F4D\u7F6E\u63A7\u5236\u632F\u5E45\uFF1A\u8D8A\u53F3\u908A\u9707\u5F97\u8D8A\u5927
            float mouseAmplitudeMultiplier = 0.5 + mouse.x * 1.5; // \u5DE6\u908A0.5\u500D\uFF0C\u53F3\u908A2.0\u500D
            
            // \u57FA\u790E\u632F\u5E45\u8A08\u7B97
            float amplitude_normal = smoothstep(split_point, 0.7, st.x);
            float amplitude_strength = 0.6;
            
            float finalAmplitude = amplitude_normal * amplitude_strength
                                   * amplitude * mouseAmplitudeMultiplier;

            // \u6642\u9593\u7E2E\u653E
            float time_scaled = time / 10.0;
            float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

            // \u566A\u8072\u8A08\u7B97
            float xnoise = mix(
                Perlin2D(vec2(time_scaled, st.x + perc) * 2.0),
                Perlin2D(vec2(time_scaled, st.x + time_scaled) * 2.8) / 1.5,
                st.x * 0.25
            );

            // \u6ED1\u9F20Y\u4F4D\u7F6E\u76F4\u63A5\u6C7A\u5B9A\u7DDA\u689D\u7684\u4E2D\u5FC3\u9EDE
            // mouse.y = 0.0 \u6642\u7DDA\u689D\u5728\u5E95\u90E8\uFF0Cmouse.y = 1.0 \u6642\u7DDA\u689D\u5728\u9802\u90E8
            float mouseCenterY = mouse.y;
            
            // \u8A08\u7B97\u6700\u7D42\u7684Y\u4F4D\u7F6E\uFF1A\u6ED1\u9F20Y\u4F4D\u7F6E + \u7DDA\u689D\u9593\u8DDD + \u566A\u8072\u632F\u5E45
            float y = mouseCenterY + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

            float line_start = smoothstep(
                y + (width / 2.0) + (u_line_blur * pixel(1.0, iResolution.xy) * blur),
                y,
                st.y
            );

            float line_end = smoothstep(
                y,
                y - (width / 2.0) - (u_line_blur * pixel(1.0, iResolution.xy) * blur),
                st.y
            );

            return clamp(
                (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
                0.0,
                1.0
            );
        }

        void main() {
            vec2 uv = vUv;

            float line_strength = 1.0;
            for (int i = 0; i < u_line_count; i++) {
                float p = float(i) / float(u_line_count);
                line_strength *= (1.0 - lineFn(
                    uv,
                    uLineWidth * pixel(1.0, iResolution.xy) * (1.0 - p),
                    p,
                    (PI * 1.0) * p,
                    uMouse,
                    iTime,
                    uAmplitude,
                    uDistance
                ));
            }

            float colorVal = 1.0 - line_strength;
            gl_FragColor = vec4(uColor * colorVal, colorVal);
        }
    `;function r(){const e=document.getElementById("footer-threads");if(!e){console.warn("Footer threads: Container not found");return}if(!window.THREE){console.error("Footer threads: Three.js not loaded");return}console.log("Initializing footer threads effect with Three.js...");const u=new THREE.Scene,E=new THREE.OrthographicCamera(-1,1,1,-1,0,1),i=new THREE.WebGLRenderer({alpha:!0,antialias:!0});i.setSize(e.clientWidth,e.clientHeight),i.setClearColor(0,0),e.appendChild(i.domElement);function d(t){const c=Math.max(1,t/375),T=6*Math.pow(c,1.1);return Math.max(T,t>768?12:6)}const l={iTime:{value:0},iResolution:{value:new THREE.Vector3(e.clientWidth,e.clientHeight,e.clientWidth/e.clientHeight)},uColor:{value:new THREE.Vector3(1,1,1)},uAmplitude:{value:.6},uDistance:{value:.15},uMouse:{value:new THREE.Vector2(.5,.5)},uLineWidth:{value:d(e.clientWidth)}},m=new THREE.ShaderMaterial({vertexShader:P,fragmentShader:g,uniforms:l,transparent:!0}),f=new THREE.PlaneGeometry(2,2),w=new THREE.Mesh(f,m);u.add(w);let h=new THREE.Vector2(.5,.5),a=new THREE.Vector2(.5,.5),o;function s(){const t=e.clientWidth,n=e.clientHeight;i.setSize(t,n),l.iResolution.value.set(t,n,t/n),l.uLineWidth.value=d(t)}function v(t){const n=e.getBoundingClientRect(),y=(t.clientX-n.left)/n.width,c=1-(t.clientY-n.top)/n.height;a.set(y,c)}function p(){a.set(.5,.5)}function _(t){h.lerp(a,.001),l.uMouse.value.copy(h),l.iTime.value=t*.001,i.render(u,E),o=requestAnimationFrame(_)}window.addEventListener("resize",s),e.addEventListener("mousemove",v),e.addEventListener("mouseleave",p),s();const x=new IntersectionObserver(t=>{t.forEach(n=>{n.isIntersecting?o||(o=requestAnimationFrame(_)):o&&(cancelAnimationFrame(o),o=null)})},{threshold:0});return x.observe(e),function(){x.disconnect(),o&&cancelAnimationFrame(o),window.removeEventListener("resize",s),e.removeEventListener("mousemove",v),e.removeEventListener("mouseleave",p),f.dispose(),m.dispose(),i.dispose(),e.contains(i.domElement)&&e.removeChild(i.domElement)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r(),window.initFooterThreadsThreeJS=r})();
