const DEFAULT_LOCALE="zh-tw",SUPPORTED_LOCALES=["zh-tw","en"],TRANSLATIONS={"zh-tw":{formTitle:"\u7559\u4E0B\u4F60\u7684\u60F3\u6CD5",namePlaceholder:"\u4F60\u7684\u540D\u5B57 *",emailPlaceholder:"Email (\u4E0D\u6703\u516C\u958B\u986F\u793A)",contentPlaceholder:"\u5BEB\u4E0B\u4F60\u7684\u7559\u8A00... *",submitButton:"\u767C\u8868\u7559\u8A00",submitting:"\u767C\u8868\u4E2D...",requiredFields:"\u8ACB\u586B\u5BEB\u5FC5\u8981\u6B04\u4F4D",successMessage:"\u7559\u8A00\u5DF2\u6210\u529F\u767C\u8868",failureMessage:"\u7559\u8A00\u63D0\u4EA4\u5931\u6557\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66",loadFailureMessage:"\u8F09\u5165\u7559\u8A00\u5931\u6557",commentsTitle:n=>n===void 0?"\u7559\u8A00":`\u7559\u8A00 (${n})`,loadMore:"\u8F09\u5165\u66F4\u591A\u7559\u8A00",noComments:"\u9084\u6C92\u6709\u7559\u8A00\uFF0C\u6210\u70BA\u7B2C\u4E00\u500B\u7559\u8A00\u7684\u4EBA\u5427",timeJustNow:"\u525B\u525B",timeMinutesAgo:n=>`${n} \u5206\u9418\u524D`,timeHoursAgo:n=>`${n} \u5C0F\u6642\u524D`,timeDaysAgo:n=>`${n} \u5929\u524D`,dateLocale:"zh-TW"},en:{formTitle:"Share Your Thoughts",namePlaceholder:"Your Name *",emailPlaceholder:"Email (will not be displayed)",contentPlaceholder:"Write your comment... *",submitButton:"Post Comment",submitting:"Posting...",requiredFields:"Please fill in the required fields",successMessage:"Your comment has been posted",failureMessage:"Failed to submit your comment. Please try again later.",loadFailureMessage:"Failed to load comments",commentsTitle:n=>n===void 0?"Comments":`Comments (${n})`,loadMore:"Load more comments",noComments:"No comments yet. Be the first to share one.",timeJustNow:"just now",timeMinutesAgo:n=>n===1?"1 minute ago":`${n} minutes ago`,timeHoursAgo:n=>n===1?"1 hour ago":`${n} hours ago`,timeDaysAgo:n=>n===1?"1 day ago":`${n} days ago`,dateLocale:"en-US"}};class CommentSystemCompat{constructor(e,t){if(this.postId=e,this.container=document.getElementById(t),this.comments=[],this.lastVisible=null,this.loading=!1,this.pageSize=10,this.locale=this.detectLocale(),!this.container){console.error("Comment container not found:",t);return}if(!window.db){console.error("Firebase not initialized");return}this.init()}init(){this.renderCommentForm(),this.loadComments(),this.setupEventListeners()}renderCommentForm(){const e=(s,...o)=>this.t(s,...o),t=`
      <div class="comment-form-wrapper">
        <h3 class="comment-title">${e("formTitle")}</h3>
        <form id="comment-form" class="comment-form">
          <div class="form-group">
            <input type="text" id="author-name" placeholder="${e("namePlaceholder")}" required maxlength="50">
          </div>
          <div class="form-group">
            <input type="email" id="author-email" placeholder="${e("emailPlaceholder")}" maxlength="100">
          </div>
          <div class="form-group">
            <textarea id="comment-content" placeholder="${e("contentPlaceholder")}" required maxlength="500" rows="4"></textarea>
            <div class="char-counter">
              <span id="char-count">0</span>/500
            </div>
          </div>
          <button type="submit" id="submit-btn" class="submit-btn">
            <span class="btn-text">${e("submitButton")}</span>
            <span class="btn-loading" style="display: none;">
              <svg class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
              ${e("submitting")}
            </span>
          </button>
        </form>
      </div>
    `;this.container.innerHTML=t}setupEventListeners(){const e=document.getElementById("comment-form"),t=document.getElementById("comment-content"),s=document.getElementById("char-count");t.addEventListener("input",()=>{const o=t.value.length;s.textContent=o,o>450?s.style.color="#e74c3c":o>400?s.style.color="#f39c12":s.style.color="#7f8c8d"}),e.addEventListener("submit",async o=>{o.preventDefault(),await this.submitComment()})}async submitComment(){const e=document.getElementById("submit-btn"),t=e.querySelector(".btn-text"),s=e.querySelector(".btn-loading"),o=document.getElementById("author-name").value.trim(),i=document.getElementById("author-email").value.trim(),a=document.getElementById("comment-content").value.trim();if(!o||!a){this.showMessage(this.t("requiredFields"),"error");return}e.disabled=!0,t.style.display="none",s.style.display="flex";try{const r={postId:this.postId,author:{name:o,email:i||null,ip:await this.getClientIP()},content:a,timestamp:firebase.firestore.FieldValue.serverTimestamp(),approved:!0,replies:[]};await window.db.collection("comments").add(r),document.getElementById("comment-form").reset(),document.getElementById("char-count").textContent="0",this.showMessage(this.t("successMessage"),"success")}catch(r){console.error("Error adding comment:",r),this.showMessage(this.t("failureMessage"),"error")}finally{e.disabled=!1,t.style.display="inline",s.style.display="none"}}async loadComments(){if(!this.loading){this.loading=!0;try{let e=window.db.collection("comments").where("postId","==",this.postId).orderBy("timestamp","desc").limit(this.pageSize);this.lastVisible&&(e=e.startAfter(this.lastVisible));const t=await e.get();if(t.empty)this.comments.length===0&&this.renderNoComments();else{const s=[];t.forEach(o=>{s.push({id:o.id,...o.data()})}),this.comments=[...this.comments,...s],this.lastVisible=t.docs[t.docs.length-1],this.renderComments()}}catch(e){console.error("Error loading comments:",e),this.showMessage(this.t("loadFailureMessage"),"error")}finally{this.loading=!1}}}renderComments(){this.clearExistingCommentsSection();const e=`
      <div class="comments-section">
        <h3 class="comments-title">${this.t("commentsTitle",this.comments.length)}</h3>
        <div class="comments-list">
          ${this.comments.map(t=>this.renderComment(t)).join("")}
        </div>
        ${this.comments.length>=this.pageSize?`<button class="load-more-btn" onclick="commentSystem.loadMoreComments()">${this.t("loadMore")}</button>`:""}
      </div>
    `;this.container.insertAdjacentHTML("beforeend",e)}renderNoComments(){this.clearExistingCommentsSection();const e=`
      <div class="comments-section">
        <h3 class="comments-title">${this.t("commentsTitle")}</h3>
        <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
          <p>${this.t("noComments")}</p>
        </div>
      </div>
    `;this.container.insertAdjacentHTML("beforeend",e)}renderComment(e){var i,a;const t=(i=e.timestamp)!=null&&i.toDate?e.timestamp.toDate():new Date(((a=e.timestamp)==null?void 0:a.seconds)*1e3||Date.now()),s=this.getTimeAgo(t),o=this.generateAvatar(e.author.name);return`
      <div class="comment" data-comment-id="${e.id}">
        <div class="comment-avatar">
          ${o}
        </div>
        <div class="comment-content">
          <div class="comment-meta">
            <span class="comment-author">
              ${e.author.name}
            </span>
            <span class="comment-time">${s}</span>
          </div>
          <div class="comment-text">
            ${this.formatCommentContent(e.content)}
          </div>
        </div>
      </div>
    `}formatCommentContent(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>").replace(/https?:\/\/[^\s<]+/g,'<a href="$&" target="_blank" rel="noopener">$&</a>')}generateAvatar(e){const t=["#3498db","#e74c3c","#2ecc71","#f39c12","#9b59b6","#1abc9c"],s=e.charCodeAt(0)%t.length,o=e.charAt(0).toUpperCase();return`
      <div class="avatar" style="background-color: ${t[s]}">
        ${o}
      </div>
    `}getTimeAgo(e){const s=new Date-e,o=Math.floor(s/6e4),i=Math.floor(s/36e5),a=Math.floor(s/864e5);return o<1?this.t("timeJustNow"):o<60?this.t("timeMinutesAgo",o):i<24?this.t("timeHoursAgo",i):a<7?this.t("timeDaysAgo",a):e.toLocaleDateString(this.t("dateLocale"))}async getClientIP(){try{return(await(await fetch("https://api.ipify.org?format=json")).json()).ip}catch(e){return"unknown"}}showMessage(e,t="info"){const s=this.container.querySelector(".comment-message");s&&s.remove();const o=document.createElement("div");o.className=`comment-message comment-message--${t}`,o.textContent=e,this.container.insertBefore(o,this.container.firstChild),setTimeout(()=>{o.parentNode&&o.remove()},5e3)}loadMoreComments(){this.loadComments()}detectLocale(){var s;const e=this.getPathLocale();if(e)return e;const t=(((s=document.documentElement)==null?void 0:s.lang)||"").toLowerCase();return SUPPORTED_LOCALES.includes(t)?t:DEFAULT_LOCALE}getPathLocale(){return window.location.pathname.toLowerCase().split("/").filter(Boolean).find(e=>SUPPORTED_LOCALES.includes(e))}t(e,...t){const s=TRANSLATIONS[this.locale]||TRANSLATIONS[DEFAULT_LOCALE],o=TRANSLATIONS[DEFAULT_LOCALE],i=s[e]!==void 0?s[e]:o[e];return typeof i=="function"?i(...t):i}clearExistingCommentsSection(){const e=this.container.querySelector(".comments-section");e&&e.remove()}}window.CommentSystemCompat=CommentSystemCompat;
