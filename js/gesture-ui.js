class GestureUI{constructor(t){var e,s;this.gestureControl=t,this.container=null,this.isExpanded=!1,this.lang=((s=(e=window.themeConfig)==null?void 0:e.lang)==null?void 0:s.gesture)||{},this.init()}t(t,e){return this.lang[t]||e}init(){this.createUI(),this.bindEvents(),this.setupGestureControlListeners(),this.syncUIWithConfig()}syncUIWithConfig(){var a;const t=this.container.querySelector('[data-setting="debug"]');t&&(t.checked=this.gestureControl.config.debug);const e=this.container.querySelector('input[data-setting="sensitivity"]'),s=this.container.querySelector('.setting-val[data-setting="sensitivity"]');e&&this.gestureControl.config.sensitivity&&(e.value=this.gestureControl.config.sensitivity,s&&(s.textContent=`${this.gestureControl.config.sensitivity}\xD7`));const i=this.container.querySelector('input[data-setting="scrollSpeed"]'),c=this.container.querySelector('.setting-val[data-setting="scrollSpeed"]');i&&((a=this.gestureControl.config.scroll)!=null&&a.speed)&&(i.value=this.gestureControl.config.scroll.speed,c&&(c.textContent=`${this.gestureControl.config.scroll.speed}\xD7`))}createUI(){this.container=document.createElement("div"),this.container.className="gesture-arc",this.container.innerHTML=`
      <!-- \u6536\u76D2\u72C0\u614B\u7684\u72C0\u614B\u71C8 -->
      <div class="gesture-arc-collapsed">
        <div class="arc-status-dots">
          <div class="arc-dot" data-status="camera" title="${this.t("camera","Camera")}"></div>
          <div class="arc-dot" data-status="tracking" title="${this.t("tracking","Tracking")}"></div>
          <div class="arc-dot" data-status="pinch" title="${this.t("pinch","Pinch")}"></div>
        </div>
        <svg class="arc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
        </svg>
      </div>

      <!-- \u5C55\u958B\u72C0\u614B\u7684\u5167\u5BB9 -->
      <div class="gesture-arc-expanded">
        <div class="arc-header">
          <span class="arc-title">${this.t("title","Gesture Control")}</span>
          <button class="arc-collapse-btn" title="Collapse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <!-- \u72C0\u614B\u6307\u793A\u5668 -->
        <div class="arc-status-row">
          <div class="arc-status-item">
            <div class="arc-status-indicator" data-status="camera"></div>
            <span>${this.t("camera","Camera")}</span>
          </div>
          <div class="arc-status-item">
            <div class="arc-status-indicator" data-status="tracking"></div>
            <span>${this.t("tracking","Tracking")}</span>
          </div>
          <div class="arc-status-item">
            <div class="arc-status-indicator" data-status="pinch"></div>
            <span>${this.t("pinch","Pinch")}</span>
          </div>
        </div>

        <!-- \u4E3B\u958B\u95DC -->
        <button class="arc-toggle-btn" data-state="off">
          <span class="toggle-text">${this.t("start","Start")}</span>
        </button>

        <!-- \u8A2D\u5B9A -->
        <div class="arc-settings">
          <div class="arc-setting">
            <label>
              <span>${this.t("sensitivity","Sensitivity")}</span>
              <span class="setting-val" data-setting="sensitivity">2.8\xD7</span>
            </label>
            <input type="range" data-setting="sensitivity" min="1.5" max="4" value="2.8" step="0.1">
          </div>
          <div class="arc-setting">
            <label>
              <span>${this.t("scroll","Scroll")}</span>
              <span class="setting-val" data-setting="scrollSpeed">5\xD7</span>
            </label>
            <input type="range" data-setting="scrollSpeed" min="2" max="10" value="5" step="0.5">
          </div>
          <div class="arc-setting arc-checkbox">
            <label>
              <input type="checkbox" data-setting="debug">
              <span>${this.t("debug","Debug Mode")}</span>
            </label>
          </div>
        </div>

        <!-- \u4F7F\u7528\u63D0\u793A -->
        <div class="arc-tips">
          <p>${this.t("tip1","1. Move hand to control cursor")}</p>
          <p>${this.t("tip2","2. Pinch to click, drag to scroll")}</p>
        </div>
      </div>
    `,document.body.appendChild(this.container),this.closeButton=document.createElement("div"),this.closeButton.className="gesture-arc-close",this.closeButton.innerHTML=`
      <div class="arc-close-btn">
        <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
        </svg>
        <span class="close-countdown"></span>
      </div>
    `,document.body.appendChild(this.closeButton)}bindEvents(){this.container.querySelector(".gesture-arc-collapsed").addEventListener("click",()=>this.expand()),this.container.querySelector(".arc-collapse-btn").addEventListener("click",n=>{n.stopPropagation(),this.collapse()}),this.container.querySelector(".arc-toggle-btn").addEventListener("click",()=>this.toggleGestureControl()),this.container.querySelectorAll('input[type="range"]').forEach(n=>{n.addEventListener("input",o=>this.handleSettingChange(o))}),this.container.querySelector('[data-setting="debug"]').addEventListener("change",n=>{this.gestureControl.config.debug=n.target.checked,this.gestureControl.state.isActive&&(n.target.checked?this.gestureControl.createDebugCanvas():this.gestureControl.removeDebugCanvas())}),this.closeCountdown=null,this.closeCountdownValue=3,this.isHoveringCloseBtn=!1;const a=this.closeButton.querySelector(".arc-close-btn"),r=this.closeButton.querySelector(".close-countdown");a.addEventListener("mouseenter",()=>{this.gestureControl.state.isActive&&(this.isHoveringCloseBtn=!0,this.startCloseCountdown(r))}),a.addEventListener("mouseleave",()=>{this.isHoveringCloseBtn=!1,this.cancelCloseCountdown(r)}),this.hoverCheckInterval=setInterval(()=>{var d;if(!this.gestureControl.state.isActive||!this.closeButton.classList.contains("visible")||this.closeButton.classList.contains("hidden"))return;const n=a.getBoundingClientRect(),o=(d=window.customCursor)==null?void 0:d.position;if(o){const l=o.x>=n.left&&o.x<=n.right&&o.y>=n.top&&o.y<=n.bottom;l&&!this.isHoveringCloseBtn?(this.isHoveringCloseBtn=!0,this.startCloseCountdown(r)):!l&&this.isHoveringCloseBtn&&!this.closeCountdown||!l&&this.isHoveringCloseBtn&&(this.isHoveringCloseBtn=!1,this.cancelCloseCountdown(r))}},100)}startCloseCountdown(t){this.closeCountdownValue=3,t.textContent=this.closeCountdownValue,this.closeButton.querySelector(".arc-close-btn").classList.add("counting"),this.closeCountdown=setInterval(()=>{this.closeCountdownValue--,this.closeCountdownValue>0?t.textContent=this.closeCountdownValue:(this.cancelCloseCountdown(t),this.gestureControl.stop())},1e3)}cancelCloseCountdown(t){this.closeCountdown&&(clearInterval(this.closeCountdown),this.closeCountdown=null),this.closeCountdownValue=3,t.textContent="",this.closeButton.querySelector(".arc-close-btn").classList.remove("counting")}expand(){this.isExpanded=!0,this.container.classList.add("expanded"),this.closeButton.classList.add("hidden")}collapse(){this.isExpanded=!1,this.container.classList.remove("expanded"),this.closeButton.classList.remove("hidden")}setupGestureControlListeners(){this.gestureControl.on("started",()=>{this.updateToggleButton("on"),this.updateStatus("camera","active"),this.container.classList.add("active"),this.closeButton.classList.add("visible")}),this.gestureControl.on("stopped",()=>{this.updateToggleButton("off"),this.updateStatus("camera","inactive"),this.updateStatus("tracking","inactive"),this.updateStatus("pinch","inactive"),this.container.classList.remove("active"),this.closeButton.classList.remove("visible");const t=this.closeButton.querySelector(".close-countdown");this.cancelCloseCountdown(t)}),this.gestureControl.on("pinchStart",()=>{this.updateStatus("pinch","active")}),this.gestureControl.on("pinchEnd",()=>{this.updateStatus("pinch","inactive")}),this.gestureControl.on("error",t=>{this.showError(t.message)}),setInterval(()=>{this.gestureControl.state.isActive&&this.updateStatus("tracking",this.gestureControl.state.isTracking?"active":"inactive")},100)}async toggleGestureControl(){const t=this.container.querySelector(".arc-toggle-btn");if(t.dataset.state==="off")try{t.disabled=!0,t.querySelector(".toggle-text").textContent=this.t("starting","Starting..."),await this.gestureControl.start(),this.collapse()}catch(s){let i=s.message;s.message==="CAMERA_DENIED"?i=this.t("error_camera_denied","Please allow camera access"):s.message==="CAMERA_NOT_FOUND"&&(i=this.t("error_camera_not_found","No camera found")),this.showError(i),t.dataset.state="off",t.querySelector(".toggle-text").textContent=this.t("start","Start")}finally{t.disabled=!1}else this.gestureControl.stop()}updateToggleButton(t){const e=this.container.querySelector(".arc-toggle-btn");e.dataset.state=t,e.querySelector(".toggle-text").textContent=t==="on"?this.t("stop","Stop"):this.t("start","Start")}updateStatus(t,e){const s=this.container.querySelector(`.arc-status-indicator[data-status="${t}"]`);s&&(s.className="arc-status-indicator",s.classList.add(`status-${e}`));const i=this.container.querySelector(`.arc-dot[data-status="${t}"]`);i&&(i.className="arc-dot",i.classList.add(`status-${e}`))}handleSettingChange(t){const e=t.target.dataset.setting,s=parseFloat(t.target.value),i=this.container.querySelector(`.setting-val[data-setting="${e}"]`);switch(e){case"sensitivity":this.gestureControl.config.sensitivity=s,i.textContent=`${s}\xD7`;break;case"scrollSpeed":this.gestureControl.config.scroll.speed=s,i.textContent=`${s}\xD7`;break}}showError(t){const e=document.createElement("div");e.className="gesture-error-toast",e.innerHTML=`<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;flex-shrink:0"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/></svg>${t}</span>`,document.body.appendChild(e),setTimeout(()=>{e.style.opacity="0",setTimeout(()=>e.remove(),300)},3e3)}destroy(){this.hoverCheckInterval&&clearInterval(this.hoverCheckInterval),this.container&&this.container.remove(),this.closeButton&&this.closeButton.remove()}}typeof window!="undefined"&&(window.GestureUI=GestureUI);
