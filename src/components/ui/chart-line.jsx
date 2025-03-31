'use client'
import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export function LineChart({ data, index, categories, yFormatter }) {
  const [isClient, setIsClient] = useState(false)
  const [theme, setTheme] = useState('dark')

  // Cargar el tema inicial y configurar el plugin de zoom
  useEffect(() => {
    setIsClient(true)
    
    const storedTheme = localStorage.getItem('theme') || 'dark'
    setTheme(storedTheme)

    const registerZoomPlugin = async () => {
      const zoomPlugin = (await import('chartjs-plugin-zoom')).default
      ChartJS.register(zoomPlugin)
    }
    registerZoomPlugin()
  }, [])

  // Escuchar cambios en localStorage en tiempo real
  useEffect(() => {
    const checkTheme = () => {
      const storedTheme = localStorage.getItem('theme') || 'dark'
      if (storedTheme !== theme) {
        setTheme(storedTheme)
      }
    }

    // Escuchar cambios entre pestañas
    const handleStorageChange = (event) => {
      if (event.key === 'theme') {
        setTheme(event.newValue || 'dark')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Intervalo para cambios en la misma pestaña
    const intervalId = setInterval(checkTheme, 500) // Revisar cada 500ms

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(intervalId)
    }
  }, [theme]) // Dependencia en theme para reaccionar a cambios

  // Colores fijos para cada categoría
  const lineStyles = {
    balance: {
      color: '#FBBF24', // Amber 400
      dash: [],
      pointRadius: 2,
      pointHoverRadius: 6,
    },
    max_drawdown: {
      color: '#F87171', // Rojo
      dash: [5, 5],
      pointRadius: 0,
      pointHoverRadius: 0,
    },
    profit_target: {
      color: '#10B981', // Verde
      dash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
    },
  }

  const findReferenceValue = (category) => {
    for (let i = 0; i < data.length; i++) {
      const value = data[i][category]
      if (value !== null && value !== undefined) return value
    }
    return null
  }

  const maxDrawdownValue = findReferenceValue('max_drawdown')
  const profitTargetValue = findReferenceValue('profit_target')

  const chartData = {
    labels: data.map((item) => item[index]),
    datasets: categories.map((cat) => {
      const style = lineStyles[cat] || { color: theme === 'dark' ? '#FFF' : '#000', dash: [], pointRadius: 0, pointHoverRadius: 0 }
      let categoryData
      
      if (cat === 'max_drawdown' && maxDrawdownValue !== null) {
        categoryData = new Array(data.length).fill(maxDrawdownValue)
      } else if (cat === 'profit_target' && profitTargetValue !== null) {
        categoryData = new Array(data.length).fill(profitTargetValue)
      } else {
        categoryData = data.map((item) => item[cat])
      }
      
      return {
        label: cat,
        data: categoryData,
        borderColor: style.color,
        backgroundColor: 'transparent',
        borderDash: style.dash,
        borderWidth: 2,
        pointRadius: style.pointRadius,
        pointHoverRadius: style.pointHoverRadius,
        spanGaps: true,
        ...(cat === 'max_drawdown' || cat === 'profit_target' ? {
          fill: false,
          tension: 0,
        } : {})
      }
    }),
  }

  let allValues = []
  data.forEach((row) => {
    categories.forEach((cat) => {
      const val = row[cat]
      if (typeof val === 'number') allValues.push(val)
    })
  })
  if (maxDrawdownValue !== null) allValues.push(maxDrawdownValue)
  if (profitTargetValue !== null) allValues.push(profitTargetValue)
  if (allValues.length === 0) allValues = [0, 100]
  
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const paddingFactor = 0.05
  const range = maxVal - minVal
  const suggestedMin = minVal - range * paddingFactor
  const suggestedMax = maxVal + range * paddingFactor

  // Estilos por tema
  const themeStyles = {
    dark: {
      backgroundColor: '#18181B',
      textColor: '#FFF',
      gridColor: 'rgba(255, 255, 255, 0.2)',
      tooltip: {
        backgroundColor: '#333',
        titleColor: '#FFF',
        bodyColor: '#FFF',
        borderColor: '#FFF',
      },
    },
    light: {
      backgroundColor: '#FFFFFF',
      textColor: '#000',
      gridColor: 'rgba(0, 0, 0, 0.1)',
      tooltip: {
        backgroundColor: '#FFF',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: '#000',
      },
    },
  }

  const currentTheme = themeStyles[theme] || themeStyles.dark

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 5,
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: currentTheme.tooltip.backgroundColor,
        titleColor: currentTheme.tooltip.titleColor,
        bodyColor: currentTheme.tooltip.bodyColor,
        borderColor: currentTheme.tooltip.borderColor,
        borderWidth: 1,
      },
      ...(isClient && {
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
          },
          pan: {
            enabled: true,
            mode: 'x',
          },
          limits: {
            x: {
              min: 'original',
              max: 'original',
              minRange: 2,
            },
          },
        }
      }),
    },
    scales: {
      x: {
        ticks: {
          display: false,
        },
      },
      y: {
        suggestedMin,
        suggestedMax,
        grid: {
          color: currentTheme.gridColor,
        },
        ticks: {
          color: currentTheme.textColor,
          callback: (value) => yFormatter(value),
        },
      },
    },
  }

  return (
    <div style={{ backgroundColor: currentTheme.backgroundColor, padding: '1rem', borderRadius: '8px' }}>
      <div style={{ width: '100%', height: '60vh' }}>
        <Line data={chartData} options={options} />
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
        <ul
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
          }}
        >
          {categories.map((cat) => {
            const style = lineStyles[cat] || { color: currentTheme.textColor, dash: [], pointRadius: 0 }
            const borderStyle = style.dash.length
              ? `2px dashed ${style.color}`
              : `2px solid ${style.color}`

            return (
              <li key={cat} style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '30px',
                    height: '0',
                    borderBottom: borderStyle,
                    marginRight: '8px',
                  }}
                />
                <span style={{ color: currentTheme.textColor, textTransform: 'capitalize' }}>
                  {cat.replace(/_/g, ' ')}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}