// src/utils/MetaStatsAdapter.js

/**
 * Convierte los datos de la API de MetaStats al formato esperado por los componentes UI
 * 
 * @param {Object} metricsData - Datos crudos de la API de MetaStats
 * @param {Object} brokerAccount - Información de la cuenta del broker
 * @param {number} initialBalance - Balance inicial de la cuenta
 * @returns {Object} Datos formateados para los componentes UI
 */
export const convertMetaStatsToMetadata = (metricsData, brokerAccount, initialBalance) => {
    if (!metricsData) return null;
  
    // Establecer un balance inicial por defecto si no se proporciona
    const baseBalance = initialBalance || metricsData.deposits || 10000;
  
    // Crear el objeto de datos convertido con mapeos adecuados y valores por defecto
    const convertedData = {
      // Métricas básicas
      trades: metricsData.trades || 0,
      balance: metricsData.balance || baseBalance,
      equity: metricsData.equity || baseBalance,
      profit: metricsData.profit || 0,
      
      // Métricas de rendimiento de trading
      wonTrades: metricsData.wonTrades || 0,
      lostTrades: metricsData.lostTrades || 0,
      wonTradesPercent: metricsData.wonTradesPercent || 0,
      lostTradesPercent: metricsData.lostTradesPercent || 0,
      
      // Métricas de ganancias/pérdidas
      averageWin: metricsData.averageWin || 0,
      averageLoss: metricsData.averageLoss || 0,
      averageWinPips: metricsData.averageWinPips || 0,
      averageLossPips: metricsData.averageLossPips || 0,
      
      // Métricas de mejores/peores trades
      bestTrade: metricsData.bestTrade || 0,
      worstTrade: metricsData.worstTrade || 0,
      bestTradePips: metricsData.bestTradePips || 0,
      worstTradePips: metricsData.worstTradePips || 0,
      
      // Métricas direccionales
      longTrades: metricsData.longTrades || 0,
      shortTrades: metricsData.shortTrades || 0,
      longWonTrades: metricsData.longWonTrades || 0,
      shortWonTrades: metricsData.shortWonTrades || 0,
      longWonTradesPercent: metricsData.longWonTradesPercent || 0,
      shortWonTradesPercent: metricsData.shortWonTradesPercent || 0,
      
      // Métricas de riesgo
      maxDrawdown: metricsData.maxDrawdown || 0,
      maxDrawdownPercent: (metricsData.maxDrawdownPercent || metricsData.maxDrawdown / baseBalance * 100) || 0,
      
      // Métricas de rendimiento
      profitFactor: metricsData.profitFactor || 0,
      expectancy: metricsData.expectancy || 0,
      expectancyPips: metricsData.expectancyPips || 0,
      cagr: metricsData.cagr || 0,
      
      // Datos para gráficos
      dailyGrowth: metricsData.dailyGrowth || [],
      equityChart: metricsData.equityChart || [],
      
      // Datos de la cuenta
      broker_account: brokerAccount || {},
      initialBalance: baseBalance,
      deposits: metricsData.deposits || baseBalance,
      
      // Métricas de tiempo
      daysSinceTradingStarted: metricsData.daysSinceTradingStarted || 0,
      averageTradeLengthInMilliseconds: metricsData.averageTradeLengthInMilliseconds || 0,
      
      // Volumen de trading
      lots: metricsData.lots || 0,
      pips: metricsData.pips || 0,
      
      // Incluir currencySummary con mapeo adecuado
      currencySummary: Array.isArray(metricsData.currencySummary) 
        ? metricsData.currencySummary.map(currency => ({
            currency: currency.currency || "Desconocido",
            total: {
              trades: currency.total?.trades || 0,
              profit: currency.total?.profit || 0,
              pips: currency.total?.pips || 0,
              wonTrades: currency.total?.wonTrades || 0,
              wonTradesPercent: currency.total?.wonTradesPercent || 0,
              lostTrades: currency.total?.lostTrades || 0,
              lostTradesPercent: currency.total?.lostTradesPercent || 0
            },
            long: currency.long || { trades: 0, profit: 0, pips: 0 },
            short: currency.short || { trades: 0, profit: 0, pips: 0 },
            history: currency.history || []
          }))
        : []
    };
  
    return convertedData;
  };
  
  /**
   * Determina la configuración de stage correcta basada en la fase y stages disponibles
   * 
   * @param {number|string} currentPhase - Fase actual del challenge
   * @param {Array} stages - Stages disponibles del challenge
   * @returns {Object} Configuración del stage seleccionado
   */
  export const determineCorrectStage = (currentPhase, stages) => {
    // Convertir fase a número
    const phaseNum = parseInt(currentPhase, 10);
    
    // Validar entradas
    if (isNaN(phaseNum)) {
      console.error('Número de fase inválido:', currentPhase);
      return getDefaultStage();
    }
    
    // Verificar si el array de stages es válido
    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      console.warn('No hay stages disponibles o formato inválido');
      return getDefaultStage();
    }
  
    const totalStages = stages.length;
    let stageIndex;
  
    // Aplicar lógica especial para 2 o 3 stages
    if (totalStages === 2 || totalStages === 3) {
      if (phaseNum === 2 || phaseNum === 3) {
        stageIndex = 0;
      } else {
        stageIndex = Math.min(phaseNum - 1, totalStages - 1);
      }
    } else {
      stageIndex = Math.min(phaseNum - 1, totalStages - 1);
    }
  
    // Validar índice de stage
    if (stageIndex < 0 || stageIndex >= totalStages) {
      console.warn(`Índice de stage (${stageIndex}) fuera de rango`);
      stageIndex = 0;
    }
  
    const selectedStage = stages[stageIndex];
    
    // Retornar stage por defecto si el stage seleccionado es inválido
    if (!selectedStage) {
      console.error(`No se pudo seleccionar un stage válido en el índice ${stageIndex}`);
      return getDefaultStage();
    }
  
    return selectedStage;
  };
  
  /**
   * Crea una configuración de stage por defecto
   * 
   * @returns {Object} Configuración de stage por defecto
   */
  function getDefaultStage() {
    return {
      name: "Stage por Defecto",
      description: "Stage creado por defecto debido a datos faltantes",
      targets: {
        profit_target: 8,
        max_daily_loss: 5,
        max_loss: 10,
        minimum_trading_days: 0
      }
    };
  }