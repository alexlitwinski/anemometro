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
    this._updateHass = this._updateHass.bind(this);
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Você precisa definir uma entidade');
    }
    this.config = config;
    this.render();
  }

  set hass(hass) {
    if (!this._hass) {
      this._hass = hass;
      this.render();
    } else {
      this._hass = hass;
      this._updateHass();
    }
  }
  
  _updateHass() {
    const entityId = this.config.entity;
    const state = this._hass.states[entityId];
    
    if (state) {
      // Obter a velocidade do vento da entidade
      const velocidadeVento = parseFloat(state.state);
      
      // Definir a velocidade de rotação baseada na velocidade do vento
      this.rotationSpeed = this._calculateRotationSpeed(velocidadeVento);
      
      // Atualizar somente os elementos que precisam ser atualizados
      this._updateRotationSpeed();
      this._updateValorDisplay(state);
    }
  }
  
  _calculateRotationSpeed(velocidadeVento) {
    // Função que converte a velocidade do vento em velocidade de rotação (em segundos)
    const minVelocidade = 0;
    const maxVelocidade = 120; // km/h
    const maxDuracao = 60; // duração máxima em segundos (praticamente parado)
    const minDuracao = 0.2; // duração mínima em segundos (muito rápido)
    
    // Limitar a velocidade do vento ao intervalo definido
    const velocidadeLimitada = Math.max(velocidadeVento, minVelocidade);
    
    if (velocidadeLimitada <= 0.1) {
      return 0; // Parado
    }
    
    // Calcular a duração da animação inversamente proporcional à velocidade
    // Quanto maior a velocidade, menor a duração (mais rápido gira)
    const duracao = Math.max(
      minDuracao,
      maxDuracao - ((velocidadeLimitada / maxVelocidade) * (maxDuracao - minDuracao))
    );
    
    return duracao;
  }
  
  _updateRotationSpeed() {
    const animateElement = this.shadowRoot.querySelector('animateTransform');
    if (animateElement) {
      if (this.rotationSpeed <= 0) {
        // Parar a animação
        animateElement.setAttribute('dur', '0s');
        animateElement.setAttribute('repeatCount', '0');
      } else {
        // Atualizar a velocidade
        animateElement.setAttribute('dur', `${this.rotationSpeed}s`);
        animateElement.setAttribute('repeatCount', 'indefinite');
      }
    }
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
  
  render() {
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
    
    // Velocidade do vento e duração da animação
    const velocidadeVento = parseFloat(state.state);
    this.rotationSpeed = this._calculateRotationSpeed(velocidadeVento);
    
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
            width: 200px;
            height: 200px;
            margin: 10px 0;
          }
          .valor {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 10px;
          }
        </style>
        <div class="card-content">
          <div class="title">${nome}</div>
          <div class="anemometro-container">
            <svg viewBox="0 0 200 200" width="200" height="200">
              <!-- Base/Centro do anemômetro -->
              <circle cx="100" cy="100" r="10" fill="#888" />
              
              <!-- Grupo rotativo com braços e copos -->
              <g id="rotor">
                <!-- Braços -->
                <line x1="100" y1="100" x2="180" y2="100" stroke="#666" stroke-width="3" />
                <line x1="100" y1="100" x2="100" y2="180" stroke="#666" stroke-width="3" />
                <line x1="100" y1="100" x2="20" y2="100" stroke="#666" stroke-width="3" />
                <line x1="100" y1="100" x2="100" y2="20" stroke="#666" stroke-width="3" />
                
                <!-- Copos -->
                <path d="M180,100 a15,15 0 1,1 0,-0.1 z" fill="#444" transform="rotate(45,180,100)" />
                <path d="M100,180 a15,15 0 1,1 0,-0.1 z" fill="#444" transform="rotate(135,100,180)" />
                <path d="M20,100 a15,15 0 1,1 0,-0.1 z" fill="#444" transform="rotate(225,20,100)" />
                <path d="M100,20 a15,15 0 1,1 0,-0.1 z" fill="#444" transform="rotate(315,100,20)" />
                
                <!-- Animação -->
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="rotate"
                  from="0 100 100"
                  to="360 100 100"
                  dur="${this.rotationSpeed <= 0 ? '0s' : this.rotationSpeed + 's'}"
                  repeatCount="${this.rotationSpeed <= 0 ? '0' : 'indefinite'}" />
              </g>
            </svg>
          </div>
          <div class="valor">${parseFloat(state.state).toFixed(1)} ${unidade}</div>
        </div>
      </ha-card>
    `;
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
