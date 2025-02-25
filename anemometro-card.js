// anemometro-card.js
class AnemometroCard extends HTMLElement {
  // Definir propriedades estáticas para o card
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.rotationSpeed = 0;
    this.animationFrame = null;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Você precisa definir uma entidade');
    }
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    
    const entityId = this.config.entity;
    const state = hass.states[entityId];
    
    if (state) {
      // Obter a velocidade do vento da entidade
      const velocidadeVento = parseFloat(state.state);
      
      // Definir a velocidade de rotação baseada na velocidade do vento
      // Ajuste o fator de multiplicação para controlar a velocidade de rotação
      this.rotationSpeed = this._calculateRotationSpeed(velocidadeVento);
      
      // Renderizar o card
      this.updateCard();
    }
  }
  
  _calculateRotationSpeed(velocidadeVento) {
    // Função que converte a velocidade do vento em velocidade de rotação
    // Ajuste estes valores conforme necessário
    const minVelocidade = 0;
    const maxVelocidade = 120; // km/h
    const minRotacao = 0;
    const maxRotacao = 30; // rotações por segundo
    
    // Limitar a velocidade do vento ao intervalo definido
    const velocidadeLimitada = Math.min(Math.max(velocidadeVento, minVelocidade), maxVelocidade);
    
    // Calcular a velocidade de rotação proporcional
    return minRotacao + (velocidadeLimitada - minVelocidade) * 
           (maxRotacao - minRotacao) / (maxVelocidade - minVelocidade);
  }
  
  updateCard() {
    if (!this._hass || !this.config) {
      return;
    }
    
    const entityId = this.config.entity;
    const state = this._hass.states[entityId];
    
    if (!state) {
      return;
    }
    
    // Obter a unidade de medida da entidade
    const unidade = this.config.unit_of_measurement || 
                   state.attributes.unit_of_measurement || 
                   'km/h';
    
    // Obter rótulo personalizado ou usar o nome amigável da entidade
    const nome = this.config.name || state.attributes.friendly_name || entityId;
    
    // Criar o conteúdo do card
    this.shadowRoot.innerHTML = `
      <ha-card>
        <style>
          :host {
            display: block;
          }
          .card-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px;
          }
          .title {
            font-size: 1.2em;
            font-weight: 500;
            margin-bottom: 8px;
            width: 100%;
            text-align: center;
          }
          .anemometro-container {
            position: relative;
            width: 200px;
            height: 200px;
            margin: 10px 0;
          }
          .anemometro-base {
            position: absolute;
            width: 40px;
            height: 40px;
            background-color: #888;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
          }
          .anemometro-rotor {
            position: absolute;
            width: 200px;
            height: 200px;
            top: 0;
            left: 0;
            animation: rotate linear infinite;
            animation-play-state: paused;
          }
          .copo {
            position: absolute;
            width: 40px;
            height: 40px;
            background-color: #444;
            border-radius: 50% 50% 0 50%;
            transform-origin: center;
          }
          .copo-1 { top: 0; left: 50%; transform: translate(-50%, 0) rotate(0deg); }
          .copo-2 { top: 50%; right: 0; transform: translate(0, -50%) rotate(90deg); }
          .copo-3 { bottom: 0; left: 50%; transform: translate(-50%, 0) rotate(180deg); }
          .copo-4 { top: 50%; left: 0; transform: translate(0, -50%) rotate(270deg); }
          .valor {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 10px;
          }
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
        <div class="card-content">
          <div class="title">${nome}</div>
          <div class="anemometro-container">
            <div class="anemometro-rotor" id="rotor">
              <div class="copo copo-1"></div>
              <div class="copo copo-2"></div>
              <div class="copo copo-3"></div>
              <div class="copo copo-4"></div>
            </div>
            <div class="anemometro-base"></div>
          </div>
          <div class="valor">${parseFloat(state.state).toFixed(1)} ${unidade}</div>
        </div>
      </ha-card>
    `;
    
    // Iniciar a animação
    this.startAnimation();
  }
  
  startAnimation() {
    // Parar qualquer animação anterior
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    const rotor = this.shadowRoot.getElementById('rotor');
    if (!rotor) return;
    
    // Se a velocidade for zero, parar a animação
    if (this.rotationSpeed <= 0) {
      rotor.style.animationPlayState = 'paused';
      return;
    }
    
    // Definir a duração da animação com base na velocidade
    // Quanto maior a velocidade, menor a duração (mais rápido gira)
    const duracao = 1 / this.rotationSpeed;
    rotor.style.animationDuration = `${duracao}s`;
    rotor.style.animationPlayState = 'running';
  }
  
  // Define o tamanho do card para o Lovelace
  getCardSize() {
    return 3;
  }
}

// Registrar o elemento personalizado
customElements.define('anemometro-card', AnemometroCard);

// Informar ao Home Assistant sobre o novo card
window.customCards = window.customCards || [];
window.customCards.push({
  type: "anemometro-card",
  name: "Anemômetro Card",
  description: "Um card que mostra um anemômetro girando de acordo com a velocidade do vento."
});
