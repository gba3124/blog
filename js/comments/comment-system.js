import{db as l,collection as d,addDoc as g,query as h,orderBy as p,serverTimestamp as f,where as y,limit as v,startAfter as b,getDocs as C}from"./firebase-config.js";const m="zh-tw",u=["zh-tw","en"],c={"zh-tw":{formTitle:"\u7559\u4E0B\u4F60\u7684\u60F3\u6CD5",namePlaceholder:"\u4F60\u7684\u540D\u5B57 *",emailPlaceholder:"Email (\u4E0D\u6703\u516C\u958B\u986F\u793A)",contentPlaceholder:"\u5BEB\u4E0B\u4F60\u7684\u7559\u8A00... *",submitButton:"\u767C\u8868\u7559\u8A00",submitting:"\u767C\u8868\u4E2D...",requiredFields:"\u8ACB\u586B\u5BEB\u5FC5\u8981\u6B04\u4F4D",successMessage:"\u7559\u8A00\u5DF2\u6210\u529F\u767C\u8868",failureMessage:"\u7559\u8A00\u63D0\u4EA4\u5931\u6557\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66",loadFailureMessage:"\u8F09\u5165\u7559\u8A00\u5931\u6557",commentsTitle:n=>n===void 0?"\u7559\u8A00":`\u7559\u8A00 (${n})`,loadMore:"\u8F09\u5165\u66F4\u591A\u7559\u8A00",noComments:"\u9084\u6C92\u6709\u7559\u8A00\uFF0C\u6210\u70BA\u7B2C\u4E00\u500B\u7559\u8A00\u7684\u4EBA\u5427",timeJustNow:"\u525B\u525B",timeMinutesAgo:n=>`${n} \u5206\u9418\u524D`,timeHoursAgo:n=>`${n} \u5C0F\u6642\u524D`,timeDaysAgo:n=>`${n} \u5929\u524D`,dateLocale:"zh-TW"},en:{formTitle:"Share Your Thoughts",namePlaceholder:"Your Name *",emailPlaceholder:"Email (will not be displayed)",contentPlaceholder:"Write your comment... *",submitButton:"Post Comment",submitting:"Posting...",requiredFields:"Please fill in the required fields",successMessage:"Your comment has been posted",failureMessage:"Failed to submit your comment. Please try again later.",loadFailureMessage:"Failed to load comments",commentsTitle:n=>n===void 0?"Comments":`Comments (${n})`,loadMore:"Load more comments",noComments:"No comments yet. Be the first to share one.",timeJustNow:"just now",timeMinutesAgo:n=>n===1?"1 minute ago":`${n} minutes ago`,timeHoursAgo:n=>n===1?"1 hour ago":`${n} hours ago`,timeDaysAgo:n=>n===1?"1 day ago":`${n} days ago`,dateLocale:"en-US"}};class w{constructor(t,e){if(this.postId=t,this.container=document.getElementById(e),this.comments=[],this.lastVisible=null,this.loading=!1,this.pageSize=10,this.locale=this.detectLocale(),!this.container){console.error("Comment container not found:",e);return}this.init()}init(){this.renderCommentForm(),this.loadComments(),this.setupEventListeners()}renderCommentForm(){const t=(s,...o)=>this.t(s,...o),e=`
      <div class="comment-form-wrapper">
        <h3 class="comment-title">${t("formTitle")}</h3>
        <form id="comment-form" class="comment-form">
          <div class="form-group">
            <input type="text" id="author-name" placeholder="${t("namePlaceholder")}" required maxlength="50">
          </div>
          <div class="form-group">
            <input type="email" id="author-email" placeholder="${t("emailPlaceholder")}" maxlength="100">
          </div>
          <div class="form-group">
            <textarea id="comment-content" placeholder="${t("contentPlaceholder")}" required maxlength="500" rows="4"></textarea>
            <div class="char-counter">
              <span id="char-count">0</span>/500
            </div>
          </div>
          <button type="submit" id="submit-btn" class="submit-btn">
            <span class="btn-text">${t("submitButton")}</span>
            <span class="btn-loading" style="display: none;">
              <svg class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
              ${t("submitting")}
            </span>
          </button>
        </form>
      </div>
    `;this.container.innerHTML=e}setupEventListeners(){const t=document.getElementById("comment-form"),e=document.getElementById("comment-content"),s=document.getElementById("char-count");e.addEventListener("input",()=>{const o=e.value.length;s.textContent=o,o>450?s.style.color="#e74c3c":o>400?s.style.color="#f39c12":s.style.color="#7f8c8d"}),t.addEventListener("submit",async o=>{o.preventDefault(),await this.submitComment()})}async submitComment(){const t=document.getElementById("submit-btn"),e=t.querySelector(".btn-text"),s=t.querySelector(".btn-loading"),o=document.getElementById("author-name").value.trim(),i=document.getElementById("author-email").value.trim(),a=document.getElementById("comment-content").value.trim();if(!o||!a){this.showMessage(this.t("requiredFields"),"error");return}t.disabled=!0,e.style.display="none",s.style.display="flex";try{const r={postId:this.postId,author:{name:o,email:i||null,ip:await this.getClientIP()},content:a,timestamp:f(),approved:!0,replies:[]};await g(d(l,"comments"),r),document.getElementById("comment-form").reset(),document.getElementById("char-count").textContent="0",this.showMessage(this.t("successMessage"),"success")}catch(r){console.error("Error adding comment:",r),this.showMessage(this.t("failureMessage"),"error")}finally{t.disabled=!1,e.style.display="inline",s.style.display="none"}}async loadComments(){if(!this.loading){this.loading=!0;try{let t=h(d(l,"comments"),y("postId","==",this.postId),p("timestamp","desc"),v(this.pageSize));this.lastVisible&&(t=h(t,b(this.lastVisible)));const e=await C(t);if(e.empty)this.comments.length===0&&this.renderNoComments();else{const s=e.docs.map(o=>({id:o.id,...o.data()}));this.comments=[...this.comments,...s],this.lastVisible=e.docs[e.docs.length-1],this.renderComments()}}catch(t){console.error("Error loading comments:",t),this.showMessage(this.t("loadFailureMessage"),"error")}finally{this.loading=!1}}}renderComments(){this.clearExistingCommentsSection();const t=`
      <div class="comments-section">
        <h3 class="comments-title">${this.t("commentsTitle",this.comments.length)}</h3>
        <div class="comments-list">
          ${this.comments.map(e=>this.renderComment(e)).join("")}
        </div>
        ${this.comments.length>=this.pageSize?`<button class="load-more-btn" onclick="commentSystem.loadMoreComments()">${this.t("loadMore")}</button>`:""}
      </div>
    `;this.container.insertAdjacentHTML("beforeend",t)}renderNoComments(){this.clearExistingCommentsSection();const t=`
      <div class="comments-section">
        <h3 class="comments-title">${this.t("commentsTitle")}</h3>
        <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
          <p>${this.t("noComments")}</p>
        </div>
      </div>
    `;this.container.insertAdjacentHTML("beforeend",t)}renderComment(t){var i;const e=(i=t.timestamp)!=null&&i.toDate?t.timestamp.toDate():new Date(t.timestamp),s=this.getTimeAgo(e),o=this.generateAvatar(t.author.name);return`
      <div class="comment" data-comment-id="${t.id}">
        <div class="comment-avatar">
          ${o}
        </div>
        <div class="comment-content">
          <div class="comment-meta">
            <span class="comment-author">
              ${t.author.name}
            </span>
            <span class="comment-time">${s}</span>
          </div>
          <div class="comment-text">
            ${this.formatCommentContent(t.content)}
          </div>
        </div>
      </div>
    `}formatCommentContent(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>").replace(/https?:\/\/[^\s<]+/g,'<a href="$&" target="_blank" rel="noopener">$&</a>')}generateAvatar(t){const e=["#3498db","#e74c3c","#2ecc71","#f39c12","#9b59b6","#1abc9c"],s=t.charCodeAt(0)%e.length,o=t.charAt(0).toUpperCase();return`
      <div class="avatar" style="background-color: ${e[s]}">
        ${o}
      </div>
    `}getTimeAgo(t){const s=new Date-t,o=Math.floor(s/6e4),i=Math.floor(s/36e5),a=Math.floor(s/864e5);return o<1?this.t("timeJustNow"):o<60?this.t("timeMinutesAgo",o):i<24?this.t("timeHoursAgo",i):a<7?this.t("timeDaysAgo",a):t.toLocaleDateString(this.t("dateLocale"))}async getClientIP(){try{return(await(await fetch("https://api.ipify.org?format=json")).json()).ip}catch(t){return"unknown"}}showMessage(t,e="info"){const s=this.container.querySelector(".comment-message");s&&s.remove();const o=document.createElement("div");o.className=`comment-message comment-message--${e}`,o.textContent=t,this.container.insertBefore(o,this.container.firstChild),setTimeout(()=>{o.remove()},5e3)}loadMoreComments(){this.loadComments()}detectLocale(){var s;const t=this.getPathLocale();if(t)return t;const e=(((s=document.documentElement)==null?void 0:s.lang)||"").toLowerCase();return u.includes(e)?e:m}getPathLocale(){return window.location.pathname.toLowerCase().split("/").filter(Boolean).find(t=>u.includes(t))}t(t,...e){const s=c[this.locale]||c[m],o=c[m],i=s[t]!==void 0?s[t]:o[t];return typeof i=="function"?i(...e):i}clearExistingCommentsSection(){const t=this.container.querySelector(".comments-section");t&&t.remove()}}window.CommentSystem=w;
