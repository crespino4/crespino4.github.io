    let TEXTS = {};
    fetch('mrn_00421687.json')
        .then(r => r.json())
        .then(json => { TEXTS = json[0] || json; applyAll(); });

    // 2) Helper to set simple text nodes using data-i18n attributes
    function applyTextKeys(root = document) {
      const nodes = root.querySelectorAll("[data-i18n]");
      nodes.forEach(node => {
        const key = node.getAttribute("data-i18n");
        const value = key.split('.').reduce((acc, k) => (acc && acc[k] != null) ? acc[k] : undefined, TEXTS);
        if (typeof value === "string") node.textContent = value;
      });
    }

    // 3) Render arrays (timeline, medications, results table)
    function renderArrays() {
      // Timeline
      const timelineList = document.getElementById("timelineList");
      if (timelineList) {
        const items = TEXTS.content?.encounter?.timeline?.items || [];
        timelineList.innerHTML = "";
        items.forEach(item => {
          const li = document.createElement("li");
          li.className = "row";
          li.style.cssText = "gap:8px; align-items:flex-start;";
          const dot = document.createElement("span");
          dot.style.cssText = "width:8px;height:8px;border-radius:999px;background:var(--cyan-700); display:inline-block; margin-top:4px;";
          dot.setAttribute("aria-hidden", "true");
          const txt = document.createElement("div");
          txt.textContent = item;
          li.appendChild(dot);
          li.appendChild(txt);
          timelineList.appendChild(li);
        });
      }

      // Medications
      const medsList = document.getElementById("medsList");
      if (medsList) {
        const meds = TEXTS.content?.medications?.list || [];
        const refillLabel = TEXTS.content?.medications?.refillButton || "Refill";
        medsList.innerHTML = "";
        meds.forEach(m => {
          const li = document.createElement("li");
          li.className = "row";
          li.style.cssText = "justify-content:space-between;";
          const span = document.createElement("span");
          span.textContent = m;
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.style.cssText = "padding:4px 8px; font-size:12px; color: var(--cyan-700);";
          btn.textContent = refillLabel;
          li.appendChild(span);
          li.appendChild(btn);
          medsList.appendChild(li);
        });
      }

      // Results table
      const headersTr = document.getElementById("resultsHeaders");
      const bodyTbody = document.getElementById("resultsBody");
      if (headersTr && bodyTbody) {
        const headers = TEXTS.content?.results?.table?.headers || [];
        const rows = TEXTS.content?.results?.table?.rows || [];
        headersTr.innerHTML = "";
        headers.forEach(h => {
          const th = document.createElement("th");
          th.textContent = h;
          headersTr.appendChild(th);
        });
        bodyTbody.innerHTML = "";
        rows.forEach(r => {
          const tr = document.createElement("tr");
          r.forEach(cell => {
            const td = document.createElement("td");
            td.textContent = cell;
            tr.appendChild(td);
          });
          bodyTbody.appendChild(tr);
        });
      }
    }

    // 4) Boot
    function applyAll() {
      applyTextKeys(document);
      renderArrays();
    }

    document.addEventListener("DOMContentLoaded", applyAll);

 // ------------ window.postMessage handlers -----------------
    // Expose helpers to open/close the GC widget so messages can trigger them
    function openGcWidget() {
      const widget = document.getElementById('gcWidget');
      if (!widget) return;
      widget.classList.remove('hidden');
      widget.classList.add('visible');
    }
    function closeGcWidget() {
      const widget = document.getElementById('gcWidget');
      if (!widget) return;
      widget.classList.add('hidden');
      widget.classList.remove('visible');
    }

    function safeParse(data) {
      if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return null; }
      }
      if (typeof data === 'object' && data !== null) return data;
      return null;
    }

    const ALLOWED_TYPES = new Set(['screenPop','processCallLog','openCallLog','contactSearch','userActionSubscription','interactionSubscription','notificationSubscription']);

    let currentMRN = '';

    function handleMessage(event) {
      // NOTE: In production, validate event.origin against an allowlist
      const msg = safeParse(event.data);
      if (!msg || !msg.type || !ALLOWED_TYPES.has(msg.type)) {
        return;
      }

      // Optional correlation id for request/response pairing
      const correlationId = msg.correlationId || null;

      switch (msg.type) {
        case 'screenPop': {
          currentMRN = msg.data.interactionId.attributes.mrn || '';  
          // Expected: {type:"screenPop", data:{searchString:searchString, interactionId:interaction}}
          var screenpopDataFile = 'mrn_' + msg.data.interactionId.attributes.mrn + '.json';
          fetch(screenpopDataFile)
            .then(r => r.json())
            .then(json => { TEXTS = json[0] || json; applyAll(); });

          // Visual nudge: briefly outline banner
          const banner = document.querySelector('.banner .container');
          if (banner) {
            banner.style.boxShadow = '0 0 0 3px rgba(8,145,178,.35) inset';
            setTimeout(() => banner.style.boxShadow = '', 900);
          }
          event.source && event.source.postMessage({ type:'ack', of:'screenPop', status:'ok', correlationId }, event.origin);
          break;
        }
        case 'processCallLog': {
          // Expected: { type:'processCallLog', log: { ... } }
          // Demo: just stash on window and open the widget
          window._lastCallLog = msg.log || {};
          openGcWidget();
          event.source && event.source.postMessage({ type:'ack', of:'processCallLog', status:'ok', correlationId }, event.origin);
          break;
        }
        case 'openCallLog': {
          // Expected: { type:'openCallLog' }
          openGcWidget();
          event.source && event.source.postMessage({ type:'ack', of:'openCallLog', status:'ok', correlationId }, event.origin);
          break;
        }
        case 'contactSearch': {
          // Expected: { type:'contactSearch', query: '...' }
          const input = document.getElementById('globalSearch');
          if (input && typeof msg.query === 'string') {
            input.value = msg.query;
            input.focus();
          }
          event.source && event.source.postMessage({ type:'ack', of:'contactSearch', status:'ok', correlationId }, event.origin);
          break;
        }

        case 'userActionSubscription': {
            break;
        }

        case "interactionSubscription": {
          if (msg.data,category === 'change'){
            if (currentMRN !== msg.data.data.new.attributes.mrn)  {
                currentMRN = msg.data.interactionId.attributes.mrn || '';  
                console.log('**************** MRN has changed to ', currentMRN);
    
                var screenpopDataFile = 'mrn_' + msg.data.interactionId.attributes.mrn + '.json';
                fetch(screenpopDataFile)
                    .then(r => r.json())
                    .then(json => { TEXTS = json[0] || json; applyAll(); });
            }
          }
          break;
        }

        case "notificationSubscription": {
            break;
        }
      }
    }

    window.addEventListener('message', handleMessage);
    // ----------------------------------------------------------

    (function() {
      // Toggle visibility
      const widget = document.getElementById('gcWidget');
      const openBtn = document.getElementById('openWidgetBtn');
      const closeBtn = document.getElementById('closeWidgetBtn');
      function show() { widget.classList.remove('hidden'); widget.classList.add('visible'); }
      function hide() { widget.classList.add('hidden'); widget.classList.remove('visible'); }
      openBtn.addEventListener('click', show);
      closeBtn.addEventListener('click', hide);

      // Dragging
      const titlebar = widget.querySelector('.titlebar');
      let isDown = false, offsetX = 0, offsetY = 0;
      titlebar.addEventListener('mousedown', function(e) {
        isDown = true;
        const rect = widget.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      function onMove(e) {
        if (!isDown) return;
        const x = Math.max(0, e.clientX - offsetX);
        const y = Math.max(0, e.clientY - offsetY);
        widget.style.left = x + 'px';
        widget.style.top = y + 'px';
      }
      function onUp() {
        isDown = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
    })();
