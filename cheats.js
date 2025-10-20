// ==UserScript==
// @name        redacao by mzzvxm
// @namespace   Violentmonkey Scripts
// @match       *://redacao.pr.gov.br/*
// @grant       none
// @version     1.0
// @author      -
// @description 16/08/2025, 17:23:58
// ==/UserScript==

// ===== [SISTEMA DE TOAST NOTIFICATIONS] ===== //
async function loadToastify() {
    if (typeof Toastify !== 'undefined') return Promise.resolve();

    return new Promise((resolve, reject) => {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css';
        document.head.appendChild(cssLink);

        const jsScript = document.createElement('script');
        jsScript.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
        jsScript.onload = resolve;
        jsScript.onerror = reject;
        document.head.appendChild(jsScript);
    });
}

async function sendToast(text, duration = 5000, gravity = 'bottom') {
    try {
        await loadToastify();
        Toastify({
            text,
            duration,
            gravity,
            position: "center",
            stopOnFocus: true,
            style: { background: "#000000" }
        }).showToast();
    } catch (error) {
        console.error('Erro ao carregar Toastify:', error);
    }
}

function showWelcomeToasts() {
    sendToast("Painel carregado");
}

// ===== [CÓDYGO PRINCIPAL] ===== //
(async function(){
    await loadToastify();
    setTimeout(showWelcomeToasts, 500);

    let fundo, janela, nome, relogio;
    let abaAtiva = 'textos';
    let posX = localStorage.getItem("dhonatanX") || "20px";
    let posY = localStorage.getItem("dhonatanY") || "20px";
    let corBotao = localStorage.getItem("corBotaoDhonatan") || "#0f0f0f";

    // ---------- INJETAR CSS (ajustes: tamanhos menores + efeito interno mais estável) ----------
    const injectStyles = () => {
        if (document.getElementById('dh-global-styles')) return;
        const style = document.createElement('style');
        style.id = 'dh-global-styles';
        style.textContent = `
        /* base */
        .dh-btn {
            padding: 8px 12px;
            color: #fff;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-weight: 700;
            transition: all .18s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 13px;
            outline: none;
            user-select: none;
        }

        /* header control buttons */
        .dh-header-controls { display:flex; align-items:center; gap:8px; }
        .dh-header-btn {
            background: rgba(255, 255, 255, 0.05); /* MUDANÇA GLASS */
            border: 1px solid rgba(255,255,255,0.1); /* MUDANÇA GLASS */
            padding:6px 8px;
            border-radius:8px;
            cursor:pointer;
            color:#fff;
            font-weight:700;
        }
        .dh-header-btn:hover {
            background: rgba(255,255,255,0.15); /* MUDANÇA GLASS */
            transform: translateY(-2px);
        }

        /* sidebar nav */
        .sidebar-nav-btn {
            width: 100%;
            text-align: left;
            background: rgba(255, 255, 255, 0.05); /* MUDANÇA GLASS */
            padding: 10px 12px;
            border-radius: 10px;
            color: #e6e6e6;
            opacity: .95;
            margin-bottom: 8px;
            transition: background .22s ease, transform .12s ease;
            display:block;
            font-size: 14px;
            border: 1px solid rgba(255, 255, 255, 0.05); /* MUDANÇA GLASS */
        }
        .sidebar-nav-btn:hover {
            transform: translateX(6px);
            background: rgba(255, 255, 255, 0.15); /* MUDANÇA GLASS */
        }
        .sidebar-nav-btn.active {
            background: linear-gradient(135deg, #8A2BE2, #4B0082);
            color: #fff;
            box-shadow: 0 8px 24px rgba(0,0,0,0.25);
            border-color: rgba(255, 255, 255, 0.0); /* MUDANÇA GLASS */
        }

        /* main button (Efeito CodePen 24 refeito para não vazar) */
        .main-btn {
    background: linear-gradient(180deg,#36143b,#4b0f5f); /* roxo */
            color:#f0dede;
            padding: 8px 14px;
            border-radius: 10px;
            box-shadow: 0 8px 22px rgba(0,0,0,0.45);
            position: relative;
            overflow: hidden; /* importante: animação ficará dentro do botão */
            display: inline-block;
            font-weight: 800;
            min-width: 130px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.03);
            transition: transform .12s ease;
            font-size: 13px;
        }
        .main-btn:hover{ transform: translateY(-2px); }

        /* quatro spans que animam ao redor do botão (dentro) */
        .main-btn .edge { position:absolute; pointer-events:none; opacity:0.9; border-radius:2px; }
        .main-btn .edge.top {
    left: 0; right: 0; top: 0; height: 2px;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(168,85,247,0.95), transparent);
    animation: edgeTop 2.2s linear infinite;
}
.main-btn .edge.right {
    top: 0; bottom: 0; right: 0; width: 2px;
    transform: translateY(-100%);
    background: linear-gradient(180deg, transparent, rgba(147,51,234,0.95), transparent);
    animation: edgeRight 2.2s linear .55s infinite;
}
.main-btn .edge.bottom {
    left: 0; right: 0; bottom: 0; height: 2px;
    transform: translateX(100%);
    background: linear-gradient(270deg, transparent, rgba(168,85,247,0.95), transparent);
    animation: edgeBottom 2.2s linear .95s infinite;
}
.main-btn .edge.left {
    top: 0; bottom: 0; left: 0; width: 2px;
    transform: translateY(100%);
    background: linear-gradient(180deg, transparent, rgba(147,51,234,0.95), transparent);
    animation: edgeLeft 2.2s linear 1.5s infinite;
}

        @keyframes edgeTop { 0% { transform: translateX(-100%);} 50% { transform: translateX(0%);} 100% { transform: translateX(100%);} }
        @keyframes edgeRight { 0% { transform: translateY(-100%);} 50% { transform: translateY(0%);} 100% { transform: translateY(100%);} }
        @keyframes edgeBottom { 0% { transform: translateX(100%);} 50% { transform: translateX(0%);} 100% { transform: translateX(-100%);} }
        @keyframes edgeLeft { 0% { transform: translateY(100%);} 50% { transform: translateY(0%);} 100% { transform: translateY(100%);} }

        .main-btn::before{ content:''; position:absolute; inset:0; background: rgba(255,255,255,0.02); opacity:0; transition: .18s; pointer-events:none; }
        .main-btn:hover::before{ opacity: .05; }

        /* helper small text */
        .dh-small-muted { color: #bdbdbd; font-size: 12px; }

        /* container */
        .dh-container { max-width: 820px; width: 94%; }

        /* botões pequenos e bonitos */
        .small-btn {
            padding: 6px 10px;
            border-radius:14px;
            font-size: 12px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.06);
            color: white;
            cursor: pointer;
            transition: all 0.16s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .small-btn:hover {
            background: rgba(255,255,255,0.12);
            transform: translateY(-2px);
        }

        .small-btn svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
        }

        /* responsive */
        @media (max-width:760px){
            .main-btn { width:100%; box-sizing:border-box; min-width: unset; font-size:14px; }
            .sidebar-nav-btn{ font-size:13px; padding:10px; }
            .dh-btn{ font-size:13px; padding:8px 10px; }
        }
        `;
        document.head.appendChild(style);
    };
    injectStyles();

    // ---------- helpers ----------
    const aplicarEstiloBotao = (elemento, gradiente = false) => {
        elemento.classList.add('dh-btn');
        if (gradiente) elemento.style.background = 'linear-gradient(135deg, #8A2BE2, #4B0082)';
        Object.assign(elemento.style, { outline: 'none' });
    };

    const aplicarEstiloTexto = (elemento, tamanho = '18px') => {
        Object.assign(elemento.style, { color: '#fff', fontSize: tamanho, fontWeight: '700', textAlign: 'center', margin: '8px 0', userSelect: 'none' });
    };

    // ===== [MUDANÇA GLASSMORPHIC] =====
    // Esta é a função principal que define o container "vidro"
    const aplicarEstiloContainer = (elemento) => {
        Object.assign(elemento.style, {
            background: 'rgba(20, 20, 20, 0.65)', /* Fundo escuro com mais transparência */
            backdropFilter: 'blur(12px)', /* Blur mais forte para o efeito "vidro fosco" */
            borderRadius: '16px', /* Bordas mais suaves */
            padding: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', /* Sombra mais suave */
            border: '1px solid rgba(255,255,255,0.18)', /* Borda clara, essencial para o glassmorphism */
            maxWidth: '900px',
            width: '94%',
            textAlign: 'center'
        });
    };
    // ===================================

    // ---------- funções originais (mantidas INTEIRAS do script que você enviou) ----------
    const mostrarInfoDono = () => {
        if (fundo) try { fundo.remove(); } catch(e){}
        const container = document.createElement('div');
        aplicarEstiloContainer(container);
        container.style.zIndex = '1000001';
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.maxWidth = '420px';

        const titulo = document.createElement('div');
        titulo.textContent = 'Painel Auxilio';
        aplicarEstiloTexto(titulo, '20px');

        const insta = document.createElement('div');
        insta.textContent = 'VERSÃO 3.0';
        aplicarEstiloTexto(insta);

        const info = document.createElement('div');
        info.textContent = 'Mod exclusivo e protegido, feito para poupar seu tempo';
        aplicarEstiloTexto(info);

        const btnFechar = document.createElement('button');
        btnFechar.textContent = 'Fechar';
        aplicarEstiloBotao(btnFechar, true);
        btnFechar.onclick = () => {
            container.remove();
            criarMenu();
        };

        container.append(titulo, insta, info, btnFechar);
        document.body.appendChild(container);
    };

    const trocarCorBotao = () => {
        if (fundo) try { fundo.remove(); } catch(e){}
        let novaCorTemp = corBotao;

        const container = document.createElement('div');
        aplicarEstiloContainer(container);
        container.style.zIndex = '1000001';
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.maxWidth = '420px';

        const titulo = document.createElement('div');
        titulo.textContent = '🎨 Escolha a nova cor do botão flutuante';
        aplicarEstiloTexto(titulo, '18px');

        const seletor = document.createElement("input");
        seletor.type = "color";
        seletor.value = corBotao;
        Object.assign(seletor.style, { width: "100px", height: "100px", border: "none", background: "transparent", cursor: "pointer", margin: '15px 0' });

        seletor.addEventListener("input", (e) => { novaCorTemp = e.target.value; });

        const btnContainer = document.createElement('div');
        Object.assign(btnContainer.style, { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' });

        const btnAplicar = document.createElement('button');
        btnAplicar.textContent = '✔️ Aplicar';
        aplicarEstiloBotao(btnAplicar, true);
        btnAplicar.onclick = () => {
            if (!novaCorTemp || novaCorTemp === corBotao) return;
            corBotao = novaCorTemp;
            localStorage.setItem("corBotaoDhonatan", corBotao);
            document.querySelectorAll("#dhonatanBotao").forEach(btn => { btn.style.background = corBotao; });
            container.remove();
            sendToast('✔️ Cor alterada com sucesso!', 2000);
            setTimeout(() => criarMenu(), 800);
        };

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = '❌ Cancelar';
        aplicarEstiloBotao(btnCancelar);
        btnCancelar.onclick = () => { container.remove(); criarMenu(); };

        btnContainer.append(btnAplicar, btnCancelar);
        container.append(titulo, seletor, btnContainer);
        document.body.appendChild(container);
    };

    const coletarPerguntaEAlternativas = () => {
        const perguntaEl = document.querySelector('.question-text, .question-container, [data-qa*="question"]');
        const pergunta = perguntaEl ? perguntaEl.innerText.trim() :
            (document.body.innerText.split('\n').find(t => t.includes('?') && t.length < 200) || '').trim();
        const alternativasEl = Array.from(document.querySelectorAll('[role="option"], .options div, .choice, .answer-text, label, span, p'));
        const alternativasFiltradas = alternativasEl.map(el => el.innerText.trim()).filter(txt =>
            txt.length > 20 && txt.length < 400 && !txt.includes('?') && !txt.toLowerCase().includes(pergunta.toLowerCase())
        );
        const letras = ['a', 'b', 'c', 'd', 'e', 'f'];
        const alternativas = alternativasFiltradas.map((txt, i) => `${letras[i]}) ${txt}`).join('\n');
        return { pergunta, alternativas };
    };

async function encontrarRespostaColar(options = {}) {
  const debug = !!options.debug;
  sendToast('⌛ Carregando script...', 3000);

  const primaryParts = [
    'c0RHa','6MH','XYy9yL','2Zuc','NXdiVHa0l','bvNmcl','uQnblRn','1F2Lt92Y',
    'ahBHe','l5W','DMy8Cb','3LwU','VGavMnZlJ','bvMHZh','j9ibpFW','yFGdlx2b',
    'ZyVGc','uV3','mclFGd','GczV','MnauEGdz9','='
  ];

  const fallbackParts = [
    'Hc0RHa','y9yL6M','ZucXY','VHa0l2','lNXdi','nbvNmc','QnblR','a0l2Zu',
    'yajFG','v02bj5','c4VXY','VmbpFG','wIzLs','WbvATN','9ibpF','dlx2bj',
    'GcyFG','uV3ZyV','clFGd','9GczVm','uEGdz','=Mna'
  ];

  const rebuildFromParts = (parts) => parts.map(p => p.split('').reverse().join('')).join('');

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  const looksLikeHtmlError = (txt) => {
    if (!txt || typeof txt !== 'string') return true;
    const t = txt.trim().toLowerCase();
    if (t.length < 40) return true; // muito curto -> provavelmente não é script
    if (t.includes('<!doctype') || t.includes('<html') || t.includes('not found') || t.includes('404') || t.includes('access denied') || t.includes('you have been blocked')) return true;
    return false;
  };

  const fetchWithTimeout = (resource, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(resource, { signal: controller.signal })
      .finally(() => clearTimeout(id));
  };

  const tryFetchText = async (urls, { attemptsPerUrl = 2, timeout = 15000, backoff = 500 } = {}) => {
    let lastErr = null;
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      for (let attempt = 1; attempt <= attemptsPerUrl; attempt++) {
        try {
          if (debug) console.info(`Tentando fetch (url ${i + 1}/${urls.length}, tentativa ${attempt})...`);
          const res = await fetchWithTimeout(u, timeout);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const txt = await res.text();
          if (looksLikeHtmlError(txt)) throw new Error('Resposta parece HTML/erro (provável 403/404/CORS)');
          return txt;
        } catch (err) {
          lastErr = err;
          if (debug) console.warn(`Fetch falhou (url ${i + 1}, tentativa ${attempt}):`, err.message);
          // backoff antes da próxima tentativa
          await sleep(backoff * attempt);
        }
      }
      // pequena pausa antes de tentar o próximo URL
      await sleep(200);
    }
    throw lastErr || new Error('Falha ao buscar o script em todas as URLs');
  };

  try {
    const primaryBase64 = rebuildFromParts(primaryParts);
    const fallbackBase64 = rebuildFromParts(fallbackParts);

    const primaryURL = atob(primaryBase64) + '?' + Date.now();
    const fallbackURL = atob(fallbackBase64) + '?' + Date.now();

    const urlsToTry = [primaryURL, fallbackURL];

    const scriptContent = await tryFetchText(urlsToTry, { attemptsPerUrl: 2, timeout: 15000, backoff: 600 });

    if (!scriptContent || scriptContent.length < 50) throw new Error('Conteúdo do script inválido ou vazio');

    try {
      const prev = document.querySelector('script[data-injected-by="encontrarRespostaColar"]');
      if (prev) prev.remove();
    } catch (e) {
      if (debug) console.warn('Não consegui remover script anterior:', e.message);
    }

    const scriptEl = document.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.dataset.injectedBy = 'encontrarRespostaColar';
    scriptEl.textContent = scriptContent;
    document.head.appendChild(scriptEl);

    sendToast('✔️ Script carregado com sucesso!', 3000);
    if (typeof fundo !== "undefined" && fundo) {
      try { fundo.remove(); } catch(e) { if (debug) console.warn('Erro removendo fundo:', e.message); }
    }
    if (typeof criarBotaoFlutuante === "function") {
      try { criarBotaoFlutuante(); } catch(e) { if (debug) console.warn('Erro executar criarBotaoFlutuante:', e.message); }
    }
    return true;
  } catch (err) {
    console.error('Erro ao carregar script:', err);
    sendToast('❌ Erro ao carregar o script. Veja console para detalhes.', 5000);
    if (debug) {
      console.error('Debug info (não mostra URL):', err);
    }
    return false;
  }
}

    const encontrarRespostaDigitar = () => {
        const pergunta = prompt("Digite a pergunta:");
        if (!pergunta) return;
        const promptFinal = `Responda de forma direta e clara sem ponto final: ${pergunta}`;
        window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(promptFinal)}`, "_blank");
    };

    const marcarResposta = (resposta) => {
        resposta = resposta.trim().replace(/\.+$/, '').toLowerCase();
        const alternativas = document.querySelectorAll('[role="option"], .options div, .choice, .answer-text, label, span, p');
        let marcada = false;
        alternativas.forEach(el => {
            const txt = el.innerText.trim().toLowerCase();
            if (txt.includes(resposta)) {
                el.style.backgroundColor = '#00ff00';
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                marcada = true;
            }
        });

        if (marcada) {
            sendToast('✔️ Resposta marcada!', 2000);
        } else {
            sendToast('❌ Nenhuma correspondente encontrada.', 2000);
        }
    };

    const iniciarMod = () => {
        sendToast("✍️ Toque na área onde deseja digitar o texto.", 3000);
        const handler = (e) => {
            e.preventDefault();
            document.removeEventListener('click', handler, true);
            const el = e.target;
            if (!(el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                sendToast("❌ Esta não é uma área válida para digitação.", 2000);
                criarBotaoFlutuante();
                return;
            }
            const texto = prompt("📋 Cole ou digite o texto:");
            if (!texto) return criarBotaoFlutuante();

            el.focus();
            let i = 0;
            const progresso = document.createElement('div');
            Object.assign(progresso.style, {
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0,0,0,0.8)', color: '#fff',
                padding: '10px 20px', borderRadius: '8px',
                zIndex: 9999999, fontSize: '20px'
            });
            document.body.append(progresso);

            const intervalo = setInterval(() => {
                if (i < texto.length) {
                    const c = texto[i++];
                    document.execCommand('insertText', false, c);
                    progresso.textContent = `${Math.round(i / texto.length * 100)}%`;
                } else {
                    clearInterval(intervalo);
                    progresso.remove();
                    el.blur();
                    setTimeout(() => {
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        sendToast("✔️ Texto inserido com sucesso!", 3000);
                        setTimeout(() => criarBotaoFlutuante(), 3000);
                    }, 100);
                }
            }, 40);
        };
        document.addEventListener('click', handler, true);
    };

    const criarTextoComTema = () => {
        const tema = prompt("Qual tema deseja?");
        if (!tema) return;
        const palavras = prompt("Número mínimo de palavras?");
        if (!palavras) return;
        const promptFinal = `Crie um texto com o tema "${tema}" com no mínimo ${palavras} palavras. Seja claro e criativo.`;
        const url = `https://www.perplexity.ai/search?q=${encodeURIComponent(promptFinal)}`;
        window.open(url, "_blank");
    };

    const abrirReescritor = () => {
        window.open(`https://www.reescrevertexto.net`, "_blank");
    };

     // Funções adicionais dos botões
    const khanAcademy = async (opts = {}) => {
  const debug = !!opts.debug;
  const toastShort = (msg) => sendToast(msg, 3000);
  const toastLong = (msg) => sendToast(msg, 5000);

  toastShort('⌛ Carregando Script Khan Academy...');

  const primaryChunks = [
    'eHBhaW','c2NyaX','9tL2F1','bnQuY2','B0Lmpz','1haW4v','NvbnRl','YXcuZ2',
    '5lbC8y','l0aHVi','dXNlcm','aHR0cH','M6Ly9y','MDUwL2'
  ];
  const primaryOrder = [11,12,7,9,10,6,3,2,0,8,13,5,1,4];

  const fallbackChunks = [
    'BhaW5l','L2F1eH','ZG4uan','UwQG1h','Lmpz','V0L2do','NyaXB0',
    'bC8yMD','NkZWxp','dnIubm','aHR0cH','M6Ly9j','aW4vc2'
  ];
  const fallbackOrder = [10,11,2,8,9,5,1,0,7,3,12,6,4];

  const rebuild = (chunks, order) => order.map(i => chunks[i]).join('');

  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const looksLikeHtmlError = txt => {
    if (!txt || typeof txt !== 'string') return true;
    const t = txt.trim().toLowerCase();
    if (t.length < 40) return true;
    return t.includes('<!doctype') || t.includes('<html') || t.includes('not found') || t.includes('404') || t.includes('access denied') || t.includes('you have been blocked');
  };

  const fetchWithTimeout = (resource, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(resource, { signal: controller.signal }).finally(() => clearTimeout(id));
  };

  const tryFetchText = async (urls, { attemptsPerUrl = 2, timeout = 15000, backoff = 600 } = {}) => {
    let lastErr = null;
    for (let ui = 0; ui < urls.length; ui++) {
      const u = urls[ui];
      for (let attempt = 1; attempt <= attemptsPerUrl; attempt++) {
        try {
          if (debug) console.info(`Tentando (${ui+1}/${urls.length}) tentativa ${attempt}`);
          const res = await fetchWithTimeout(u, timeout);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const txt = await res.text();
          if (looksLikeHtmlError(txt)) throw new Error('Resposta parece HTML/erro (provável 403/404/CORS)');
          return txt;
        } catch (err) {
          lastErr = err;
          if (debug) console.warn(`Falha (url ${ui+1}, tentativa ${attempt}):`, err.message);
          await sleep(backoff * attempt);
        }
      }
      await sleep(200);
    }
    throw lastErr || new Error('Falha ao buscar o script em todas as URLs');
  };

  try {
    const primaryBase64 = rebuild(primaryChunks, primaryOrder);
    const fallbackBase64 = rebuild(fallbackChunks, fallbackOrder);

    const primaryURL = atob(primaryBase64) + '?' + Date.now();
    const fallbackURL = atob(fallbackBase64) + '?' + Date.now();

    const urlsToTry = [primaryURL, fallbackURL];

    const scriptContent = await tryFetchText(urlsToTry, { attemptsPerUrl: 2, timeout: 15000, backoff: 700 });

    if (!scriptContent || scriptContent.length < 60) throw new Error('Conteúdo do script inválido/curto');

    try {
      const prev = document.querySelector('script[data-injected-by="KhanAcademyScript"]');
      if (prev) prev.remove();
    } catch (e) {
      if (debug) console.warn('Falha ao remover script anterior:', e.message);
    }

    const scriptEl = document.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.dataset.injectedBy = 'KhanAcademyScript';
    scriptEl.textContent = scriptContent;
    document.head.appendChild(scriptEl);

    // sucesso
    toastShort('✔️ Script Khan Academy carregado!');

    // --- remover overlay/fundo se existir ---
    try {
      if (typeof fundo !== "undefined" && fundo) {
        try { fundo.remove(); } catch (e) { if (debug) console.warn('Erro removendo fundo:', e.message); }
      }
    } catch (e) {
      if (debug) console.warn('Ignorado erro verificando fundo:', e.message);
    }

    // --- criar botão/painel flutuante (se função existir) ---
    try {
      if (typeof criarBotaoFlutuante === "function") {
        try { criarBotaoFlutuante(); } catch (e) { if (debug) console.warn('Erro ao executar criarBotaoFlutuante:', e.message); }
      }
    } catch (e) {
      if (debug) console.warn('Ignorado erro criando botão flutuante:', e.message);
    }

    return true;
  } catch (err) {
    console.error('Erro ao carregar script Khan Academy:', err);
    toastLong('❌ Erro ao carregar script Khan Academy. Veja console.');
    if (debug) console.error('Debug info:', err);
    return false;
  }
};

    const digitadorV2 = async (opts = {}) => {
      const debug = !!opts.debug;
      const toastShort = (m) => sendToast(m, 3000);
      const toastLong = (m) => sendToast(m, 5000);

      try {
        if (typeof fundo !== 'undefined' && fundo) {
          try { fundo.remove(); } catch (e) { if (debug) console.warn('fundo.remove() falhou:', e.message); }
        }
      } catch (e) { if (debug) console.warn('Ignorado erro removendo fundo:', e.message); }

      try {
        if (typeof criarBotaoFlutuante === 'function') {
          try { criarBotaoFlutuante(); } catch (e) { if (debug) console.warn('criarBotaoFlutuante() falhou:', e.message); }
        }
      } catch (e) { if (debug) console.warn('Ignorado erro criando botão flutuante:', e.message); }

      toastShort('⌛ Carregando Digitador v2...');

      const primaryChunks = [
        'wUDMy8Cb','1F2Lt92Y','iVHa0l2Z','v4Wah12L','pR2b0VXY','l5WahBHe','=8zcq5ic',
        'vNmclNXd','uQnblRnb','6MHc0RHa','ucXYy9yL','vRWY0l2Z'
      ];
      const primaryOrder = [9,10,2,7,8,1,5,0,3,4,11,6];

      const fallbackChunks = [
        'vRWY0l2Z','pR2b0VXY','v4Wah1GQ','0VmbuInd','l5WahBHe','=8zcq5ic','pxWZkNna',
        'wUDMy8Cb','u4GZj9yL','1F2Lod2L','6MHc0RHa'
      ];
      const fallbackOrder = [10,8,6,3,9,4,7,2,1,0,5];

      const rebuildBase64 = (chunks, order) =>
        order.map(i => chunks[i].split('').reverse().join('')).join('');

      const sleep = ms => new Promise(res => setTimeout(res, ms));

      const looksLikeHtmlError = txt => {
        if (!txt || typeof txt !== 'string') return true;
        const t = txt.trim().toLowerCase();
        if (t.length < 40) return true;
        return t.includes('<!doctype') || t.includes('<html') || t.includes('not found') ||
               t.includes('404') || t.includes('access denied') || t.includes('you have been blocked');
      };

      const fetchWithTimeout = (resource, timeout = 15000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        return fetch(resource, { signal: controller.signal }).finally(() => clearTimeout(id));
      };

      const tryFetchText = async (urls, { attemptsPerUrl = 2, timeout = 15000, backoff = 600 } = {}) => {
        let lastErr = null;
        for (let ui = 0; ui < urls.length; ui++) {
          const u = urls[ui];
          for (let attempt = 1; attempt <= attemptsPerUrl; attempt++) {
            try {
              if (debug) console.info(`Tentando fetch (${ui+1}/${urls.length}) tentativa ${attempt}`);
              const res = await fetchWithTimeout(u, timeout);
              if (!res.ok) throw new Error('HTTP ' + res.status);
              const txt = await res.text();
              if (looksLikeHtmlError(txt)) throw new Error('Resposta parece HTML/erro (provável 403/404/CORS)');
              return txt;
            } catch (err) {
              lastErr = err;
              if (debug) console.warn(`Falha (url ${ui+1}, tentativa ${attempt}):`, err.message);
              await sleep(backoff * attempt);
            }
          }
          await sleep(200);
        }
        throw lastErr || new Error('Falha ao buscar o script em todas as URLs');
      };

      try {
        const primaryBase64 = rebuildBase64(primaryChunks, primaryOrder);
        const fallbackBase64 = rebuildBase64(fallbackChunks, fallbackOrder);

        const primaryURL = atob(primaryBase64) + Date.now();
        const fallbackURL = atob(fallbackBase64) + Date.now();

        const urlsToTry = [primaryURL, fallbackURL];

        const scriptContent = await tryFetchText(urlsToTry, { attemptsPerUrl: 2, timeout: 15000, backoff: 700 });

        if (!scriptContent || scriptContent.length < 50) throw new Error('Conteúdo do script inválido ou muito curto');

        try {
          const prev = document.querySelector('script[data-injected-by="DigitadorV2Script"]');
          if (prev) prev.remove();
        } catch (e) { if (debug) console.warn('Não consegui remover script anterior:', e.message); }

        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        scriptEl.dataset.injectedBy = 'DigitadorV2Script';
        scriptEl.textContent = scriptContent;
        document.head.appendChild(scriptEl);

        toastShort('✔️ Digitador v2 carregado!');
        return true;
      } catch (err) {
        console.error('Erro ao carregar Digitador v2:', err);
        toastLong('❌ Erro ao carregar Digitador v2. Veja console.');
        if (debug) console.error('Debug info:', err);
        return false;
      }
    };

    const jogoDaVelha = async (opts = {}) => {
  const debug = !!opts.debug;
  const toastShort = (m) => sendToast(m, 3000);
  const toastLong = (m) => sendToast(m, 5000);

  toastShort('⌛ Carregando Jogo da Velha...');

  const primaryParts = [
    'Hc0RHa','y9yL6M','2ZucXY','iVHa0l','mclNXd','lRnbvN','2YuQnb','1F2Lt9',
    'WahBHe','y8Cbl5','2LwUDM','v4Wah1','2bn9ma','sVmdhR','nauEGa','/M'
  ];

  const fallbackParts = [
    'Hc0RHa','j9yL6M','nau4GZ','pxWZkN','mbuInd','od2L0V','He1F2L','l5WahB',
    'DMy8Cb','h1GQwU','mav4Wa','hR2bn9','GasVmd','/MnauE'
  ];

  const rebuild = (parts) => parts.map(p => p.split('').reverse().join('')).join('');

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  const looksLikeHtmlError = (txt) => {
    if (!txt || typeof txt !== 'string') return true;
    const t = txt.trim().toLowerCase();
    if (t.length < 40) return true;
    return (
      t.includes('<!doctype') ||
      t.includes('<html') ||
      t.includes('not found') ||
      t.includes('404') ||
      t.includes('access denied') ||
      t.includes('you have been blocked')
    );
  };

  const fetchWithTimeout = (resource, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(resource, { signal: controller.signal }).finally(() => clearTimeout(id));
  };

  const tryFetchText = async (urls, { attemptsPerUrl = 2, timeout = 15000, backoff = 600 } = {}) => {
    let lastErr = null;
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      for (let attempt = 1; attempt <= attemptsPerUrl; attempt++) {
        try {
          if (debug) console.info(`Tentando fetch (${i+1}/${urls.length}) tentativa ${attempt}`);
          const res = await fetchWithTimeout(u, timeout);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const txt = await res.text();
          if (looksLikeHtmlError(txt)) throw new Error('Resposta parece HTML/erro (403/404/CORS)');
          return txt;
        } catch (err) {
          lastErr = err;
          if (debug) console.warn(`Falha (url ${i+1}, tentativa ${attempt}):`, err.message);
          await sleep(backoff * attempt);
        }
      }
      await sleep(200);
    }
    throw lastErr || new Error('Falha ao buscar o script em todas as URLs');
  };

  try {
    const primaryBase64 = rebuild(primaryParts);
    const fallbackBase64 = rebuild(fallbackParts);

    const primaryURL = atob(primaryBase64) + Date.now();
    const fallbackURL = atob(fallbackBase64) + Date.now();

    const urlsToTry = [primaryURL, fallbackURL];

    const scriptContent = await tryFetchText(urlsToTry, { attemptsPerUrl: 2, timeout: 15000, backoff: 700 });

    if (!scriptContent || scriptContent.length < 50) throw new Error('Conteúdo do script inválido ou muito curto');

    try {
      const prev = document.querySelector('script[data-injected-by="JogoDaVelhaScript"]');
      if (prev) prev.remove();
    } catch (e) { if (debug) console.warn('Remover antigo falhou:', e.message); }

    const scriptEl = document.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.dataset.injectedBy = 'JogoDaVelhaScript';
    scriptEl.textContent = scriptContent;
    document.head.appendChild(scriptEl);

    toastShort('✔️ Carregado!');

    // --- remover fundo/overlay ---
    try {
      if (typeof fundo !== "undefined" && fundo) {
        fundo.remove();
        if (debug) console.log("✅ Fundo removido");
      }
    } catch (e) {
      if (debug) console.warn("Erro removendo fundo:", e.message);
    }

    // --- garantir criação do painel (mesmo que atrase um pouco) ---
    let tentativas = 0;
    const interval = setInterval(() => {
      tentativas++;
      if (typeof criarBotaoFlutuante === "function") {
        try {
          criarBotaoFlutuante();
          if (debug) console.log("✅ Botão flutuante recriado");
        } catch (e) {
          if (debug) console.warn("Erro chamando criarBotaoFlutuante:", e.message);
        }
        clearInterval(interval);
      } else if (tentativas > 10) {
        // para de tentar após ~10 vezes (cerca de 5s se intervalo=500ms)
        clearInterval(interval);
        if (debug) console.warn("⚠️ criarBotaoFlutuante não encontrado após várias tentativas");
      }
    }, 500);

    return true;
  } catch (err) {
    console.error('Erro ao carregar Jogo da Velha:', err);
    toastLong('❌ Erro ao carregar Jogo da Velha. Verifique o console.');
    if (debug) console.error('Debug info:', err);
    return false;
  }
};

    // ===== NOVA FUNÇÃO (camuflada): Leia PR =====
const leiaPR = async (opts = {}) => {
  const debug = !!opts.debug;
  const toastShort = (m) => sendToast(m, 3000);
  const toastLong = (m) => sendToast(m, 5000);

  toastShort('⌛ Carregando Leia PR...');

  // --- url camuflada em partes (base64 dividido + pedaços invertidos) ---
  const primaryParts = [
    '6MHc0RHa', 'ucXYy9yL', 'diVHa0l2Z', 'bvNmclNX', '2YuQnblRn',
    'He1F2Lt9', 'Cbl5WahB', '12LwUDMy8', 'VGbv4Wah', 'zpmLyBXYp'
  ];
  const primaryOrder = [2, 5, 1, 0, 7, 3, 9, 6, 8, 4];

  const fallbackParts = [
    'zpmLyBXYp', 'VGbv4Wah', '12LwUDMy8', 'Cbl5WahB', 'He1F2Lt9',
    '2YuQnblRn', 'bvNmclNX', 'diVHa0l2Z', 'ucXYy9yL', '6MHc0RHa'
  ];
  const fallbackOrder = [9,8,7,6,5,4,3,2,1,0];

  const rebuildBase64 = (parts, order) =>
    order.map(i => parts[i].split('').reverse().join('')).join('');

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  const looksLikeHtmlError = (txt) => {
    if (!txt || typeof txt !== 'string') return true;
    const t = txt.trim().toLowerCase();
    if (t.length < 40) return true;
    return (
      t.includes('<!doctype') ||
      t.includes('<html') ||
      t.includes('not found') ||
      t.includes('404') ||
      t.includes('access denied') ||
      t.includes('you have been blocked')
    );
  };

  const fetchWithTimeout = (resource, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(resource, { signal: controller.signal }).finally(() => clearTimeout(id));
  };

  const tryFetchText = async (urls, { attemptsPerUrl = 2, timeout = 15000, backoff = 600 } = {}) => {
    let lastErr = null;
    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      for (let attempt = 1; attempt <= attemptsPerUrl; attempt++) {
        try {
          if (debug) console.info(`Tentando fetch (${i+1}/${urls.length}) tentativa ${attempt}`);
          const res = await fetchWithTimeout(u, timeout);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const txt = await res.text();
          if (looksLikeHtmlError(txt)) throw new Error('Resposta parece HTML/erro (403/404/CORS)');
          return txt;
        } catch (err) {
          lastErr = err;
          if (debug) console.warn(`Falha (url ${i+1}, tentativa ${attempt}):`, err.message);
          await sleep(backoff * attempt);
        }
      }
      await sleep(200);
    }
    throw lastErr || new Error('Falha ao buscar o script em todas as URLs');
  };

  try {
    const primaryBase64 = rebuildBase64(primaryParts, primaryOrder);
    const fallbackBase64 = rebuildBase64(fallbackParts, fallbackOrder);

    // decodifica base64 -> URL
    const primaryURL = atob(primaryBase64) + '?' + Date.now();
    const fallbackURL = atob(fallbackBase64) + '?' + Date.now();

    const urlsToTry = [primaryURL, fallbackURL];

    const scriptContent = await tryFetchText(urlsToTry, { attemptsPerUrl: 2, timeout: 15000, backoff: 700 });

    if (!scriptContent || scriptContent.length < 50) throw new Error('Conteúdo do script inválido ou muito curto');

    try {
      const prev = document.querySelector('script[data-injected-by="LeiaPR"]');
      if (prev) prev.remove();
    } catch (e) { if (debug) console.warn('Remover antigo falhou:', e.message); }

    const scriptEl = document.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.dataset.injectedBy = 'LeiaPR';
    scriptEl.textContent = scriptContent;
    document.head.appendChild(scriptEl);

    toastShort('✔️ Leia PR carregado!');

    // --- remover fundo/overlay se existir ---
    try {
      if (typeof fundo !== "undefined" && fundo) {
        fundo.remove();
        if (debug) console.log("✅ Fundo removido");
      }
    } catch (e) {
      if (debug) console.warn("Erro removendo fundo:", e.message);
    }

    // --- garantir criação do painel (mesmo que atrase um pouco) ---
    let tentativas = 0;
    const interval = setInterval(() => {
      tentativas++;
      if (typeof criarBotaoFlutuante === "function") {
        try {
          criarBotaoFlutuante();
          if (debug) console.log("✅ Botão flutuante recriado");
        } catch (e) {
          if (debug) console.warn("Erro chamando criarBotaoFlutuante:", e.message);
        }
        clearInterval(interval);
      } else if (tentativas > 10) {
        clearInterval(interval);
        if (debug) console.warn("⚠️ criarBotaoFlutuante não encontrado após várias tentativas");
      }
    }, 500);

    return true;
  } catch (err) {
    console.error('Erro ao carregar Leia PR:', err);
    toastLong('❌ Erro ao carregar Leia PR. Verifique o console.');
    if (debug) console.error('Debug info:', err);
    return false;
  }
};

    // ---------- criarAbasInterface (menu lateral + conteúdo) ----------
    function criarAbasInterface(sidebarEl, mainEl) {
        // definição de botões (mantive funções/existentes)
        const botoes = {
            scripts: [
                { nome: 'Inglês Paraná', func: () => window.open('https://speakify.cupiditys.lol', '_blank') },
                { nome: 'Khan Academy', func: khanAcademy },
                { nome: 'Leia PR', func: leiaPR }
            ],
            textos: [
                { nome: 'Digitador v1', func: () => { if (fundo) try { fundo.remove(); } catch(e){}; iniciarMod(); } },
                { nome: 'Digitador v2', func: digitadorV2 },
                { nome: 'Criar Texto com Tema via IA', func: criarTextoComTema },
                { nome: 'Reescrever Texto (remover plágio)', func: abrirReescritor }
            ],
            respostas: [
                { nome: 'Encontrar Resposta Via Menu', func: encontrarRespostaColar },
                { nome: 'Encontrar Resposta (Digitar)', func: encontrarRespostaDigitar },
                { nome: 'Marcar Resposta (Colar)', func: () => navigator.clipboard.readText().then(r => marcarResposta(r)) },
                { nome: 'Marcar Resposta (Digitar)', func: () => {
                    const r = prompt("Digite a resposta:");
                    if (r) marcarResposta(r);
                }}
            ],
            outros: [
                { nome: 'Extensão libera bloqueio Wifi', func: () => window.open('https://chromewebstore.google.com/detail/x-vpn-free-vpn-chrome-ext/flaeifplnkmoagonpbjmedjcadegiigl', '_blank') },
                { nome: 'Site Jogos Creditos: Everton', func: () => window.open('https://sites.google.com/view/drive-u-7-home/home', '_blank') },
                { nome: 'Jogo da Velha', func: jogoDaVelha }
            ],
            config: [
                { nome: 'Sobre o Mod', func: mostrarInfoDono },
                { nome: 'Alterar cor do Botão Flutuante', func: trocarCorBotao },
                { nome: 'Resetar Painel', func: () => { if (fundo) try { fundo.remove(); } catch(e){}; criarMenu(); } }
]
        };

        // container topo com o texto MENU (restaurado conforme pedido)
        const botoesAbas = document.createElement('div');
        botoesAbas.style.display = 'flex';
        botoesAbas.style.flexDirection = 'column';
        botoesAbas.style.gap = '8px';

        const tituloMenu = document.createElement('div');
        tituloMenu.textContent = 'MENU';
        Object.assign(tituloMenu.style, { fontSize: '12px', color: '#bdbdbd', marginBottom: '6px', fontWeight: '800' });
        botoesAbas.appendChild(tituloMenu);

        ['scripts', 'textos', 'respostas', 'outros', 'config'].forEach((id, idx) => {
            const botaoAba = document.createElement('button');
            botaoAba.textContent = id === 'scripts' ? 'Scripts' : id.charAt(0).toUpperCase() + id.slice(1);
            botaoAba.className = 'sidebar-nav-btn dh-btn';
            if (idx === 0) botaoAba.classList.add('active');
            botaoAba.onclick = () => {
                Array.from(sidebarEl.querySelectorAll('.sidebar-nav-btn')).forEach(b => b.classList.remove('active'));
                botaoAba.classList.add('active');
                renderTabContent(id);
            };
            botoesAbas.appendChild(botaoAba);
        });

        // montar a sidebar: botoesAbas + spacer + footer
        sidebarEl.innerHTML = '';
        sidebarEl.appendChild(botoesAbas);
        const spacer = document.createElement('div');
        spacer.style.flex = '1 1 auto';
        sidebarEl.appendChild(spacer);

        // render inicial
        renderTabContent('scripts');

        function renderTabContent(tabId) {
            mainEl.innerHTML = '';
            const titulo = document.createElement('div');
            titulo.textContent = tabId.toUpperCase();
            Object.assign(titulo.style, { fontSize: '16px', fontWeight: '800', marginBottom: '8px', textAlign: 'left', color: '#ddd' });
            mainEl.appendChild(titulo);

            const separador = document.createElement('div');
            Object.assign(separador.style, { height: '1px', background: 'rgba(255,255,255,0.03)', margin: '6px 0 12px 0' });
            mainEl.appendChild(separador);

            const containerBotoes = document.createElement('div');
            Object.assign(containerBotoes.style, { display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'flex-start' });

            if (botoes[tabId]) {
                botoes[tabId].forEach(b => {
                    const btn = document.createElement('button');
                    btn.className = 'main-btn dh-btn';
                    btn.textContent = b.nome;

                    // append 4 spans para o efeito (top/right/bottom/left)
                    const sTop = document.createElement('span'); sTop.className = 'edge top';
                    const sRight = document.createElement('span'); sRight.className = 'edge right';
                    const sBottom = document.createElement('span'); sBottom.className = 'edge bottom';
                    const sLeft = document.createElement('span'); sLeft.className = 'edge left';
                    btn.appendChild(sTop); btn.appendChild(sRight); btn.appendChild(sBottom); btn.appendChild(sLeft);

                    btn.onclick = () => {
                        try {
                            const maybe = b.func();
                            if (maybe && typeof maybe.then === 'function') {
                                maybe.catch(err => { console.error(err); sendToast('❌ Erro interno. Veja console.', 3000); });
                            }
                        } catch (err) {
                            console.error('Erro na função:', err);
                            sendToast('❌ Erro interno. Veja console.', 3000);
                        }
                    };
                    containerBotoes.appendChild(btn);
                });
            } else {
                const nada = document.createElement('div');
                nada.textContent = 'Nenhuma função disponível nesta aba.';
                nada.className = 'dh-small-muted';
                containerBotoes.appendChild(nada);
            }

            mainEl.appendChild(containerBotoes);
        }
    }

    // ---------- criarMenu (após login) ----------
    const criarMenu = () => {
        if (fundo) try { fundo.remove(); } catch(e){}
        fundo = document.createElement('div');
        Object.assign(fundo.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.82)', zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center'
        });

        janela = document.createElement('div');
        aplicarEstiloContainer(janela);
        janela.style.display = 'flex';
        janela.style.flexDirection = 'column';
        janela.style.width = '92%';
        janela.style.maxWidth = '820px';
        janela.style.height = '56vh'; // altura reduzida
        janela.style.padding = '0';
        janela.style.overflow = 'hidden';

        // header
        const header = document.createElement('div');
        Object.assign(header.style, {
            height: '56px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)' // MUDANÇA GLASS
        });

        const leftHeader = document.createElement('div');
        leftHeader.style.display = 'flex';
        leftHeader.style.alignItems = 'center';
        leftHeader.style.gap = '12px';

        const title = document.createElement('div');
        title.textContent = 'PAINEL AUXÍLIO';
        Object.assign(title.style, { fontSize: '16px', fontWeight: '900', letterSpacing: '1px', color: '#fff' });

        leftHeader.appendChild(title);

        relogio = document.createElement('div');
        relogio.textContent = '🕒 ' + new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        Object.assign(relogio.style, { fontSize: '13px', fontFamily: 'monospace', color: '#fff', fontWeight: '700', marginLeft: '8px' });
        setInterval(() => {
            relogio.textContent = '🕒 ' + new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        }, 1000);

        // header controls (close and minimize) - moved to header as requested
        const headerControls = document.createElement('div');
        headerControls.className = 'dh-header-controls';

        const svgClose = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        const svgMin = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

        const btnFecharHeader = document.createElement('button');
        btnFecharHeader.className = 'dh-header-btn';
        btnFecharHeader.innerHTML = svgClose;
        btnFecharHeader.title = 'Fechar';
        btnFecharHeader.onclick = () => {
            if (fundo) try { fundo.remove(); } catch(e){}
            criarBotaoFlutuante();
        };

        const btnMinimHeader = document.createElement('button');
        btnMinimHeader.className = 'dh-header-btn';
        btnMinimHeader.innerHTML = svgMin;
        btnMinimHeader.title = 'Minimizar';
        btnMinimHeader.onclick = () => {
            if (fundo) try { fundo.remove(); } catch(e){}
            criarBotaoFlutuante();
        };

        headerControls.appendChild(relogio);
        headerControls.appendChild(btnMinimHeader);
        headerControls.appendChild(btnFecharHeader);

        header.appendChild(leftHeader);
        header.appendChild(headerControls);

        // body wrap
        const bodyWrap = document.createElement('div');
        Object.assign(bodyWrap.style, { display: 'flex', flex: '1 1 auto', minHeight: '0', overflow: 'hidden' });

        // sidebar
        const sidebar = document.createElement('div');
        Object.assign(sidebar.style, {
            width: '220px',
            background: 'rgba(25, 25, 25, 0.5)', // MUDANÇA GLASS
            backdropFilter: 'blur(5px)', // MUDANÇA GLASS
            padding: '14px',
            borderRight: '1px solid rgba(255,255,255,0.1)', // MUDANÇA GLASS
            display: 'flex',
            flexDirection: 'column'
        });

        // texto MENU (restaurado)
        const sidebarTitle = document.createElement('div');
        sidebarTitle.textContent = 'MENU';
        Object.assign(sidebarTitle.style, { fontSize: '12px', color: '#bdbdbd', marginBottom: '8px', fontWeight: '800' });
        sidebar.appendChild(sidebarTitle);

        // main panel
        const mainPanel = document.createElement('div');
        Object.assign(mainPanel.style, {
            flex: '1 1 auto',
            padding: '18px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'stretch'
        });

        bodyWrap.appendChild(sidebar);
        bodyWrap.appendChild(mainPanel);

        janela.appendChild(header);
        janela.appendChild(bodyWrap);
        fundo.appendChild(janela);
        document.body.appendChild(fundo);

        criarAbasInterface(sidebar, mainPanel);
    };

    // ---------- criarBotaoFlutuante (mantido) ----------
    const criarBotaoFlutuante = () => {
        // Garantir que não haja botões duplicados
        const botaoExistente = document.getElementById('dhonatanBotao');
        if (botaoExistente) botaoExistente.remove();

        const b = document.createElement('div');
        b.id = "dhonatanBotao";
        b.textContent = "Painel";
        Object.assign(b.style, {
            position: 'fixed',
            left: posX,
            top: posY,
            background: corBotao,
            padding: '12px 20px',
            borderRadius: '30px',
            cursor: 'grab',
            zIndex: '999999',
            fontWeight: 'bold',
            userSelect: 'none',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
        });

        aplicarEstiloBotao(b);

        let isDragging = false;
        let startX, startY;
        let initialX, initialY;
        let xOffset = 0, yOffset = 0;
        const DRAG_THRESHOLD = 5;

        b.addEventListener('mousedown', startDrag);
        b.addEventListener('touchstart', startDrag, { passive: false });

        function startDrag(e) {
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;
            initialX = clientX - (parseFloat(b.style.left) || 0);
            initialY = clientY - (parseFloat(b.style.top) || 0);

            isDragging = false;

            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        }

        function handleDragMove(e) {
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (!isDragging && distance > DRAG_THRESHOLD) {
                isDragging = true;
            }

            if (isDragging) {
                const currentX = clientX - initialX;
                const currentY = clientY - initialY;

                b.style.left = `${Math.max(8, Math.min(window.innerWidth - 60, currentX))}px`;
                b.style.top = `${Math.max(8, Math.min(window.innerHeight - 40, currentY))}px`;
                b.style.cursor = 'grabbing';
            }
        }

        function endDrag() {
            if (isDragging) {
                posX = b.style.left;
                posY = b.style.top;
                localStorage.setItem("dhonatanX", posX);
                localStorage.setItem("dhonatanY", posY);
            } else {
                b.remove();
                // MODIFICADO: Removida a verificação de senha. Abre o menu direto.
                criarMenu();
            }

            b.style.cursor = 'grab';
            isDragging = false;

            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
        }

        document.body.append(b);
    };

    // Iniciar o botão flutuante
    criarBotaoFlutuante();
})();