import{Renderer as l,Program as u,Mesh as h,Triangle as d,Color as i}from"ogl";const c=`
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,m=`
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;

#define PI 3.1415926538

const int u_line_count = 40;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;

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

    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength
                           * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);

    float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );

    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

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

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;
    fragColor = vec4(uColor * colorVal, colorVal);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;class o{constructor(e,t={}){this.container=e,this.options={color:[1,1,1],amplitude:1,distance:0,enableMouseInteraction:!1,...t},this.animationFrameId=null,this.currentMouse=[.5,.5],this.targetMouse=[.5,.5],this.isDisposed=!1,this.handleMouseMove=this.handleMouseMove.bind(this),this.handleMouseLeave=this.handleMouseLeave.bind(this),this.handleResize=this.handleResize.bind(this),this.update=this.update.bind(this),this.init()}init(){if(!this.container){console.error("Threads: Container element is required");return}this.renderer=new l({alpha:!0}),this.gl=this.renderer.gl,this.gl.clearColor(0,0,0,0),this.gl.enable(this.gl.BLEND),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA),this.container.appendChild(this.gl.canvas),this.geometry=new d(this.gl),this.program=new u(this.gl,{vertex:c,fragment:m,uniforms:{iTime:{value:0},iResolution:{value:new i(this.gl.canvas.width,this.gl.canvas.height,this.gl.canvas.width/this.gl.canvas.height)},uColor:{value:new i(...this.options.color)},uAmplitude:{value:this.options.amplitude},uDistance:{value:this.options.distance},uMouse:{value:new Float32Array([.5,.5])}}}),this.mesh=new h(this.gl,{geometry:this.geometry,program:this.program}),this.setupEventListeners(),this.handleResize(),this.animationFrameId=requestAnimationFrame(this.update)}setupEventListeners(){window.addEventListener("resize",this.handleResize),this.options.enableMouseInteraction&&(this.container.addEventListener("mousemove",this.handleMouseMove),this.container.addEventListener("mouseleave",this.handleMouseLeave))}handleResize(){if(this.isDisposed)return;const{clientWidth:e,clientHeight:t}=this.container;this.renderer.setSize(e,t),this.program.uniforms.iResolution.value.r=e,this.program.uniforms.iResolution.value.g=t,this.program.uniforms.iResolution.value.b=e/t}handleMouseMove(e){if(this.isDisposed)return;const t=this.container.getBoundingClientRect(),r=(e.clientX-t.left)/t.width,a=1-(e.clientY-t.top)/t.height;this.targetMouse=[r,a]}handleMouseLeave(){this.isDisposed||(this.targetMouse=[.5,.5])}update(e){this.isDisposed||(this.options.enableMouseInteraction?(this.currentMouse[0]+=.05*(this.targetMouse[0]-this.currentMouse[0]),this.currentMouse[1]+=.05*(this.targetMouse[1]-this.currentMouse[1]),this.program.uniforms.uMouse.value[0]=this.currentMouse[0],this.program.uniforms.uMouse.value[1]=this.currentMouse[1]):(this.program.uniforms.uMouse.value[0]=.5,this.program.uniforms.uMouse.value[1]=.5),this.program.uniforms.iTime.value=e*.001,this.renderer.render({scene:this.mesh}),this.animationFrameId=requestAnimationFrame(this.update))}updateOptions(e){this.isDisposed||(this.options={...this.options,...e},e.color&&(this.program.uniforms.uColor.value=new i(...e.color)),e.amplitude!==void 0&&(this.program.uniforms.uAmplitude.value=e.amplitude),e.distance!==void 0&&(this.program.uniforms.uDistance.value=e.distance),e.enableMouseInteraction!==void 0&&(this.removeEventListeners(),this.setupEventListeners()))}removeEventListeners(){window.removeEventListener("resize",this.handleResize),this.container.removeEventListener("mousemove",this.handleMouseMove),this.container.removeEventListener("mouseleave",this.handleMouseLeave)}dispose(){if(!this.isDisposed&&(this.isDisposed=!0,this.animationFrameId&&cancelAnimationFrame(this.animationFrameId),this.removeEventListeners(),this.container&&this.gl&&this.container.contains(this.gl.canvas)&&this.container.removeChild(this.gl.canvas),this.gl)){const e=this.gl.getExtension("WEBGL_lose_context");e&&e.loseContext()}}}function n(s,e={}){return new o(s,e)}export{n as initThreads,o as ThreadsEffect};typeof window!="undefined"&&(window.initThreads=n);
