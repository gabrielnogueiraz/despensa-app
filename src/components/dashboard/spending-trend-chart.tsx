'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/formatters';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface SpendingTrendChartProps {
  data: { month: string; amount: number }[];
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  const option = useMemo(() => {
    const months = data.map((d) => d.month);
    const values = data.map((d) => d.amount);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1C1917',
        borderColor: '#1C1917',
        textStyle: { color: '#FAF8F5', fontSize: 12, fontWeight: 'bold' },
        formatter: (params: any[]) => {
          const item = params[0];
          return `<div style="padding: 2px 4px;">
            <div style="font-size: 11px; color: #A8A29E; margin-bottom: 2px;">${item.name}</div>
            <div style="font-size: 14px; font-weight: 800; color: #FAF8F5;">${formatCurrency(Number(item.value))}</div>
          </div>`;
        },
      },
      grid: {
        top: '15%',
        left: '2%',
        right: '4%',
        bottom: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#716D66',
          fontSize: 11,
          fontWeight: 600,
        },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: '#F0ECE4',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#A8A29A',
          fontSize: 10,
          formatter: (value: number) => `R$ ${value}`,
        },
      },
      series: [
        {
          name: 'Total Gasto',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: values,
          itemStyle: {
            color: '#D9532F',
            borderWidth: 2,
            borderColor: '#FFFFFF',
          },
          lineStyle: {
            width: 3.5,
            color: '#D9532F',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(217, 83, 47, 0.28)' },
                { offset: 1, color: 'rgba(217, 83, 47, 0.01)' },
              ],
            },
          },
        },
      ],
    };
  }, [data]);

  return (
    <div className="w-full h-64">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
