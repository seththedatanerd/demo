'use client'

import { AskResponse as AskResponseType, TableData, ChartData, MetricData } from '@/services/ask-engine'
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Table, MessageSquare, Lightbulb } from 'lucide-react'

interface AskResponseProps {
  response: AskResponseType
  onSuggestionClick?: (suggestion: string) => void
}

export default function AskResponse({ response, onSuggestionClick }: AskResponseProps) {
  const getTypeIcon = () => {
    switch (response.type) {
      case 'chart': return <BarChart3 className="w-4 h-4" />
      case 'table': return <Table className="w-4 h-4" />
      case 'metric': return <TrendingUp className="w-4 h-4" />
      case 'insight': return <Lightbulb className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeColor = () => {
    switch (response.type) {
      case 'chart': return 'text-blue-600 bg-blue-50'
      case 'table': return 'text-green-600 bg-green-50'
      case 'metric': return 'text-purple-600 bg-purple-50'
      case 'insight': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">{response.question}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Confidence: {Math.round(response.confidence * 100)}%</span>
              <span>{new Date(response.timestamp).toLocaleTimeString()}</span>
              {response.sources && (
                <span>Sources: {response.sources.join(', ')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Text */}
      <div className="text-gray-700 text-sm leading-relaxed">
        {response.answer}
      </div>

      {/* Data Visualization */}
      {response.data && (
        <div className="mt-4">
          {response.type === 'table' && <TableVisualization data={response.data} />}
          {response.type === 'chart' && <ChartVisualization data={response.data} />}
          {response.type === 'metric' && <MetricVisualization data={response.data} />}
        </div>
      )}

      {/* Follow-up Suggestions */}
      {response.suggestions && response.suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">You might also want to ask:</p>
          <div className="flex flex-wrap gap-2">
            {response.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TableVisualization({ data }: { data: TableData }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {data.title && (
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 text-sm">{data.title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {data.headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left font-medium text-gray-900 border-b border-gray-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 text-gray-700 border-b border-gray-100">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChartVisualization({ data }: { data: ChartData }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {data.title && (
        <h4 className="font-medium text-gray-900 text-sm mb-4">{data.title}</h4>
      )}
      
      {/* Simple chart representation - in a real app, use Chart.js or similar */}
      {data.type === 'bar' && <BarChartSimple data={data} />}
      {data.type === 'doughnut' && <DoughnutChartSimple data={data} />}
      {data.type === 'line' && <LineChartSimple data={data} />}
    </div>
  )
}

function BarChartSimple({ data }: { data: ChartData }) {
  const maxValue = Math.max(...data.datasets[0].data)
  
  return (
    <div className="space-y-3">
      {data.labels.map((label, index) => {
        const value = data.datasets[0].data[index]
        const percentage = (value / maxValue) * 100
        const color = Array.isArray(data.datasets[0].backgroundColor) 
          ? data.datasets[0].backgroundColor[index] 
          : data.datasets[0].backgroundColor || '#3B82F6'
        
        return (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-16 text-sm text-gray-600">{label}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
              <div 
                className="h-full rounded-full flex items-center justify-end pr-2"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: color 
                }}
              >
                <span className="text-white text-xs font-medium">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DoughnutChartSimple({ data }: { data: ChartData }) {
  const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0)
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Simple pie representation */}
      <div className="space-y-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index]
          const percentage = ((value / total) * 100).toFixed(1)
          const color = Array.isArray(data.datasets[0].backgroundColor) 
            ? data.datasets[0].backgroundColor[index] 
            : '#3B82F6'
          
          return (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-700">{label}</span>
              <span className="text-gray-500">({percentage}%)</span>
            </div>
          )
        })}
      </div>
      
      {/* Values */}
      <div className="space-y-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index]
          
          return (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">{label}:</span>
              <span className="font-medium text-gray-900">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LineChartSimple({ data }: { data: ChartData }) {
  // Simple line chart representation
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end h-32 space-x-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index]
          const maxValue = Math.max(...data.datasets[0].data)
          const height = (value / maxValue) * 100
          
          return (
            <div key={index} className="flex flex-col items-center space-y-2 flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t-sm"
                style={{ height: `${height}%` }}
              />
              <div className="text-xs text-gray-600 text-center">{label}</div>
              <div className="text-xs font-medium text-gray-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MetricVisualization({ data }: { data: MetricData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((metric, index) => (
        <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">{metric.label}</h4>
            {metric.trend && (
              <div className={`flex items-center space-x-1 ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {metric.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                {metric.trend === 'stable' && <Minus className="w-4 h-4" />}
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {metric.value}
          </div>
          {metric.change && (
            <div className={`text-sm font-medium ${
              metric.trend === 'up' ? 'text-green-600' : 
              metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.change} {metric.subtitle}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
