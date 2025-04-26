// Type definitions for Recharts components to fix TypeScript errors
import React from 'react';

// Declare module for Recharts to add proper JSX IntrinsicElements
declare module 'recharts' {
  // Extend the JSX namespace to include Recharts components
  export interface AreaProps {
    dataKey: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    [key: string]: any;
  }

  export interface BarProps {
    dataKey: string;
    fill?: string;
    radius?: number | [number, number, number, number];
    [key: string]: any;
  }

  export interface XAxisProps {
    dataKey?: string;
    tick?: object;
    axisLine?: object;
    tickFormatter?: (value: any) => string;
    [key: string]: any;
  }

  export interface YAxisProps {
    tick?: object;
    axisLine?: object;
    tickMargin?: number;
    label?: object;
    [key: string]: any;
  }

  export interface TooltipProps {
    formatter?: (value: any, name?: string, props?: any) => any;
    contentStyle?: object;
    [key: string]: any;
  }

  export interface CartesianGridProps {
    strokeDasharray?: string;
    vertical?: boolean;
    stroke?: string;
    [key: string]: any;
  }

  export interface CellProps {
    key?: string;
    fill?: string;
    [key: string]: any;
  }

  export class Area extends React.Component<AreaProps> {}
  export class Bar extends React.Component<BarProps> {}
  export class XAxis extends React.Component<XAxisProps> {}
  export class YAxis extends React.Component<YAxisProps> {}
  export class Tooltip extends React.Component<TooltipProps> {}
  export class CartesianGrid extends React.Component<CartesianGridProps> {}
  export class Cell extends React.Component<CellProps> {}
} 