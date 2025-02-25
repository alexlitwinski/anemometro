// anemometro-card-v8.js
// Versão 8.0.0 - Rotação contínua e escala de velocidade ajustada
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
    this.currentRotation = 0;
    this.lastTime = Date.now();
    this.rafId = null;
    console.log("Anemômetro Card v8.0.0 carregado");
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
        this._startAnimation();
      } else if (oldRotationSpeed !== this.rotationSpeed) {
        // A velocidade mudou, mas continuamos a animação sem reiniciar
        console.log(`Velocidade alterada: ${velocidadeVento.toFixed(1)} km/h, RPM: ${this._calculateRPM(this.rotationSpeed)}`);
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
    
    // AJUSTE: Valores de RPM (rotações por minuto) em vez de duração
    const minRPM = 1; // 1 rotação por minuto em 0.1 km/h (muito lento)
    const maxRPM = 120; // 120 rotações por minuto em 5 km/h (2 por segundo - rápido)
    
    // IMPORTANTE: Se a velocidade for menor que o mínimo, usa o RPM mínimo
    if (velocidadeVento < minVelocidade) {
      return this._rpmToSpeed(minRPM / 2); // Metade do RPM mínimo para velocidades abaixo do limiar
    }
    
    // Limitar a velocidade do vento ao intervalo definido
    const velocidadeLimitada = Math.min(Math.max(velocidadeVento, minVelocidade), maxVelocidade);
    
    // Calcular o RPM proporcional à velocidade
    const rpm = minRPM + ((velocidadeLimitada - minVelocidade) / (maxVelocidade - minVelocidade)) * (maxRPM - minRPM);
    
    // Converter RPM para a velocidade angular usada na animação
    return this._rpmToSpeed(rpm);
  }
  
  // Converte RPM para velocidade angular em radianos por milissegundo
  _rpmToSpeed(rpm) {
    // rpm * 2π / 60000 = radianos por milissegundo
    return (rpm * 2 * Math.PI) / 60000;
  }
  
  // Calcula o RPM a partir da velocidade angular
  _calculateRPM(speed) {
    return (speed * 60000) / (2 * Math.PI);
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
  
  _startAnimation() {
    // Inicializa o tempo e o ângulo
    this.lastTime = Date.now();
    this.currentRotation = 0;
    
    // Função de animação
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - this.lastTime;
      this.lastTime = now;
      
      // Atualiza o ângulo de rotação com base na velocidade atual
      this.currentRotation += this.rotationSpeed * deltaTime;
      
      // Normaliza para 0-2π para evitar números muito grandes
      this.currentRotation %= (2 * Math.PI);
      
      // Aplica a rotação ao elemento SVG
      const rotor = this.shadowRoot.querySelector('#rotor');
      if (rotor) {
        // Converte radianos para graus
        const degrees = (this.currentRotation * 180 / Math.PI);
        rotor.setAttribute('transform', `rotate(${degrees} 100 100)`);
      }
      
      // Continua a animação
      this.rafId = requestAnimationFrame(animate);
    };
    
    // Inicia o loop de animação
    this.rafId = requestAnimationFrame(animate);
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
    
    // Estrutura do card com SVG para garantir simetria
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
              
              <!-- Grupo rotativo - transformação aplicada via JavaScript para animação contínua -->
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
          <div class="version">v8.0</div>
        </div>
      </ha-card>
    `;
  }
  
  disconnectedCallback() {
    // Limpar o loop de animação quando o elemento for removido
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
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
