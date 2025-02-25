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
    this.currentRotation = 0;
    this.lastTimestamp = 0;
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
            width: 20px;
            height: 20px;
            background-color: #888;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 3;
          }
          .anemometro-rotor {
            position: absolute;
            width: 200px;
            height: 200px;
            top: 0;
            left: 0;
          }
          .braco {
            position: absolute;
            width: 80px;
            height: 3px;
            background-color: #666;
            top: 50%;
            left: 50%;
            transform-origin: left center;
            z-index: 1;
          }
          .braco-1 { transform: translate(0, -50%) rotate(0deg); }
          .braco-2 { transform: translate(0, -50%) rotate(90deg); }
          .braco-3 { transform: translate(0, -50%) rotate(180deg); }
          .braco-4 { transform: translate(0, -50%) rotate(270deg); }
          .copo {
            position: absolute;
            width: 30px;
            height: 30px;
            background-color: #444;
            border-radius: 50% 50% 0 50%;
            transform-origin: center;
            z-index: 2;
          }
          .copo-1 { top: 50%; right: 10px; transform: translate(0, -50%) rotate(45deg); }
          .copo-2 { top: 10px; left: 50%; transform: translate(-50%, 0) rotate(135deg); }
          .copo-3 { top: 50%; left: 10px; transform: translate(0, -50%) rotate(225deg); }
          .copo-4 { bottom: 10px; left: 50%; transform: translate(-50%, 0) rotate(315deg); }
          .valor {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 10px;
          }
        </style>
        <div class="card-content">
          <div class="title">${nome}</div>
          <div class="anemometro-container">
            <div class="anemometro-rotor" id="rotor">
              <div class="braco braco-1"></div>
              <div class="braco braco-2"></div>
              <div class="braco braco-3"></div>
              <div class="braco braco-4"></div>
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
      return;
    }
    
    // Usando requestAnimationFrame para animação suave
    const animate = (timestamp) => {
      if (!this.lastTimestamp) {
        this.lastTimestamp = timestamp;
      }
      
      // Calcular o delta de tempo em segundos
      const deltaTime = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;
      
      // Atualizar o ângulo de rotação
      this.currentRotation += this.rotationSpeed * 360 * deltaTime;
      
      // Manter o valor do ângulo gerenciável
      if (this.currentRotation >= 360) {
        this.currentRotation = this.currentRotation % 360;
      }
      
      // Aplicar a rotação
      rotor.style.transform = `rotate(${this.currentRotation}deg)`;
      
      // Continuar a animação
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    this.animationFrame = requestAnimationFrame(animate);
  }
  
  // Limpar a animação quando o elemento é removido
  disconnectedCallback() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
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
