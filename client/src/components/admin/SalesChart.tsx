import React, { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/ui/theme-provider';

interface SalesChartProps {
  chartType: 'line' | 'bar';
}

const SalesChart: React.FC<SalesChartProps> = ({ chartType }) => {
  const [data, setData] = useState<any[]>([]);

  // Fetch top products data for bar chart
  const { data: topProducts } = useQuery({
    queryKey: ['/api/admin/dashboard/top-products'],
    enabled: chartType === 'bar',
    suspense: false
  });

  useEffect(() => {
    if (chartType === 'line') {
      // Generate last 6 months of sales data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      const lastSixMonths = Array(6)
        .fill(0)
        .map((_, index) => {
          const monthIndex = (currentMonth - 5 + index + 12) % 12;
          return months[monthIndex];
        });
      
      const salesData = lastSixMonths.map(month => {
        const sales = Math.floor(Math.random() * 250000) + 150000;
        const orders = Math.floor(sales / 5000);
        
        return {
          month,
          sales,
          orders
        };
      });
      
      setData(salesData);
    } else if (chartType === 'bar' && topProducts) {
      // Use real product data from API
      const productData = topProducts.map((product: any) => ({
        name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
        sales: product.sales,
        revenue: product.price * product.sales
      }));
      
      setData(productData);
    }
  }, [chartType, topProducts]);

  // Format Indian Rupees
  const formatRupees = (value: number) => {
    return `₹${(value / 100).toLocaleString('en-IN')}`;
  };

  // Render appropriate chart based on type
  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(222.2, 47.4%, 11.2%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(222.2, 47.4%, 11.2%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(value) => formatRupees(value)}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <Tooltip 
              formatter={(value: number) => formatRupees(value)}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{ borderRadius: '6px', border: '1px solid #e0e0e0' }}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="hsl(222.2, 47.4%, 11.2%)" 
              fillOpacity={1} 
              fill="url(#colorSales)" 
              name="Sales"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={false}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return formatRupees(value);
                return value;
              }}
              contentStyle={{ borderRadius: '6px', border: '1px solid #e0e0e0' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar 
              dataKey="sales" 
              name="Units Sold" 
              fill="hsl(222.2, 47.4%, 11.2%)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return renderChart();
};

export default SalesChart;
