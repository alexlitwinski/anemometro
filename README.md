# Anemômetro Card para Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

Um card personalizado para o Home Assistant que mostra um anemômetro que gira de acordo com a velocidade do vento medida por um sensor.

![Exemplo do Anemômetro Card](images/exemplo.png)

## Instalação

### HACS (recomendado)
1. Certifique-se de ter o [HACS](https://hacs.xyz/) instalado
2. Adicione este repositório como um repositório personalizado no HACS:
   - URL: `https://github.com/SEU_USUARIO/anemometro-card`
   - Categoria: `Lovelace`
3. Pesquise por "Anemômetro Card" nas integrações do HACS
4. Instale o card
5. Reinicie o Home Assistant

### Instalação Manual
1. Baixe o arquivo `anemometro-card.js`
2. Copie para `/www/community/anemometro-card/` no seu servidor Home Assistant
3. Adicione o seguinte ao seu `configuration.yaml`:
```yaml
lovelace:
  resources:
    - url: /local/community/anemometro-card/anemometro-card.js
      type: module
```
4. Reinicie o Home Assistant

## Uso

Adicione o card ao seu painel do Lovelace:

```yaml
type: custom:anemometro-card
entity: sensor.velocidade_do_vento_em_kmh
name: Velocidade do Vento  # Opcional - substitui o nome amigável da entidade
unit_of_measurement: km/h  # Opcional - substitui a unidade da entidade
```

### Opções de configuração

| Opção | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `entity` | string | **Obrigatório** | Entidade que mede a velocidade do vento |
| `name` | string | Nome da entidade | Nome a ser exibido no card |
| `unit_of_measurement` | string | Unidade da entidade | Unidade de medida a ser exibida |

## Personalização

O componente foi projetado para adaptar automaticamente a velocidade de rotação com base na velocidade do vento, mas você pode ajustar o comportamento editando o arquivo JavaScript:

- Modifique os valores `minVelocidade` e `maxVelocidade` para ajustar o intervalo de velocidade
- Ajuste `minRotacao` e `maxRotacao` para controlar a velocidade de rotação mínima e máxima

## Resolução de problemas

Se o card não estiver funcionando corretamente:

1. Verifique se a entidade especificada existe e está funcionando
2. Certifique-se de que o valor da entidade é numérico
3. Limpe o cache do navegador

## Desenvolvimento

### Requisitos
- [Node.js](https://nodejs.org)
- [yarn](https://yarnpkg.com)

### Scripts
```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/anemometro-card

# Entre na pasta
cd anemometro-card

# Instale as dependências
yarn install

# Construa o projeto
yarn build
```

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
