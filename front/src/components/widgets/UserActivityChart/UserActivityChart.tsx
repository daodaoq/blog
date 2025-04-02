import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import type { UserChartResponse } from '@/api/user';
import './UserActivityChart.css'; // 引入 CSS 文件

// 注册 ECharts 组件
echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
]);

interface UserChartProps {
  chart: UserChartResponse;
}

const UserChart: React.FC<UserChartProps> = ({ chart }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      // 初始化 ECharts 实例
      const myChart = echarts.init(chartRef.current);

      // 配置项
      const option = {
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['登录', '注册'],
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: chart.date_list,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '登录',
            type: 'line',
            data: chart.login_data,
          },
          {
            name: '注册',
            type: 'line',
            data: chart.register_data,
          },
        ],
      };

      // 设置图表配置
      myChart.setOption(option);

      // 组件卸载时销毁图表实例
      return () => {
        myChart.dispose();
      };
    }
  }, [chart]);

  return <div id="chart" ref={chartRef} className="chart-container" />;
};

export default UserChart;