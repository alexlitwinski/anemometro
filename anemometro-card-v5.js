// anemometro-card-v7.js
// Versão 7.0.0 - Abordagem completamente nova para os braços e copos
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
    this.firstRender = true;
    this._updateRotationSpeed = this._updateRotationSpeed.bind(this);
    console.log("Anemômetro Card v7.0.0 carregado");
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Você precisa definir uma entidade');
    }
    this.config = config;
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    
    const entityId = this.config.entity;
    const state = hass.states[entityId];
    
    if (state) {
      const velocidadeVento = parseFloat(state.state);
      const oldRotationSpeed = this.rotationSpeed;
      this.rotationSpeed = this._calculateRotationSpeed(velocidadeVento);
      
      // Primeira renderização ou mudança no estado
      if (this.firstRender) {
        this._createCard();
        this.firstRender = false;
      } else if (oldRotationSpeed !== this.rotationSpeed) {
        this._updateRotationSpeed();
      }
      
      // Atualizar apenas o valor exibido
      if (!oldHass || oldHass.states[entityId].state !== state.state) {
        this._updateValorDisplay(state);
      }
    }
  }
  
  _calculateRotationSpeed(velocidadeVento) {
    // AJUSTE: Velocidade mínima é 0.1, máxima é 5 km/h
    const minVelocidade = 0.1; // Começa a girar em 0.1 km/h
    const maxVelocidade = 5.0; // Velocidade máxima em 5 km/h
    
    // Valores de duração de animação (em segundos)
    const maxDuracao = 60; // Muito lento (0.1 km/h)
    const minDuracao = 1.0; // Muito rápido (5 km/h ou mais)
    
    // IMPORTANTE: Se a velocidade for menor que o mínimo, retorna uma duração muito longa
    // Isso faz com que o anemômetro gire extremamente devagar, mas não pare completamente
    if (velocidadeVento < minVelocidade) {
      return 120; // Giro muito lento, quase imperceptível, mas existe
    }
    
    // Limitar a velocidade do vento ao intervalo definido
    const velocidadeLimitada = Math.min(Math.max(velocidadeVento, minVelocidade), maxVelocidade);
    
    // Calcular a duração da animação inversamente proporcional à velocidade
    // Quanto maior a velocidade, menor a duração (mais rápido gira)
    const duracao = Math.max(
      minDuracao,
      maxDuracao - ((velocidadeLimitada - minVelocidade) / (maxVelocidade - minVelocidade)) * (maxDuracao - minDuracao)
    );
    
    console.log(`Velocidade: ${velocidadeVento.toFixed(1)} km/h, Duração: ${duracao.toFixed(1)}s`);
    return duracao;
  }
  
  _updateRotationSpeed() {
    const rotor = this.shadowRoot.querySelector('#rotor');
    if (!rotor) return;
    
    // Nunca pausa completamente a animação, apenas ajusta a velocidade
    rotor.style.animationDuration = `${this.rotationSpeed}s`;
    rotor.style.animationPlayState = 'running';
  }
  
  _updateValorDisplay(state) {
    const valorElement = this.shadowRoot.querySelector('.valor');
    if (valorElement && state) {
      const unidade = this.config.unit_of_measurement || 
                     state.attributes.unit_of_measurement || 
                     'km/h';
      valorElement.textContent = `${parseFloat(state.state).toFixed(1)} ${unidade}`;
    }
  }
  
  _createCard() {
    if (!this._hass || !this.config) return;
    
    const entityId = this.config.entity;
    const state = this._hass.states[entityId];
    
    if (!state) return;
    
    // Obter configurações
    const unidade = this.config.unit_of_measurement || 
                   state.attributes.unit_of_measurement || 
                   'km/h';
    const nome = this.config.name || state.attributes.friendly_name || entityId;
    
    // Estrutura do card com abordagem SVG para garantir simetria
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
            position: relative;
          }
          .title {
            font-size: 1.2em;
            font-weight: 500;
            margin-bottom: 16px;
            width: 100%;
            text-align: center;
          }
          .anemometro-container {
            width: 200px;
            height: 200px;
            margin: 10px 0;
            position: relative;
          }
          
          #rotor {
            position: absolute;
            width: 100%;
            height: 100%;
            animation: rotate linear infinite;
            animation-duration: ${this.rotationSpeed}s;
            animation-play-state: running;
            transform-origin: center;
          }
          
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Display de valor */
          .valor-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 15px;
            background: rgba(0,0,0,0.05);
            padding: 8px 16px;
            border-radius: 16px;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
          }
          
          .valor {
            font-size: 1.5em;
            font-weight: bold;
            color: var(--primary-text-color);
          }
          
          .version {
            font-size: 0.7em;
            color: #999;
            position: absolute;
            bottom: 5px;
            right: 8px;
          }
        </style>
        <div class="card-content">
          <div class="title">${nome}</div>
          <div class="anemometro-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              <!-- Pedestal -->
              <rect x="96" y="100" width="8" height="90" rx="2" ry="2" fill="#777" />
              
              <!-- Grupo rotativo -->
              <g id="rotor">
                <!-- 3 Braços perfeitamente simétricos -->
                <line x1="100" y1="100" x2="170" y2="100" stroke="#666" stroke-width="3" />
                <line x1="100" y1="100" x2="65" y2="160.62" stroke="#666" stroke-width="3" />
                <line x1="100" y1="100" x2="65" y2="39.38" stroke="#666" stroke-width="3" />
                
                <!-- 3 Copos -->
                <circle cx="170" cy="100" r="15" fill="#444" />
                <circle cx="65" cy="160.62" r="15" fill="#444" />
                <circle cx="65" cy="39.38" r="15" fill="#444" />
              </g>
              
              <!-- Centro/Base (por cima dos braços) -->
              <circle cx="100" cy="100" r="10" fill="#888" />
            </svg>
          </div>
          <div class="valor-container">
            <div class="valor">${parseFloat(state.state).toFixed(1)} ${unidade}</div>
          </div>
          <div class="version">v7.0</div>
        </div>
      </ha-card>
    `;
    
    // Atualizar a velocidade de rotação após criar o card
    this._updateRotationSpeed();
  }
  
  disconnectedCallback() {
    // Limpar qualquer recurso quando o elemento for removido
    console.log("Anemômetro card removido");
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
