'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { formatCurrency } from '@/lib/formatters';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface CategoryDonutChartProps {
  data: { name: string; value: number; color: string }[];
  totalSpent: number;
}

export function CategoryDonutChart({ data, totalSpent }: CategoryDonutChartProps) {
  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1C1917',
        borderColor: '#1C1917',
        textStyle: { color: '#FAF8F5', fontSize: 12 },
        formatter: (params: any) => {
          const percent = totalSpent > 0 ? ((params.value / totalSpent) * 100).toFixed(1) : 0;
          return `<div style="padding: 2px 4px;">
            <div style="font-size: 11px; color: #A8A29E; margin-bottom: 2px;">${params.name}</div>
            <div style="font-size: 13px; font-weight: 800; color: #FAF8F5;">${formatCurrency(params.value)} (${percent}%)</div>
          </div>`;
        },
      },
      legend: {
        orient: 'horizontal',
        bottom: '0%',
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          color: '#716D66',
          fontSize: 11,
          fontWeight: 500,
        },
      },
      series: [
        {
          name: 'Categorias',
          type: 'pie',
          radius: ['52%', '76%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: {
              show: false,
            },
          },
          data: data.map((d) => ({
            name: d.name,
            value: d.value,
            itemStyle: { color: d.color },
          })),
        },
      ],
    };
  }, [data, totalSpent]);

  return (
    <div className="relative w-full h-72">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
      {/* Centro do Donut com Total */}
      <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#716D66] block">
          Total Mês
        </span>
        <span className="text-base font-extrabold text-[#1C1917] tabular-nums block mt-0.5">
          {formatCurrency(totalSpent)}
        </span>
      </div>
    </div>
  );
}
