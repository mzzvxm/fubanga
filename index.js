// ==UserScript==
// @name         Funiber Bypass v6
// @namespace    Violentmonkey Scripts
// @version      5.0
// @description  Responde automaticamente questões com Gemini ou DeepSeek - Dual AI Support
// @match        *://*.funiber.org/*
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=panal.funiber.org
// @author       mzzvxm
// ==/UserScript==

;(async () => {
  // Configurações das APIs
  const AI_CONFIGS = {
    gemini: {
      name: "Gemini",
      icon: "🧠",
      apiKey: "AIzaSyDzHvHcoBgfeNJf0iwM2AfjQM3mQ9sW-W8",
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      testPrompt: "Diga apenas: ok",
    },
    deepseek: {
      name: "DeepSeek",
      icon: "🤖",
      apiKey: "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",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      model: "deepseek/deepseek-chat:free",
      testPrompt: "Diga apenas: ok",
    },
  }

  let currentAI = "gemini"
  let isPanelMinimized = false
  let isDragging = false
  const dragOffset = { x: 0, y: 0 }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Função para detectar e alterar idioma para português
  async function verificarEAlterarIdioma() {
    try {
      const langMenu = document.querySelector(".dropdown.langmenu")
      if (!langMenu) return false

      const currentLangElement = langMenu.querySelector(".dropdown-toggle")
      if (!currentLangElement) return false

      const currentLangText = currentLangElement.textContent.trim()

      // Verifica se já está em português
      if (currentLangText.includes("Português") || currentLangText.includes("(pt)")) {
        console.log("Idioma já está em português")
        return true
      }

      // Procura pelo link do português
      const portugueseLink = langMenu.querySelector('a[href*="lang=pt"]')
      if (portugueseLink) {
        console.log("Alterando idioma para português...")
        portugueseLink.click()
        await delay(2000)
        return true
      } else {
        console.log("Link do português não encontrado")
        return false
      }
    } catch (error) {
      console.error("Erro ao verificar/alterar idioma:", error)
      return false
    }
  }

  function obterTituloProva() {
    const tituloElement =
      document.querySelector("span.multilang.traducir-TR046.traducido") ||
      document.querySelector('span[lang="fnbr"].multilang') ||
      document.querySelector(".multilang.traducido")

    if (tituloElement) {
      return tituloElement.textContent.trim()
    }

    const breadcrumb = document.querySelector(".breadcrumb-item.active, .page-header-headings h1")
    if (breadcrumb) {
      return breadcrumb.textContent.trim()
    }

    return "@by mzzvxm"
  }

  function createSplashScreen() {
    const splash = document.createElement("div")
    splash.id = "gemini-splash"
    splash.innerHTML = `
      <div class="splash-content">
        <div class="splash-logo">🤖</div>
        <h1>Funiber Bypass Dual AI</h1>
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
        <div class="splash-status">Verificando idioma...</div>
      </div>
    `
    document.body.appendChild(splash)

    GM_addStyle(`
      #gemini-splash {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        z-index: 99999;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        transition: opacity 0.4s ease;
      }
      .splash-content {
        text-align: center;
        padding: 30px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .splash-logo {
        font-size: 48px;
        margin-bottom: 16px;
        animation: bounce 1.5s infinite;
      }
      .splash-content h1 {
        font-size: 24px;
        margin: 0 0 20px;
        font-weight: 600;
        background: linear-gradient(90deg, #4ade80, #22d3ee);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .loading-dots {
        display: flex;
        justify-content: center;
        gap: 4px;
        margin: 20px 0;
      }
      .loading-dots span {
        width: 8px;
        height: 8px;
        background: #4ade80;
        border-radius: 50%;
        animation: pulse 1.4s infinite both;
      }
      .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
      .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
      .splash-status {
        font-size: 14px;
        opacity: 0.8;
      }
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
      @keyframes pulse {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
    `)

    return splash
  }

  function updateSplashStatus(message) {
    const statusEl = document.querySelector(".splash-status")
    if (statusEl) statusEl.textContent = message
  }

  function removeSplashScreen() {
    const splash = document.getElementById("gemini-splash")
    if (splash) {
      splash.style.opacity = "0"
      setTimeout(() => splash.remove(), 400)
    }
  }

  function createUI() {
    const panel = document.createElement("div")
    panel.id = "gemini-panel"
    panel.innerHTML = `
      <div class="panel-header" id="panel-header">
        <span class="logo" id="current-ai-icon">${AI_CONFIGS[currentAI].icon}</span>
        <span class="title">Funiber Bypass</span>
        <div class="controls">
          <button id="ai-switch" title="Alternar IA" class="ai-switch-btn">
            <span class="ai-name">${AI_CONFIGS[currentAI].name}</span>
          </button>
          <button id="gemini-minimize" title="Minimizar">−</button>
          <div class="status-dot" id="status-dot"></div>
        </div>
      </div>
      <div class="panel-body" id="panel-body">
        <div class="status-bar">
          <span id="gemini-status">Inicializando...</span>
        </div>
        <div class="course-info" id="course-info">
          <span>📚 Detectando disciplina...</span>
        </div>
        <div class="actions">
          <button id="gemini-start" class="btn-primary" disabled>Resolver Todas</button>
          <button id="gemini-settings" class="btn-secondary">⚙️</button>
        </div>
        <div id="settings-panel" class="settings hidden">
          <div class="setting">
            <label>Delay: <input type="number" id="delay-input" value="2000" min="1000" max="5000" step="100">ms</label>
          </div>
          <div class="setting">
            <label><input type="checkbox" id="show-reasoning" checked> Explicações detalhadas</label>
          </div>
          <div class="setting">
            <label><input type="checkbox" id="auto-show-explanation"> Mostrar explicação automaticamente</label>
          </div>
          <div class="setting">
            <label><input type="checkbox" id="auto-language" checked> Auto alterar para português</label>
          </div>
          <div class="ai-status">
            <div class="ai-item">
              <span class="ai-indicator" id="gemini-indicator">🧠</span>
              <span>Gemini: <span id="gemini-status-text">Testando...</span></span>
            </div>
            <div class="ai-item">
              <span class="ai-indicator" id="deepseek-indicator">🤖</span>
              <span>DeepSeek: <span id="deepseek-status-text">Testando...</span></span>
            </div>
          </div>
        </div>
        <div id="questoes-list" class="questoes"></div>
      </div>
    `
    document.body.appendChild(panel)

    GM_addStyle(`
      #gemini-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 340px;
        max-height: 80vh;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        z-index: 9999;
        overflow: hidden;
        transition: all 0.3s ease;
        user-select: none;
      }
      .panel-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
        cursor: move;
        user-select: none;
      }
      .panel-header:hover {
        background: #f1f5f9;
      }
      .panel-header.dragging {
        background: #e2e8f0;
        cursor: grabbing;
      }
      .logo {
        font-size: 16px;
        margin-right: 8px;
      }
      .title {
        flex: 1;
        font-weight: 600;
        color: #1f2937;
        font-size: 14px;
      }
      .controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ai-switch-btn {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .ai-switch-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }
      .ai-name {
        font-size: 10px;
      }
      .controls button {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
      }
      .controls button:hover:not(.ai-switch-btn) {
        background: #e5e7eb;
        color: #374151;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
        transition: background 0.3s ease;
      }
      .status-dot.connected {
        background: #10b981;
      }
      .panel-body {
        padding: 16px;
        overflow-y: auto;
        max-height: calc(80vh - 60px);
      }
      .status-bar {
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f1f5f9;
        border-radius: 6px;
        color: #475569;
        font-size: 12px;
        text-align: center;
      }
      .course-info {
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #eff6ff;
        border-radius: 6px;
        color: #1e40af;
        font-size: 11px;
        border-left: 3px solid #3b82f6;
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      .btn-primary {
        flex: 1;
        padding: 8px 12px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      .btn-primary:disabled {
        background: #d1d5db;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      .btn-secondary {
        padding: 8px;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }
      .btn-secondary:hover {
        background: #e5e7eb;
      }
      .settings {
        background: #f8fafc;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
        border: 1px solid #e5e7eb;
      }
      .setting {
        margin-bottom: 8px;
      }
      .setting:last-child {
        margin-bottom: 0;
      }
      .setting label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #374151;
      }
      .setting input[type="number"] {
        width: 60px;
        padding: 2px 6px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 11px;
      }
      .setting input[type="checkbox"] {
        margin: 0;
      }
      .ai-status {
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid #e5e7eb;
      }
      .ai-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 11px;
      }
      .ai-indicator {
        font-size: 12px;
        opacity: 0.5;
        transition: opacity 0.3s ease;
      }
      .ai-indicator.active {
        opacity: 1;
      }
      .questoes {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .questao-item {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 10px;
        transition: all 0.2s ease;
      }
      .questao-item.processing {
        border-color: #3b82f6;
        background: #eff6ff;
      }
      .questao-item.success {
        border-color: #10b981;
        background: #ecfdf5;
      }
      .questao-item.error {
        border-color: #ef4444;
        background: #fef2f2;
      }
      .questao-item.partial {
        border-color: #f59e0b;
        background: #fffbeb;
      }
      .questao-title {
        font-size: 12px;
        color: #374151;
        margin-bottom: 6px;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .questao-status {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        margin-bottom: 8px;
      }
      .questao-result {
        color: #10b981;
        font-weight: 500;
        font-size: 10px;
      }
      .questao-partial {
        color: #f59e0b;
        font-weight: 500;
        font-size: 10px;
      }
      .questao-error {
        color: #ef4444;
      }
      .questao-btn {
        padding: 4px 8px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 10px;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .questao-btn:hover {
        background: #2563eb;
      }
      .questao-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }
      .questao-actions {
        display: flex;
        gap: 6px;
        margin-top: 8px;
      }
      .btn-explain {
        padding: 4px 8px;
        background: #8b5cf6;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 10px;
        cursor: pointer;
        transition: background 0.2s ease;
        display: flex;
        align-items: center;
        gap: 3px;
      }
      .btn-explain:hover {
        background: #7c3aed;
      }
      .btn-retry {
        padding: 4px 8px;
        background: #f59e0b;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 10px;
        cursor: pointer;
        transition: background 0.2s ease;
        display: flex;
        align-items: center;
        gap: 3px;
      }
      .btn-retry:hover {
        background: #d97706;
      }
      .explanation {
        margin-top: 8px;
        padding: 10px;
        background: #f0f9ff;
        border-radius: 6px;
        font-size: 11px;
        color: #0c4a6e;
        line-height: 1.4;
        border-left: 3px solid #0ea5e9;
        display: none;
      }
      .explanation.show {
        display: block;
        animation: slideDown 0.3s ease;
      }
      .explanation-header {
        font-weight: 600;
        margin-bottom: 6px;
        color: #0c4a6e;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .associations-result {
        margin-top: 6px;
        font-size: 10px;
      }
      .association-item {
        background: rgba(16, 185, 129, 0.1);
        padding: 4px 6px;
        margin: 2px 0;
        border-radius: 3px;
        border-left: 2px solid #10b981;
      }
      .association-item.error {
        background: rgba(239, 68, 68, 0.1);
        border-left: 2px solid #ef4444;
      }
      .hidden {
        display: none;
      }
      .minimized {
        height: 45px;
        overflow: hidden;
      }
      .minimized .panel-body {
        display: none;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideDown {
        from { opacity: 0; max-height: 0; }
        to { opacity: 1; max-height: 500px; }
      }
      .fade-in {
        animation: fadeIn 0.3s ease;
      }
    `)

    setupEventListeners()
    setupDragFunctionality()
    return panel
  }

  function setupDragFunctionality() {
    const panel = document.getElementById("gemini-panel")
    const header = document.getElementById("panel-header")

    header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".controls")) return

      isDragging = true
      header.classList.add("dragging")

      const rect = panel.getBoundingClientRect()
      dragOffset.x = e.clientX - rect.left
      dragOffset.y = e.clientY - rect.top

      document.addEventListener("mousemove", handleDrag)
      document.addEventListener("mouseup", handleDragEnd)

      e.preventDefault()
    })

    function handleDrag(e) {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      const maxX = window.innerWidth - panel.offsetWidth
      const maxY = window.innerHeight - panel.offsetHeight

      const constrainedX = Math.max(0, Math.min(newX, maxX))
      const constrainedY = Math.max(0, Math.min(newY, maxY))

      panel.style.left = constrainedX + "px"
      panel.style.top = constrainedY + "px"
      panel.style.right = "auto"
      panel.style.bottom = "auto"
    }

    function handleDragEnd() {
      isDragging = false
      header.classList.remove("dragging")
      document.removeEventListener("mousemove", handleDrag)
      document.removeEventListener("mouseup", handleDragEnd)
    }
  }

  function setupEventListeners() {
    document.getElementById("gemini-minimize").addEventListener("click", toggleMinimize)
    document.getElementById("gemini-settings").addEventListener("click", toggleSettings)
    document.getElementById("gemini-start").addEventListener("click", resolverTodasQuestoes)
    document.getElementById("ai-switch").addEventListener("click", switchAI)
  }

  async function switchAI() {
    const newAI = currentAI === "gemini" ? "deepseek" : "gemini"

    updateStatus(`Testando ${AI_CONFIGS[newAI].name}...`, false)

    const isWorking = await testarConexaoAI(newAI)

    if (isWorking) {
      currentAI = newAI
      updateAIInterface()
      updateStatus(`${AI_CONFIGS[currentAI].name} conectado`, true)
      document.getElementById("gemini-start").disabled = false
    } else {
      updateStatus(`${AI_CONFIGS[newAI].name} falhou, mantendo ${AI_CONFIGS[currentAI].name}`, true)
      // Fallback: testa a IA atual novamente
      const currentWorking = await testarConexaoAI(currentAI)
      if (!currentWorking) {
        updateStatus("Ambas as IAs falharam", false)
        document.getElementById("gemini-start").disabled = true
      }
    }
  }

  function updateAIInterface() {
    const icon = document.getElementById("current-ai-icon")
    const switchBtn = document.getElementById("ai-switch")

    icon.textContent = AI_CONFIGS[currentAI].icon
    switchBtn.querySelector(".ai-name").textContent = AI_CONFIGS[currentAI].name

    // Atualizar indicadores
    document.getElementById("gemini-indicator").classList.toggle("active", currentAI === "gemini")
    document.getElementById("deepseek-indicator").classList.toggle("active", currentAI === "deepseek")
  }

  function toggleMinimize() {
    const panel = document.getElementById("gemini-panel")
    const btn = document.getElementById("gemini-minimize")

    isPanelMinimized = !isPanelMinimized

    if (isPanelMinimized) {
      panel.classList.add("minimized")
      btn.textContent = "+"
    } else {
      panel.classList.remove("minimized")
      btn.textContent = "−"
    }
  }

  function toggleSettings() {
    const settings = document.getElementById("settings-panel")
    settings.classList.toggle("hidden")
  }

  function updateStatus(message, isConnected = false) {
    const statusEl = document.getElementById("gemini-status")
    const dotEl = document.getElementById("status-dot")

    statusEl.textContent = message

    if (isConnected) {
      dotEl.classList.add("connected")
    } else {
      dotEl.classList.remove("connected")
    }
  }

  function updateCourseInfo(titulo) {
    const courseEl = document.getElementById("course-info")
    courseEl.innerHTML = `📚 ${titulo}`
  }

  async function testarConexaoAI(aiType) {
    const config = AI_CONFIGS[aiType]

    try {
      if (aiType === "gemini") {
        const res = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: config.testPrompt }] }],
          }),
        })

        const data = await res.json()
        const response = data?.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase()

        const isWorking = response && response.includes("ok")
        document.getElementById(`${aiType}-status-text`).textContent = isWorking ? "✅ Online" : "❌ Offline"
        return isWorking
      } else if (aiType === "deepseek") {
        const res = await fetch(config.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Funiber Bypass",
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: "user", content: config.testPrompt }],
            max_tokens: 50,
            temperature: 0.1,
          }),
        })

        const data = await res.json()
        const response = data?.choices?.[0]?.message?.content?.toLowerCase()

        const isWorking = response && response.includes("ok")
        document.getElementById(`${aiType}-status-text`).textContent = isWorking ? "✅ Online" : "❌ Offline"
        return isWorking
      }
    } catch (err) {
      console.error(`Erro ${config.name}:`, err)
      document.getElementById(`${aiType}-status-text`).textContent = "❌ Erro"
      return false
    }

    return false
  }

  async function testarConexao() {
    try {
      updateSplashStatus("Testando conexões...")

      // Testa ambas as IAs
      const geminiWorking = await testarConexaoAI("gemini")
      const deepseekWorking = await testarConexaoAI("deepseek")

      // Escolhe a IA principal
      if (geminiWorking) {
        currentAI = "gemini"
      } else if (deepseekWorking) {
        currentAI = "deepseek"
      } else {
        throw new Error("Nenhuma IA disponível")
      }

      updateAIInterface()
      updateStatus(`${AI_CONFIGS[currentAI].name} conectado`, true)
      document.getElementById("gemini-start").disabled = false
      updateSplashStatus("Conectado!")

      const titulo = obterTituloProva()
      updateCourseInfo(titulo)

      await delay(800)
      return true
    } catch (err) {
      updateStatus(`Erro: ${err.message}`)
      updateSplashStatus("Erro de conexão")
      console.error(err)
      await delay(1500)
      return false
    }
  }

  function obterQuestoes() {
    const questoesMultipla = [...document.querySelectorAll('div[class^="que multichoice"]')].map((el, index) => {
      const enunciado = el.querySelector(".qtext")?.innerText?.trim()
      const alternativas = [...el.querySelectorAll(".answer label")].map((label) => {
        const texto = label.innerText.replace(/^[a-d]\./i, "").trim()
        const letra = label.innerText.trim().substring(0, 1).toLowerCase()
        const input = label.previousElementSibling
        return { letra, texto, input }
      })
      return { tipo: "multipla", el, index, enunciado, alternativas }
    })

    const questoesAssociacao = [...document.querySelectorAll("div.formulation")]
      .filter((formulation) => {
        return formulation.querySelector("table.answer") && formulation.querySelectorAll("select").length > 0
      })
      .map((formulation, index) => {
        const table = formulation.querySelector("table.answer")
        const enunciado = formulation.querySelector(".qtext")?.innerText?.trim() || "Questão de associação"

        const linhas = [...table.querySelectorAll("tr")].filter((tr) => {
          return tr.querySelector("td.text") && tr.querySelector("select")
        })

        const alternativas = linhas
          .map((linha, i) => {
            const textoElement = linha.querySelector("td.text")
            const texto = textoElement ? textoElement.innerText.trim() : ""
            const select = linha.querySelector("select")
            const opcoes = select ? [...select.querySelectorAll("option")].filter((o) => o.value !== "0") : []

            return {
              texto,
              select,
              opcoes: opcoes.map((op) => ({ value: op.value, text: op.textContent.trim() })),
            }
          })
          .filter((alt) => alt.texto && alt.select && alt.opcoes.length > 0)

        return {
          tipo: "associacao",
          index: questoesMultipla.length + index,
          el: formulation,
          enunciado,
          alternativas,
        }
      })

    return [...questoesMultipla, ...questoesAssociacao]
  }

  async function gerarResposta(questao, incluirExplicacao = false) {
    const tituloProva = obterTituloProva()
    const config = AI_CONFIGS[currentAI]

    if (questao.tipo === "multipla") {
      const prompt = incluirExplicacao
        ? `Você é um especialista na disciplina "${tituloProva}".

Pergunta: ${questao.enunciado}

Alternativas:
${questao.alternativas.map((a) => `${a.letra}) ${a.texto}`).join("\n")}

IMPORTANTE: Responda SEMPRE em português brasileiro, mesmo que a pergunta esteja em outro idioma.

Forneça sua resposta no seguinte formato:
Resposta: [letra da alternativa correta]
Explicação: [explicação detalhada em português do porquê esta é a resposta correta]`
        : `Você é um especialista na disciplina "${tituloProva}".

Pergunta: ${questao.enunciado}

Alternativas:
${questao.alternativas.map((a) => `${a.letra}) ${a.texto}`).join("\n")}

Responda apenas com a letra da alternativa correta.`

      try {
        let res, data, raw

        if (currentAI === "gemini") {
          res = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: incluirExplicacao ? 500 : 100,
              },
            }),
          })
          data = await res.json()
          raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
        } else if (currentAI === "deepseek") {
          res = await fetch(config.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
              "HTTP-Referer": window.location.origin,
              "X-Title": "Funiber Bypass",
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: incluirExplicacao ? 500 : 100,
              temperature: 0.2,
            }),
          })
          data = await res.json()
          raw = data?.choices?.[0]?.message?.content || ""
        }

        if (incluirExplicacao) {
          const respostaMatch = raw.match(/Resposta:\s*([abcd])/i)
          const explicacao = raw.match(/Explicação:\s*([\s\S]*)/i)
          return {
            letra: respostaMatch?.[1]?.toLowerCase() || null,
            explicacao: explicacao?.[1]?.trim() || null,
          }
        } else {
          const letra = raw.match(/[abcd]/i)?.[0]?.toLowerCase()
          return { letra }
        }
      } catch (err) {
        console.error(`Erro ${config.name}:`, err)
        return { letra: null, erro: err.message }
      }
    } else if (questao.tipo === "associacao") {
      const prompt = incluirExplicacao
        ? `Você é um especialista na disciplina "${tituloProva}".

IMPORTANTE: Responda SEMPRE em português brasileiro, mesmo que a pergunta esteja em outro idioma.

Questão de associação: ${questao.enunciado}

Associe cada definição com o conceito correto:

${questao.alternativas
  .map(
    (a, i) =>
      `${i + 1}. "${a.texto}"
   Opções disponíveis: ${a.opcoes.map((op) => op.text).join(", ")}`,
  )
  .join("\n\n")}

Forneça sua resposta no seguinte formato:
Associações:
1) [Conceito escolhido]
2) [Conceito escolhido]
...

Explicação: [Explique em português cada associação e por que está correta]`
        : `Você é um especialista na disciplina "${tituloProva}".

Questão de associação: ${questao.enunciado}

Associe cada definição com o conceito correto:

${questao.alternativas
  .map(
    (a, i) =>
      `${i + 1}. "${a.texto}"
   Opções: ${a.opcoes.map((op) => op.text).join(", ")}`,
  )
  .join("\n\n")}

Responda no formato:
1) [Conceito]
2) [Conceito]
...`

      try {
        let res, data, raw

        if (currentAI === "gemini") {
          res = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: incluirExplicacao ? 600 : 300,
              },
            }),
          })
          data = await res.json()
          raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
        } else if (currentAI === "deepseek") {
          res = await fetch(config.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
              "HTTP-Referer": window.location.origin,
              "X-Title": "Funiber Bypass",
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: incluirExplicacao ? 600 : 300,
              temperature: 0.2,
            }),
          })
          data = await res.json()
          raw = data?.choices?.[0]?.message?.content || ""
        }

        if (incluirExplicacao) {
          const associacoesMatch = raw.match(/Associações:\s*([\s\S]*?)(?=Explicação:|$)/i)
          const explicacaoMatch = raw.match(/Explicação:\s*([\s\S]*)/i)

          const respostas =
            associacoesMatch?.[1]?.match(/\d\)\s*([^\n\d]+)/g)?.map((r) => r.replace(/\d\)\s*/, "").trim()) || []

          return {
            respostas,
            explicacao: explicacaoMatch?.[1]?.trim() || null,
          }
        } else {
          const respostas = raw.match(/\d\)\s*([^\n\d]+)/g)?.map((r) => r.replace(/\d\)\s*/, "").trim()) || []
          return { respostas }
        }
      } catch (err) {
        console.error(`Erro ${config.name}:`, err)
        return { respostas: [], erro: err.message }
      }
    }

    return { erro: "Tipo de questão não suportado" }
  }

  function criarElementoQuestao(questao) {
    const item = document.createElement("div")
    item.className = "questao-item fade-in"
    item.dataset.index = questao.index
    item.innerHTML = `
      <div class="questao-title">${questao.enunciado.substring(0, 120)}${questao.enunciado.length > 120 ? "..." : ""}</div>
      <div class="questao-status">
        <span>Q${questao.index + 1} (${questao.tipo === "multipla" ? "Múltipla" : "Associação"})</span>
        <button class="questao-btn" data-action="resolver" data-index="${questao.index}">Resolver</button>
      </div>
      <div class="questao-actions hidden"></div>
      <div class="explanation" id="explanation-${questao.index}">
        <div class="explanation-header">
          <span>${AI_CONFIGS[currentAI].icon}</span>
          <span>Explicação da IA</span>
        </div>
        <div class="explanation-content"></div>
      </div>
    `
    return item
  }

  // Função global para resolver questão
  window.resolverQuestao = async (index) => {
    const questoes = obterQuestoes()
    const questao = questoes[index]
    const showReasoning = document.getElementById("show-reasoning").checked
    const autoShowExplanation = document.getElementById("auto-show-explanation").checked

    if (!questao) return

    const questaoEl = document.querySelector(`.questao-item[data-index="${index}"]`)
    if (!questaoEl) return

    questaoEl.className = "questao-item processing"
    questaoEl.querySelector(".questao-status").innerHTML = `
      <span>Processando com ${AI_CONFIGS[currentAI].name}...</span>
      <span>⏳</span>
    `
    questaoEl.querySelector(".questao-actions").classList.add("hidden")

    try {
      const resposta = await gerarResposta(questao, showReasoning)

      if (questao.tipo === "multipla") {
        const alvo = questao.alternativas.find((a) => a.letra === resposta.letra)

        if (alvo) {
          alvo.input.checked = true
          alvo.input.dispatchEvent(new Event("change", { bubbles: true }))

          questaoEl.className = "questao-item success"
          questaoEl.querySelector(".questao-status").innerHTML = `
            <span class="questao-result">✓ ${resposta.letra.toUpperCase()}) ${alvo.texto.substring(0, 25)}...</span>
          `

          const actionsEl = questaoEl.querySelector(".questao-actions")
          actionsEl.classList.remove("hidden")
          actionsEl.innerHTML = `
            <button class="btn-explain" data-action="toggle-explanation" data-index="${index}">
              <span>💡</span>
              <span>Ver explicação</span>
            </button>
            <button class="btn-retry" data-action="resolver" data-index="${index}">
              <span>🔄</span>
              <span>Tentar novamente</span>
            </button>
          `

          if (showReasoning && resposta.explicacao) {
            const explanationContent = questaoEl.querySelector(".explanation-content")
            explanationContent.innerHTML = resposta.explicacao

            if (autoShowExplanation) {
              questaoEl.querySelector(".explanation").classList.add("show")
            }
          }
        } else {
          throw new Error("Resposta não encontrada")
        }
      } else if (questao.tipo === "associacao") {
        let acertos = 0
        const resultados = []

        questao.alternativas.forEach((linha, i) => {
          const respostaSugerida = resposta.respostas[i]
          if (respostaSugerida) {
            const opcaoEncontrada = linha.opcoes.find(
              (op) =>
                op.text.toLowerCase().includes(respostaSugerida.toLowerCase()) ||
                respostaSugerida.toLowerCase().includes(op.text.toLowerCase()) ||
                op.text
                  .toLowerCase()
                  .split(" ")
                  .some((palavra) => respostaSugerida.toLowerCase().includes(palavra) && palavra.length > 3),
            )

            if (opcaoEncontrada) {
              linha.select.value = opcaoEncontrada.value
              linha.select.dispatchEvent(new Event("change", { bubbles: true }))
              acertos++
              resultados.push({
                texto: `${i + 1}. ${opcaoEncontrada.text}`,
                sucesso: true,
              })
            } else {
              resultados.push({
                texto: `${i + 1}. ❌ Não encontrado: ${respostaSugerida}`,
                sucesso: false,
              })
            }
          } else {
            resultados.push({
              texto: `${i + 1}. ❌ Sem resposta`,
              sucesso: false,
            })
          }
        })

        if (acertos === questao.alternativas.length) {
          questaoEl.className = "questao-item success"
        } else if (acertos > 0) {
          questaoEl.className = "questao-item partial"
        } else {
          questaoEl.className = "questao-item error"
        }

        questaoEl.querySelector(".questao-status").innerHTML = `
          <span class="${acertos === questao.alternativas.length ? "questao-result" : "questao-partial"}">
            ${acertos}/${questao.alternativas.length} associações
          </span>
        `

        if (questaoEl.querySelector(".associations-result")) {
          questaoEl.querySelector(".associations-result").remove()
        }

        const associationsResult = document.createElement("div")
        associationsResult.className = "associations-result"
        associationsResult.innerHTML = resultados
          .map((r) => `<div class="association-item ${!r.sucesso ? "error" : ""}">${r.texto}</div>`)
          .join("")
        questaoEl.appendChild(associationsResult)

        const actionsEl = questaoEl.querySelector(".questao-actions")
        actionsEl.classList.remove("hidden")
        actionsEl.innerHTML = `
          <button class="btn-explain" data-action="toggle-explanation" data-index="${index}">
            <span>💡</span>
            <span>Ver explicação</span>
          </button>
          <button class="btn-retry" data-action="resolver" data-index="${index}">
            <span>🔄</span>
            <span>Tentar novamente</span>
          </button>
        `

        if (showReasoning && resposta.explicacao) {
          const explanationContent = questaoEl.querySelector(".explanation-content")
          explanationContent.innerHTML = resposta.explicacao

          if (autoShowExplanation) {
            questaoEl.querySelector(".explanation").classList.add("show")
          }
        }
      }
    } catch (err) {
      questaoEl.className = "questao-item error"
      questaoEl.querySelector(".questao-status").innerHTML = `
        <span class="questao-error">Erro: ${err.message}</span>
      `

      const actionsEl = questaoEl.querySelector(".questao-actions")
      actionsEl.classList.remove("hidden")
      actionsEl.innerHTML = `
        <button class="btn-retry" data-action="resolver" data-index="${index}">
          <span>🔄</span>
          <span>Tentar novamente</span>
        </button>
      `
    }
  }

  // Função global para toggle da explicação
  window.toggleExplanation = (index) => {
    const explanation = document.getElementById(`explanation-${index}`)
    if (explanation) {
      explanation.classList.toggle("show")

      const questaoEl = document.querySelector(`.questao-item[data-index="${index}"]`)
      const btnExplain = questaoEl.querySelector(".btn-explain")

      if (explanation.classList.contains("show")) {
        btnExplain.innerHTML = `
          <span>🔍</span>
          <span>Ocultar explicação</span>
        `
      } else {
        btnExplain.innerHTML = `
          <span>💡</span>
          <span>Ver explicação</span>
        `
      }
    }
  }

  async function resolverTodasQuestoes() {
    const questoes = obterQuestoes()
    const container = document.getElementById("questoes-list")
    const startBtn = document.getElementById("gemini-start")
    const delay_ms = Number.parseInt(document.getElementById("delay-input").value)

    startBtn.disabled = true
    startBtn.textContent = "Processando..."
    container.innerHTML = ""

    questoes.forEach((questao) => {
      const questaoEl = criarElementoQuestao(questao)
      container.appendChild(questaoEl)
    })

    for (let i = 0; i < questoes.length; i++) {
      await window.resolverQuestao(i)
      if (i < questoes.length - 1) await delay(delay_ms)
    }

    startBtn.disabled = false
    startBtn.textContent = "Resolver Todas"
  }

  // Event delegation para botões dinâmicos
  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="resolver"]')) {
      const index = Number.parseInt(e.target.closest('[data-action="resolver"]').dataset.index)
      window.resolverQuestao(index)
    } else if (e.target.closest('[data-action="toggle-explanation"]')) {
      const index = Number.parseInt(e.target.closest('[data-action="toggle-explanation"]').dataset.index)
      window.toggleExplanation(index)
    }
  })

  // Inicialização
  const splash = createSplashScreen()
  await delay(1000)

  // Verificar e alterar idioma se necessário
  const autoLanguage = true
  if (autoLanguage) {
    updateSplashStatus("Verificando idioma...")
    const idiomaAlterado = await verificarEAlterarIdioma()

    if (idiomaAlterado) {
      updateSplashStatus("Idioma alterado para português")
      await delay(1000)
    }
  }

  updateSplashStatus("Conectando...")
  createUI()
  const conexaoOk = await testarConexao()

  removeSplashScreen()

  if (!conexaoOk) {
    updateStatus("Falha na conexão")
  }
})()
