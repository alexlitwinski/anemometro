// anemometro-card-v4.js
// Versão 4.0.0 - Ajuste de escala, sensibilidade e correção do pedestal
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
    console.log("Anemômetro Card v4.0.0 carregado");
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
    const rotor = this.shadowRoot.querySelector('.anemometro-rotor');
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
    
    // Estrutura do card com estilos aprimorados e correção do pedestal
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
          
          /* Pedestal corrigido - agora vai até o centro */
          .anemometro-pedestal {
            position: absolute;
            width: 8px;
            height: 80px; /* Altura aumentada */
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(to right, #555, #888, #555);
            border-radius: 2px;
            z-index: 1;
          }
          
          .anemometro-base {
            position: absolute;
            width: 22px;
            height: 22px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle at 35% 35%, #999, #666);
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            z-index: 4;
          }
          
          /* Rotor com braços e copos */
          .anemometro-rotor {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            animation: rotate linear infinite;
            animation-duration: ${this.rotationSpeed}s;
            animation-play-state: running;
            transform-origin: center;
            z-index: 3;
          }
          
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          /* Braços estilizados */
          .braco {
            position: absolute;
            width: 75px;
            height: 3px;
            top: 50%;
            left: 50%;
            transform-origin: left center;
            background: linear-gradient(to right, #777, #555);
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            z-index: 2;
          }
          
          .braco-1 { transform: translate(0, -50%) rotate(0deg); }
          .braco-2 { transform: translate(0, -50%) rotate(120deg); }
          .braco-3 { transform: translate(0, -50%) rotate(240deg); }
          
          /* Copos do anemômetro estilizados */
          .copo {
            position: absolute;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #555, #333);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 2;
          }
          
          .copo-1 {
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
          }
          
          .copo-2 {
            top: 15%;
            left: 30%;
            transform: translate(-50%, -50%);
          }
          
          .copo-3 {
            bottom: 15%;
            left: 30%;
            transform: translate(-50%, 50%);
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
            <div class="anemometro-pedestal"></div>
            <div class="anemometro-rotor">
              <div class="braco braco-1"></div>
              <div class="braco braco-2"></div>
              <div class="braco braco-3"></div>
              <div class="copo copo-1"></div>
              <div class="copo copo-2"></div>
              <div class="copo copo-3"></div>
            </div>
            <div class="anemometro-base"></div>
          </div>
          <div class="valor-container">
            <div class="valor">${parseFloat(state.state).toFixed(1)} ${unidade}</div>
          </div>
          <div class="version">v4.0.0</div>
        </div>
      </ha-card>
    `;
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
