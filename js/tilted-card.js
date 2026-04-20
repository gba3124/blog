class TiltedCard{constructor(e,t={}){this.element=e,this.options={rotateAmplitude:t.rotateAmplitude||12,scaleOnHover:t.scaleOnHover||1.1,captionText:t.captionText||"",showTooltip:t.showTooltip!==!1,showMobileWarning:t.showMobileWarning===!0,springValues:{damping:.9,stiffness:.1,mass:1},...t},this.rotateX=0,this.rotateY=0,this.scale=1,this.opacity=0,this.captionRotate=0,this.lastY=0,this.targetRotateX=0,this.targetRotateY=0,this.targetScale=1,this.targetOpacity=0,this.targetCaptionRotate=0,this.animationFrame=null,this.tooltip=null,this.mouseX=0,this.mouseY=0,this.init()}init(){this.element&&(this.setupStyles(),this.options.showTooltip&&this.options.captionText&&this.createTooltip(),this.options.showMobileWarning&&this.createMobileWarning(),this.setupEventListeners(),this.startAnimation())}setupStyles(){this.element.style.perspective="800px",this.element.style.transformStyle="preserve-3d",this.element.style.transition="transform 0.1s ease-out",this.element.style.borderRadius="15px",this.element.style.overflow="hidden",this.element.style.cursor="pointer",this.element.style.willChange="transform"}createTooltip(){this.tooltip=document.createElement("div"),this.tooltip.className="tilted-card-tooltip",this.tooltip.textContent=this.options.captionText,this.tooltip.style.cssText=`
      position: fixed;
      left: 0;
      top: 0;
      border-radius: 4px;
      background-color: #fff;
      padding: 4px 10px;
      font-size: 10px;
      color: #2d2d2d;
      opacity: 0;
      z-index: 3;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      white-space: nowrap;
      transform: translateZ(0);
      will-change: transform, opacity;
    `,document.body.appendChild(this.tooltip)}createMobileWarning(){const e=document.createElement("div");e.className="tilted-card-mobile-warning",e.textContent="This effect is optimized for desktop",e.style.cssText=`
      position: absolute;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      font-size: 0.875rem;
      color: #666;
      background: rgba(0, 0, 0, 0.9);
      padding: 4px 8px;
      border-radius: 4px;
      display: none;
      z-index: 4;
    `,window.innerWidth<=640&&(e.style.display="block"),this.element.style.position="relative",this.element.appendChild(e)}setupEventListeners(){this.handleMouseMove=this.handleMouseMove.bind(this),this.handleMouseEnter=this.handleMouseEnter.bind(this),this.handleMouseLeave=this.handleMouseLeave.bind(this),this.element.addEventListener("mousemove",this.handleMouseMove),this.element.addEventListener("mouseenter",this.handleMouseEnter),this.element.addEventListener("mouseleave",this.handleMouseLeave)}handleMouseMove(e){const t=this.element.getBoundingClientRect(),i=e.clientX-t.left-t.width/2,o=e.clientY-t.top-t.height/2;this.targetRotateX=o/(t.height/2)*-this.options.rotateAmplitude,this.targetRotateY=i/(t.width/2)*this.options.rotateAmplitude,this.mouseX=e.clientX-t.left,this.mouseY=e.clientY-t.top;const n=o-this.lastY;this.targetCaptionRotate=-n*.3,this.lastY=o}handleMouseEnter(){this.targetScale=this.options.scaleOnHover,this.targetOpacity=1,typeof this._ensureAnimating=="function"&&this._ensureAnimating()}handleMouseLeave(){this.targetScale=1,this.targetOpacity=0,this.targetRotateX=0,this.targetRotateY=0,this.targetCaptionRotate=0,typeof this._ensureAnimating=="function"&&this._ensureAnimating()}lerp(e,t,i){return e+(t-e)*i}updateAnimation(){const{damping:e,stiffness:t}=this.options.springValues;if(this.rotateX=this.lerp(this.rotateX,this.targetRotateX,t),this.rotateY=this.lerp(this.rotateY,this.targetRotateY,t),this.scale=this.lerp(this.scale,this.targetScale,t),this.opacity=this.lerp(this.opacity,this.targetOpacity,t*2),this.captionRotate=this.lerp(this.captionRotate,this.targetCaptionRotate,t*1.5),this.element.style.transform=`
      perspective(800px) 
      rotateX(${this.rotateX}deg) 
      rotateY(${this.rotateY}deg) 
      scale(${this.scale})
    `,this.tooltip){const i=this.element.getBoundingClientRect();this.tooltip.style.left=`${i.left+this.mouseX+10}px`,this.tooltip.style.top=`${i.top+this.mouseY+20}px`,this.tooltip.style.opacity=this.opacity,this.tooltip.style.transform=`rotate(${this.captionRotate}deg) translateZ(0)`}}startAnimation(){const e=()=>{this.updateAnimation(),this.targetOpacity>0||Math.abs(this.rotateX)>.01||Math.abs(this.rotateY)>.01||Math.abs(this.scale-1)>.001?this.animationFrame=requestAnimationFrame(e):this.animationFrame=null};this._tick=e,this._ensureAnimating=()=>{this.animationFrame||(this.animationFrame=requestAnimationFrame(this._tick))}}destroy(){this.animationFrame&&cancelAnimationFrame(this.animationFrame),this.element.removeEventListener("mousemove",this.handleMouseMove),this.element.removeEventListener("mouseenter",this.handleMouseEnter),this.element.removeEventListener("mouseleave",this.handleMouseLeave),this.tooltip&&this.tooltip.parentNode&&this.tooltip.parentNode.removeChild(this.tooltip),this.element.style.transform="",this.element.style.perspective="",this.element.style.transformStyle=""}}document.addEventListener("DOMContentLoaded",()=>{const s=document.querySelector(".about-photo");s&&new TiltedCard(s,{rotateAmplitude:8,scaleOnHover:1.05,captionText:"This is Owen.",showTooltip:!0,showMobileWarning:!1})}),window.TiltedCard=TiltedCard;
