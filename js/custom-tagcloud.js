class x{constructor(t,e={}){if(this.container=typeof t=="string"?document.getElementById(t):t,this.scene=null,this.camera=null,this.renderer=null,this.controls=null,this.raycaster=null,this.mouse=new THREE.Vector2,this.tags=[],this.tagObjects=[],this.sphere=null,this.backgroundGrid=null,this.backgroundGrids=[],this.floorGrid=null,this.particleSystem=null,this.glowMesh=null,this.coreMesh=null,this.originalSpherePositions=null,this.noise3D=null,this.time=0,this.globeGroup=null,this.isActive=!0,this.animationId=null,this.hoveredTag=null,this.config={width:e.width||600,height:e.height||300,radius:e.radius||60,cameraDistance:e.cameraDistance||200,fov:e.fov||75,minFontSize:e.minFontSize||16,maxFontSize:e.maxFontSize||32,fontFamily:e.fontFamily||"Arial, sans-serif",colors:e.colors||["#3498db","#e74c3c","#2ecc71","#f39c12","#9b59b6","#1abc9c"],backgroundColor:e.backgroundColor||0,backgroundAlpha:e.backgroundAlpha||0,hoverColor:e.hoverColor||"#ff6b6b",textStyle:e.textStyle||"neon",sphereEffects:e.sphereEffects||"none",performance:Object.assign({pixelRatioMax:1.5,hoverThrottleMs:50,cullBackfaces:!0,cullIntervalFrames:4,fpsCap:0},e.performance||{}),autoRotate:e.autoRotate!==!1,autoRotateSpeed:e.autoRotateSpeed||.5,dampingFactor:e.dampingFactor||.05,rotation:Object.assign({auto:!0,speed:.004,wobbleSpeed:.002,wobbleAmp:.15},e.rotation||{}),enableZoom:e.enableZoom!==!1,enableRotate:e.enableRotate!==!1,enablePan:e.enablePan||!1,wireframe:e.wireframe||!1,showSphere:e.showSphere||!0,sphereColor:e.sphereColor||65416,sphereOpacity:e.sphereOpacity||.1,grid:Object.assign({enabled:!0,color:new THREE.Color(65416),lineThickness:1,cellSize:40,glow:.6},e.grid||{}),sphereGrid:Object.assign({enabled:!1,lineColor:65416,latCount:12,lonCount:24,lineWidth:.015,opacity:.7},e.sphereGrid||{}),parallaxGrid:Object.assign({enabled:!0,layers:3,depthStep:400,baseZ:-600,baseOpacity:.7,opacityDecay:.55},e.parallaxGrid||{}),floorGrid:Object.assign({enabled:!0,y:-140,size:5e3,cellSize:14,glow:.45},e.floorGrid||{}),particles:Object.assign({enabled:!0,count:700,color:65416,size:6,opacity:.35,area:{x:1e3,y:600,z:1600},rotationSpeed:.02},e.particles||{}),fog:Object.assign({enabled:!0,color:136207,density:.01},e.fog||{}),undulation:e.undulation||{enabled:!1,amplitude:1,frequency:.1},responsive:e.responsive!==!1,onTagClick:e.onTagClick||null,onTagHover:e.onTagHover||null,onReady:e.onReady||null},typeof THREE=="undefined"){console.error("Three.js \u672A\u627E\u5230\uFF0C\u8ACB\u78BA\u4FDD\u5DF2\u6B63\u78BA\u52A0\u8F09 Three.js \u5EAB");return}this.init()}init(){this.extractTags(),this.createScene(),this.globeGroup=new THREE.Group,this.globeGroup.name="globeGroup",this.scene.add(this.globeGroup),this.createBackgroundGrid(),this.createParallaxGrids(),this.createFloorGrid(),this.createParticles(),this.createCamera(),this.createRenderer(),this.createControls(),this.createSphere(),this.createTagObjects(),this.bindEvents(),document.addEventListener("visibilitychange",()=>{document.hidden?this.pause():this.resume()}),this.config.onReady&&this.config.onReady(this),this.animate()}createScene(){if(this.scene=new THREE.Scene,this.config.backgroundAlpha>0&&(this.scene.background=new THREE.Color(this.config.backgroundColor)),this.config.fog&&this.config.fog.enabled){const i=new THREE.Color(this.config.fog.color);this.scene.fog=new THREE.FogExp2(i,this.config.fog.density)}const t=new THREE.AmbientLight(16777215,.6);this.scene.add(t);const e=new THREE.DirectionalLight(16777215,.8);e.position.set(50,50,50),this.scene.add(e)}createBackgroundGrid(){if(!this.config.grid||!this.config.grid.enabled)return;const t=`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,e=`
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uCellSize;
      uniform float uGlow;
      
      float gridLine(float coord, float width) {
        float line = abs(fract(coord) - 0.5);
        float a = smoothstep(0.5, 0.5 - width, line);
        return 1.0 - a;
      }
      
      void main() {
        vec2 uv = vUv * uCellSize;
        float lineX = gridLine(uv.x, 0.02);
        float lineY = gridLine(uv.y, 0.02);
        float grid = max(lineX, lineY);
        vec3 color = uColor * (grid * (0.4 + uGlow * 0.3));
        gl_FragColor = vec4(color, 0.45);
      }
    `,i=`
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uCellSize;
      uniform float uGlow;
      uniform float uTime;
      float gridLine(float coord, float width) {
        float line = abs(fract(coord) - 0.5);
        float a = smoothstep(0.5, 0.5 - width, line);
        return 1.0 - a;
      }
      void main() {
        vec2 uv = vUv * uCellSize;
        float lineX = gridLine(uv.x, 0.03);
        float lineY = gridLine(uv.y, 0.03);
        float grid = max(lineX, lineY);
        float scan = 0.2 + 0.8 * smoothstep(0.0, 1.0, fract(vUv.y * 4.0 + uTime * 0.15));
        vec2 center = vUv - 0.5;
        float vignette = 1.0 - smoothstep(0.3, 0.8, length(center));
        vec3 base = vec3(0.0);
        vec3 gridColor = uColor * (grid * (0.6 + uGlow * 0.4));
        vec3 glowColor = uColor * (grid * uGlow);
        vec3 color = base + gridColor + glowColor * scan;
        color *= vignette;
        gl_FragColor = vec4(color, 1.0);
      }
    `,o=new THREE.PlaneGeometry(4e3,4e3,1,1),s=new THREE.ShaderMaterial({vertexShader:t,fragmentShader:this.config.grid.clean?e:i,uniforms:{uColor:{value:this.config.grid.color instanceof THREE.Color?this.config.grid.color:new THREE.Color(this.config.grid.color)},uCellSize:{value:this.config.grid.cellSize},uGlow:{value:this.config.grid.glow},uTime:{value:0}},depthWrite:!1,depthTest:!1,transparent:!1}),r=new THREE.Mesh(o,s);r.position.set(0,0,-800),r.material.transparent=!0,r.material.opacity=this.config.grid.clean?.35:.5,this.backgroundGrid=r,this.scene.add(r)}createParallaxGrids(){if(!this.config.parallaxGrid||!this.config.parallaxGrid.enabled)return;const{layers:t,depthStep:e,baseZ:i,baseOpacity:o,opacityDecay:s}=this.config.parallaxGrid,r=`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,a=`
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uCellSize;
      uniform float uGlow;
      uniform float uTime;
      uniform float uOpacity;

      float gridLine(float coord, float width) {
        float line = abs(fract(coord) - 0.5);
        float a = smoothstep(0.5, 0.5 - width, line);
        return 1.0 - a;
      }

      void main() {
        vec2 uv = vUv * uCellSize;
        uv += vec2(uTime * 0.1, 0.0);

        float lineX = gridLine(uv.x, 0.03);
        float lineY = gridLine(uv.y, 0.03);
        float grid = max(lineX, lineY);

        float scan = 0.25 + 0.75 * smoothstep(0.0, 1.0, fract(vUv.y * 3.0 + uTime * 0.1));
        vec2 c = vUv - 0.5;
        float vignette = 1.0 - smoothstep(0.2, 0.85, length(c));

        vec3 color = uColor * (grid * (0.5 + uGlow * 0.5) * scan);
        color *= vignette;
        gl_FragColor = vec4(color, uOpacity);
      }
    `;for(let l=0;l<t;l++){const h=new THREE.PlaneGeometry(4e3,4e3,1,1),m=new THREE.ShaderMaterial({vertexShader:r,fragmentShader:a,uniforms:{uColor:{value:this.config.grid.color instanceof THREE.Color?this.config.grid.color:new THREE.Color(this.config.grid.color)},uCellSize:{value:this.config.grid.cellSize*(1+l*.15)},uGlow:{value:this.config.grid.glow*(1-l*.2)},uTime:{value:0},uOpacity:{value:Math.max(.05,o*Math.pow(s,l))}},depthWrite:!1,depthTest:!1,transparent:!0}),g=new THREE.Mesh(h,m);g.position.set(0,0,i-l*e),this.backgroundGrids.push(g),this.scene.add(g)}}createFloorGrid(){if(!this.config.floorGrid||!this.config.floorGrid.enabled)return;const t=`
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,e=`
      precision highp float;
      varying vec3 vWorldPos;
      uniform vec3 uColor;
      uniform float uCellSize;
      uniform float uGlow;
      uniform float uTime;
      uniform vec3 uCameraPos;
      
      float gridLine(float v, float w) {
        float f = abs(fract(v) - 0.5);
        return smoothstep(0.5, 0.5 - w, f);
      }
      
      void main() {
        // \u4F7F\u7528\u4E16\u754C\u5EA7\u6A19\u7684 xz \u5E73\u9762\u751F\u6210\u683C\u7DDA
        vec2 g = vWorldPos.xz / uCellSize;
        g += vec2(uTime * 0.05, 0.0);
        
        float gx = 1.0 - gridLine(g.x, 0.04);
        float gz = 1.0 - gridLine(g.y, 0.04);
        float grid = max(gx, gz);
        
        // \u8DDD\u96E2\u76F8\u6A5F\u8D8A\u9060\u8D8A\u6DE1
        float dist = length(vWorldPos - uCameraPos);
        float fade = 1.0 / (1.0 + 0.0008 * dist * dist);
        
        vec3 color = uColor * (grid * (0.35 + uGlow * 0.65) * fade);
        gl_FragColor = vec4(color, clamp(fade, 0.05, 0.6));
      }
    `,i=new THREE.PlaneGeometry(this.config.floorGrid.size,this.config.floorGrid.size,1,1),o=new THREE.ShaderMaterial({vertexShader:t,fragmentShader:e,uniforms:{uColor:{value:this.config.grid.color instanceof THREE.Color?this.config.grid.color:new THREE.Color(this.config.grid.color)},uCellSize:{value:this.config.floorGrid.cellSize},uGlow:{value:this.config.floorGrid.glow},uTime:{value:0},uCameraPos:{value:new THREE.Vector3}},transparent:!0,depthWrite:!1,depthTest:!0}),s=new THREE.Mesh(i,o);s.rotation.x=-Math.PI/2,s.position.y=this.config.floorGrid.y,this.floorGrid=s,this.scene.add(s)}createParticles(){if(!this.config.particles||!this.config.particles.enabled)return;const{count:t,color:e,size:i,opacity:o,area:s}=this.config.particles,r=new THREE.BufferGeometry,a=new Float32Array(t*3),l=new Float32Array(t*3),h=new THREE.Color(e);for(let c=0;c<t;c++){const d=c*3;a[d]=(Math.random()-.5)*s.x,a[d+1]=(Math.random()-.5)*s.y,a[d+2]=-Math.random()*s.z,l[d]=h.r,l[d+1]=h.g,l[d+2]=h.b}r.setAttribute("position",new THREE.BufferAttribute(a,3)),r.setAttribute("color",new THREE.BufferAttribute(l,3));const m=new THREE.PointsMaterial({size:i,color:h,transparent:!0,opacity:o,depthWrite:!1,blending:THREE.AdditiveBlending,sizeAttenuation:!0,vertexColors:!1}),g=new THREE.Points(r,m);g.position.z=-400,this.particleSystem=g,this.scene.add(g)}createCamera(){this.camera=new THREE.PerspectiveCamera(this.config.fov,this.config.width/this.config.height,1,2e3),this.camera.position.z=this.config.cameraDistance}createRenderer(){this.renderer=new THREE.WebGLRenderer({antialias:!0,alpha:this.config.backgroundAlpha===0}),this.renderer.setSize(this.config.width,this.config.height);const t=this.config.performance.pixelRatioMax||2;for(this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,t)),this.config.responsive&&(this.renderer.domElement.style.maxWidth="100%",this.renderer.domElement.style.height="auto");this.container.firstChild;)this.container.removeChild(this.container.firstChild);this.container.appendChild(this.renderer.domElement)}createControls(){typeof window.OrbitControls!="undefined"?(this.controls=new window.OrbitControls(this.camera,this.renderer.domElement),this.controls.enableDamping=!0,this.controls.dampingFactor=this.config.dampingFactor,this.controls.enableZoom=this.config.enableZoom,this.controls.enableRotate=this.config.enableRotate,this.controls.enablePan=this.config.enablePan,this.controls.autoRotate=!1,this.controls.autoRotateSpeed=this.config.autoRotateSpeed,this.controls.minDistance=50,this.controls.maxDistance=500,this.controls.maxPolarAngle=Math.PI,this.controls.rotateSpeed=.5,this.controls.zoomSpeed=1.2,this.controls.update(),console.log("OrbitControls \u5DF2\u521D\u59CB\u5316:",{enableRotate:this.controls.enableRotate,enableZoom:this.controls.enableZoom,autoRotate:this.controls.autoRotate})):console.warn("OrbitControls \u672A\u627E\u5230\uFF0C\u5C07\u4F7F\u7528\u57FA\u672C\u63A7\u5236"),this.raycaster=new THREE.Raycaster}createSphere(){if(!this.config.showSphere)return;const t=new THREE.SphereGeometry(this.config.radius,64,64);this.config.undulation&&this.config.undulation.enabled&&this.applyUndulation(t),this.originalSpherePositions=t.attributes.position.array.slice(0);const e=new THREE.MeshBasicMaterial({color:this.config.sphereColor,wireframe:this.config.wireframe,transparent:!0,opacity:this.config.sphereOpacity,depthWrite:!1});if(this.sphere=new THREE.Mesh(t,e),this.globeGroup.add(this.sphere),this.config.sphereGrid&&this.config.sphereGrid.enabled){const{latCount:s,lonCount:r,lineColor:a,opacity:l}=this.config.sphereGrid,h=new THREE.Group,m=new THREE.Color(a),g=new THREE.LineBasicMaterial({color:m,transparent:!0,opacity:l,depthWrite:!1});for(let c=1;c<s;c++){const d=Math.PI*(c/s)-Math.PI/2,n=this.config.radius*Math.cos(d),f=this.config.radius*Math.sin(d),u=128,p=[];for(let E=0;E<=u;E++){const y=E/u*Math.PI*2,b=n*Math.cos(y),T=n*Math.sin(y);p.push(new THREE.Vector3(b,f,T))}const v=new THREE.BufferGeometry().setFromPoints(p),w=new THREE.Line(v,g);h.add(w)}for(let c=0;c<r;c++){const d=c/r*Math.PI*2,n=128,f=[];for(let v=0;v<=n;v++){const w=-Math.PI/2+v/n*Math.PI,E=this.config.radius*Math.cos(w)*Math.cos(d),y=this.config.radius*Math.sin(w),b=this.config.radius*Math.cos(w)*Math.sin(d);f.push(new THREE.Vector3(E,y,b))}const u=new THREE.BufferGeometry().setFromPoints(f),p=new THREE.Line(u,g);h.add(p)}this.globeGroup.add(h),this.sphereGridGroup=h}const i=new THREE.SphereGeometry(this.config.radius*.2,32,32),o=new THREE.MeshBasicMaterial({color:this.config.sphereColor,transparent:!0,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:!1});if(this.coreMesh=new THREE.Mesh(i,o),this.globeGroup.add(this.coreMesh),this.config.sphereEffects==="glow"){const s=new THREE.SphereGeometry(this.config.radius*1.1,64,64),r=new THREE.ShaderMaterial({uniforms:{c:{value:.35},p:{value:2.4},glowColor:{value:new THREE.Color(this.config.sphereColor)},viewVector:{value:new THREE.Vector3(0,0,1)}},vertexShader:`
          uniform vec3 viewVector;
          uniform float c;
          uniform float p;
          varying float intensity;
          void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            intensity = pow(c - dot(vNormal, vNormel), p);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,fragmentShader:`
          uniform vec3 glowColor;
          varying float intensity;
          void main() {
            gl_FragColor = vec4(glowColor, intensity);
          }
        `,side:THREE.BackSide,blending:THREE.AdditiveBlending,transparent:!0,depthWrite:!1});this.glowMesh=new THREE.Mesh(s,r),this.globeGroup.add(this.glowMesh)}this.config.undulation&&this.config.undulation.enabled&&typeof window.createNoise3D=="function"&&(this.noise3D=window.createNoise3D())}applyUndulation(t){const{amplitude:e,frequency:i}=this.config.undulation,o=window.createNoise3D(),s=t.attributes.position;for(let r=0;r<s.count;r++){const a=new THREE.Vector3().fromBufferAttribute(s,r),l=a.clone(),h=o(a.x*i,a.y*i,a.z*i);a.normalize().multiplyScalar(this.config.radius+h*e),s.setXYZ(r,a.x,a.y,a.z)}s.needsUpdate=!0,t.computeVertexNormals()}extractTags(){const t=this.container.querySelectorAll("a");this.tags=Array.from(t).map((e,i)=>{const o=parseFloat(e.dataset.weight)||.5,s=this.config.colors[i%this.config.colors.length];return{text:e.textContent.trim(),url:e.href,weight:o,color:s,fontSize:this.config.minFontSize+(this.config.maxFontSize-this.config.minFontSize)*o,position:new THREE.Vector3,originalColor:s,isHovered:!1,mesh:null}}),t.forEach(e=>e.style.display="none")}createTagObjects(){this.generateSpherePositions(),this.tags.forEach((t,e)=>{const i=this.createTagMesh(t);i&&(t.mesh=i,i.userData={tag:t,index:e},this.tagObjects.push(i),this.globeGroup.add(i))})}createTagMesh(t){const e=t.fontSize,i=this.config.fontFamily,o=this.config.textStyle==="clean"?this.renderCleanTextCanvas.bind(this):this.renderNeonTextCanvas.bind(this),{canvas:s,textWidth:r,textHeight:a}=o(t.text,e,i,t.color),l=this.createTextureFromCanvas(s),h=o(t.text,e,i,this.config.hoverColor).canvas,m=this.createTextureFromCanvas(h),g=new THREE.SpriteMaterial({map:l,transparent:!0,alphaTest:.1}),c=new THREE.Sprite(g),d=.55+t.weight*.6;return c.scale.set(r*d*.32,a*d*.32,1),c.position.copy(t.position),t.normalTexture=l,t.hoverTexture=m,c}generateSpherePositions(){const t=this.tags.length,e=Math.PI*(3-Math.sqrt(5));for(let i=0;i<t;i++){const o=this.tags[i],s=1-i/(t-1)*2,r=Math.sqrt(1-s*s),a=e*i,l=Math.cos(a)*r,h=Math.sin(a)*r,m=new THREE.Vector3(l,s,h),g=.25,c=new THREE.Vector3((Math.random()-.5)*2,(Math.random()-.5)*2,(Math.random()-.5)*2);c.normalize().multiplyScalar(Math.random()*g),m.add(c),m.normalize(),o.position.copy(m).multiplyScalar(this.config.radius)}}bindEvents(){this.renderer.domElement.addEventListener("mousemove",this.onMouseMove.bind(this)),this.renderer.domElement.addEventListener("click",this.onClick.bind(this)),this.config.responsive&&window.addEventListener("resize",this.onResize.bind(this))}onMouseMove(t){const e=this.renderer.domElement.getBoundingClientRect();this.mouse.x=(t.clientX-e.left)/e.width*2-1,this.mouse.y=-((t.clientY-e.top)/e.height)*2+1,this.checkHover()}onClick(t){const e=this.renderer.domElement.getBoundingClientRect();this.mouse.x=(t.clientX-e.left)/e.width*2-1,this.mouse.y=-((t.clientY-e.top)/e.height)*2+1,this.raycaster.setFromCamera(this.mouse,this.camera);let i=this.raycaster.intersectObjects(this.tagObjects);if(i=i.filter(o=>this.isTagFrontFacing(o.object)),i.length>0){const o=i[0].object,s=o.userData.tag;this.config.onTagClick?this.config.onTagClick(s):window.open(s.url,"_blank"),this.animateTagClick(o)}}checkHover(){this.raycaster.setFromCamera(this.mouse,this.camera),this._lastHoverTs||(this._lastHoverTs=0);const t=performance.now();if(t-this._lastHoverTs<(this.config.performance.hoverThrottleMs||0))return;this._lastHoverTs=t;let e=this.raycaster.intersectObjects(this.tagObjects,!0);if(e=e.filter(i=>this.isTagFrontFacing(i.object)),this.tagObjects.forEach(i=>{const o=i.userData.tag;o.isHovered&&(o.isHovered=!1,this.resetTagAppearance(i))}),this.renderer.domElement.style.cursor="default",e.length>0){const i=e[0].object,o=i.userData.tag;o.isHovered||(o.isHovered=!0,this.highlightTag(i),this.renderer.domElement.style.cursor="pointer",this.config.onTagHover&&this.config.onTagHover(o)),this.hoveredTag=i}else this.hoveredTag=null}isTagFrontFacing(t){if(!this.camera||!t)return!1;const e=new THREE.Vector3;t.getWorldPosition(e);const i=new THREE.Vector3;this.camera.getWorldDirection(i);const o=i.clone().negate();return e.clone().normalize().dot(o)>.05}highlightTag(t){t.scale.multiplyScalar(1.2);const e=t.userData.tag;this.updateTagColor(t,this.config.hoverColor)}resetTagAppearance(t){t.scale.divideScalar(1.2);const e=t.userData.tag;this.updateTagColor(t,e.originalColor)}updateTagColor(t,e){const i=t.userData.tag,o=i.fontSize,s=this.config.fontFamily;if(this.config.hoverColor&&e===this.config.hoverColor&&i.hoverTexture)t.material.map=i.hoverTexture;else if(e===i.originalColor&&i.normalTexture)t.material.map=i.normalTexture;else{const r=this.config.textStyle==="clean"?this.renderCleanTextCanvas.bind(this):this.renderNeonTextCanvas.bind(this),{canvas:a}=r(i.text,o,s,e),l=this.createTextureFromCanvas(a);t.material.map=l}t.material.needsUpdate=!0}renderNeonTextCanvas(t,e,i,o){const s=Math.min(window.devicePixelRatio||1,2),a=document.createElement("canvas").getContext("2d");a.font=`${e}px ${i}`;const l=a.measureText(t).width,h=e,m=24,g=Math.pow(2,Math.ceil(Math.log2(l+m*2))),c=Math.pow(2,Math.ceil(Math.log2(h+m*2))),d=document.createElement("canvas");d.width=g*s,d.height=c*s;const n=d.getContext("2d");n.scale(s,s),n.imageSmoothingEnabled=!0,n.clearRect(0,0,g,c),n.textAlign="center",n.textBaseline="middle",n.font=`${e}px ${i}`;const f=g/2,u=c/2,p=this.parseColor(o),v=this.toRGBA(p,1),w=this.toRGBA(p,.5),E=this.toRGBA(this.lighten(p,.25),.9),y=this.toHex(this.lighten(p,.35)),b=this.toHex(this.lighten(p,-.05)),T=n.createLinearGradient(0,u-e,0,u+e);return T.addColorStop(0,y),T.addColorStop(1,b),n.globalCompositeOperation="source-over",n.shadowColor=w,n.shadowBlur=24,n.fillStyle=T,n.fillText(t,f,u),n.shadowBlur=48,n.fillText(t,f,u),n.shadowBlur=0,n.lineWidth=Math.max(2,Math.floor(e*.08)),n.strokeStyle=E,n.strokeText(t,f,u),n.shadowColor=v,n.shadowBlur=18,n.fillStyle=T,n.fillText(t,f,u),n.shadowBlur=0,{canvas:d,textWidth:l,textHeight:h,logicalWidth:g,logicalHeight:c}}parseColor(t){if(typeof t=="string"&&t.startsWith("#")&&t.length===7){const e=parseInt(t.slice(1,3),16),i=parseInt(t.slice(3,5),16),o=parseInt(t.slice(5,7),16);return{r:e,g:i,b:o}}if(typeof t=="number"){const e=t>>16&255,i=t>>8&255,o=t&255;return{r:e,g:i,b:o}}return{r:0,g:255,b:136}}toRGBA({r:t,g:e,b:i},o=1){return`rgba(${t}, ${e}, ${i}, ${o})`}toHex({r:t,g:e,b:i}){const o=s=>s.toString(16).padStart(2,"0");return`#${o(Math.max(0,Math.min(255,Math.round(t))))}${o(Math.max(0,Math.min(255,Math.round(e))))}${o(Math.max(0,Math.min(255,Math.round(i))))}`}lighten({r:t,g:e,b:i},o=.2){const s=(l,h,m)=>l+(h-l)*m,r=o>=0?255:0,a=Math.abs(o);return{r:s(t,r,a),g:s(e,r,a),b:s(i,r,a)}}renderCleanTextCanvas(t,e,i,o){const s=Math.min(window.devicePixelRatio||1,2),a=document.createElement("canvas").getContext("2d");a.font=`${e}px ${i}`;const l=Math.ceil(a.measureText(t).width),h=e,m=8,g=4,c=Math.pow(2,Math.ceil(Math.log2(l+m*2))),d=Math.pow(2,Math.ceil(Math.log2(h+g*2))),n=document.createElement("canvas");n.width=c*s,n.height=d*s;const f=n.getContext("2d");f.scale(s,s),f.imageSmoothingEnabled=!0,f.clearRect(0,0,c,d),f.textAlign="center",f.textBaseline="middle",f.font=`${e}px ${i}`;const u=c/2,p=d/2,v=this.parseColor(o),w=this.toRGBA(v,1),E=this.toRGBA(this.lighten(v,-.5),1);return f.fillStyle=w,f.strokeStyle=E,f.lineWidth=Math.max(1,Math.floor(e*.06)),f.strokeText(t,u,p),f.fillText(t,u,p),{canvas:n,textWidth:l,textHeight:h,logicalWidth:c,logicalHeight:d}}createTextureFromCanvas(t){const e=new THREE.CanvasTexture(t);return e.needsUpdate=!0,e.minFilter=THREE.LinearFilter,e.magFilter=THREE.LinearFilter,e}animateTagClick(t){const e=t.scale.clone();t.scale.multiplyScalar(1.5);const i=()=>{t.scale.lerp(e,.1),t.scale.distanceTo(e)>.01?requestAnimationFrame(i):t.scale.copy(e)};setTimeout(i,100)}onResize(){if(!this.config.responsive)return;const t=this.container.getBoundingClientRect(),e=t.width,i=t.height,o=this.config.width/this.config.height;let s,r;e/i>o?(r=i,s=i*o):(s=e,r=e/o),this.camera.aspect=s/r,this.camera.updateProjectionMatrix(),this.renderer.setSize(s,r)}animate(){if(!this.isActive)return;this._lastFrameTs||(this._lastFrameTs=performance.now());const t=this.config.performance.fpsCap||0;if(t>0){const e=1e3/t,i=performance.now();if(i-this._lastFrameTs<e){this.animationId=requestAnimationFrame(this.animate.bind(this));return}this._lastFrameTs=i}if(this.controls&&this.controls.update(),this.backgroundGrid&&this.backgroundGrid.material&&this.backgroundGrid.material.uniforms&&(this.config.grid.clean||(this.backgroundGrid.material.uniforms.uTime.value+=.016)),this.backgroundGrids&&this.backgroundGrids.length)for(let e=0;e<this.backgroundGrids.length;e++){const i=this.backgroundGrids[e];i.material&&i.material.uniforms&&(i.material.uniforms.uTime.value+=.012+e*.004)}if(this.floorGrid&&this.floorGrid.material&&this.floorGrid.material.uniforms&&(this.floorGrid.material.uniforms.uTime.value+=.01,this.camera&&this.floorGrid.material.uniforms.uCameraPos.value.copy(this.camera.position)),this.particleSystem&&(this.particleSystem.rotation.y+=this.config.particles.rotationSpeed*.01),this.time+=.016,this.sphere&&this.sphere.geometry&&this.noise3D&&this.originalSpherePositions){const e=this.sphere.geometry.attributes.position,i=e.array,o=this.originalSpherePositions,{amplitude:s,frequency:r}=this.config.undulation;for(let a=0;a<i.length;a+=3){const l=o[a],h=o[a+1],m=o[a+2],g=Math.sqrt(l*l+h*h+m*m)||1,c=l/g,d=h/g,n=m/g,f=this.noise3D(c*r+this.time*.2,d*r,n*r),u=this.config.radius+f*s;i[a]=c*u,i[a+1]=d*u,i[a+2]=n*u}e.needsUpdate=!0,this.sphere.geometry.computeVertexNormals()}if(this.glowMesh&&this.camera){const e=this.glowMesh.material.uniforms;e.viewVector.value=new THREE.Vector3().subVectors(this.camera.position,this.glowMesh.position),e.c.value=.35+Math.sin(this.time*.8)*.05,e.p.value=2.2+Math.sin(this.time*.6)*.3}if(this.globeGroup&&this.config.rotation&&this.config.rotation.auto){const e=this.config.rotation.speed,i=this.config.rotation.wobbleSpeed,o=this.config.rotation.wobbleAmp;this.globeGroup.rotation.y+=e,this.globeGroup.rotation.x+=e*.63,this.globeGroup.rotation.z=Math.sin(this.time*i)*o}this.renderer.render(this.scene,this.camera),this.animationId=requestAnimationFrame(this.animate.bind(this))}destroy(){this.isActive=!1,this.animationId&&cancelAnimationFrame(this.animationId),this.scene&&(this.tagObjects.forEach(t=>{t.material.map&&t.material.map.dispose(),t.material.dispose(),this.scene.remove(t)}),this.sphere&&(this.sphere.geometry.dispose(),this.sphere.material.dispose(),this.scene.remove(this.sphere)),this.glowMesh&&(this.scene.remove(this.glowMesh),this.glowMesh.material&&this.glowMesh.material.dispose&&this.glowMesh.material.dispose(),this.glowMesh.geometry&&this.glowMesh.geometry.dispose&&this.glowMesh.geometry.dispose(),this.glowMesh=null),this.coreMesh&&(this.scene.remove(this.coreMesh),this.coreMesh.material&&this.coreMesh.material.dispose&&this.coreMesh.material.dispose(),this.coreMesh.geometry&&this.coreMesh.geometry.dispose&&this.coreMesh.geometry.dispose(),this.coreMesh=null),this.backgroundGrid&&(this.scene.remove(this.backgroundGrid),this.backgroundGrid.material&&this.backgroundGrid.material.dispose&&this.backgroundGrid.material.dispose(),this.backgroundGrid.geometry&&this.backgroundGrid.geometry.dispose&&this.backgroundGrid.geometry.dispose(),this.backgroundGrid=null),this.backgroundGrids&&this.backgroundGrids.length&&(this.backgroundGrids.forEach(t=>{this.scene.remove(t),t.material&&t.material.dispose&&t.material.dispose(),t.geometry&&t.geometry.dispose&&t.geometry.dispose()}),this.backgroundGrids=[]),this.floorGrid&&(this.scene.remove(this.floorGrid),this.floorGrid.material&&this.floorGrid.material.dispose&&this.floorGrid.material.dispose(),this.floorGrid.geometry&&this.floorGrid.geometry.dispose&&this.floorGrid.geometry.dispose(),this.floorGrid=null),this.particleSystem&&(this.scene.remove(this.particleSystem),this.particleSystem.material&&this.particleSystem.material.dispose&&this.particleSystem.material.dispose(),this.particleSystem.geometry&&this.particleSystem.geometry.dispose&&this.particleSystem.geometry.dispose(),this.particleSystem=null)),this.renderer&&this.renderer.domElement&&this.renderer.domElement.parentNode&&(this.renderer.domElement.parentNode.removeChild(this.renderer.domElement),this.renderer.dispose()),this.controls&&this.controls.dispose()}pause(){this.isActive=!1,this.animationId&&cancelAnimationFrame(this.animationId),this.controls&&(this.controls.autoRotate=!1)}resume(){this.isActive||(this.isActive=!0,this.controls&&(this.controls.autoRotate=this.config.autoRotate),this.animate())}updateConfig(t){Object.assign(this.config,t),this.controls&&(this.controls.autoRotate=this.config.autoRotate,this.controls.autoRotateSpeed=this.config.autoRotateSpeed,this.controls.enableZoom=this.config.enableZoom,this.controls.enableRotate=this.config.enableRotate,this.controls.enablePan=this.config.enablePan),this.sphere&&(this.sphere.material.opacity=this.config.sphereOpacity,this.sphere.visible=this.config.showSphere)}setRadius(t){this.config.radius=t,this.generateSpherePositions(),this.tags.forEach(e=>{e.mesh&&e.mesh.position.copy(e.position)}),this.sphere&&this.sphere.scale.setScalar(t/100)}setColors(t){this.config.colors=t,this.tags.forEach((e,i)=>{const o=t[i%t.length];e.originalColor=o,e.color=o,e.mesh&&!e.isHovered&&this.updateTagColor(e.mesh,o)})}setCameraDistance(t){this.config.cameraDistance=t,this.camera.position.setLength(t)}resetCamera(){this.camera.position.set(0,0,this.config.cameraDistance),this.camera.lookAt(0,0,0),this.controls&&this.controls.reset()}getTagByText(t){return this.tags.find(e=>e.text===t)}highlightTagByText(t){const e=this.getTagByText(t);e&&e.mesh&&(this.highlightTag(e.mesh),e.isHovered=!0)}unhighlightAll(){this.tagObjects.forEach(t=>this.resetTagAppearance(t)),this.hoveredTag=null}}export{x as CustomTagCloud};
