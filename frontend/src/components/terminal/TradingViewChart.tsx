import React, { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  UTCTimestamp,
  CandlestickData,
  HistogramData,
} from 'lightweight-charts';
import { Candle, Timeframe } from '../../types';

interface TradingViewChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: Timeframe;
  showEma20?: boolean;
  showEma50?: boolean;
  showEma200?: boolean;
  showVolume?: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  candles,
  symbol,
  timeframe,
  showEma20 = true,
  showEma50 = true,
  showEma200 = true,
  showVolume = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Active hover candle info
  const [hoverInfo, setHoverInfo] = React.useState<Candle | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance strictly with Light Theme tokens
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#0F172A',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#F1F5F9' },
        horzLines: { color: '#F1F5F9' },
      },
      crosshair: {
        vertLine: {
          color: '#94A3B8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2563EB',
        },
        horzLine: {
          color: '#94A3B8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2563EB',
        },
      },
      rightPriceScale: {
        borderColor: '#E2E8F0',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#E2E8F0',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Candlestick series: Green #16A34A, Red #DC2626
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#16A34A',
      downColor: '#DC2626',
      borderUpColor: '#16A34A',
      borderDownColor: '#DC2626',
      wickUpColor: '#16A34A',
      wickDownColor: '#DC2626',
    });

    // Volume Series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // overlay
    });
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    // EMAs: 20 Blue (#2563EB), 50 Amber (#D97706), 200 Purple (#8B5CF6)
    const ema20Series = chart.addLineSeries({
      color: '#2563EB',
      lineWidth: 2,
      title: 'EMA 20',
      priceScaleId: 'right',
    });

    const ema50Series = chart.addLineSeries({
      color: '#D97706',
      lineWidth: 2,
      title: 'EMA 50',
      priceScaleId: 'right',
    });

    const ema200Series = chart.addLineSeries({
      color: '#7C3AED',
      lineWidth: 2,
      title: 'EMA 200',
      priceScaleId: 'right',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;
    ema200SeriesRef.current = ema200Series;

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoverInfo(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as CandlestickData;
      if (data) {
        setHoverInfo({
          time: Number(param.time),
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: 0,
        });
      }
    });

    // Handle Resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Update Data & Indicators
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    // Format candle data
    const formattedCandles: CandlestickData[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(formattedCandles);

    // Format volume data
    if (volumeSeriesRef.current) {
      if (showVolume) {
        const volumeData: HistogramData[] = candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)',
        }));
        volumeSeriesRef.current.setData(volumeData);
      } else {
        volumeSeriesRef.current.setData([]);
      }
    }

    // Calculate and apply EMAs
    const calcEma = (period: number) => {
      const k = 2 / (period + 1);
      let ema = candles[0].close;
      return candles.map((c, idx) => {
        if (idx === 0) {
          ema = c.close;
        } else {
          ema = c.close * k + ema * (1 - k);
        }
        return {
          time: c.time as UTCTimestamp,
          value: +ema.toFixed(2),
        };
      });
    };

    if (ema20SeriesRef.current) {
      if (showEma20 && candles.length >= 20) {
        ema20SeriesRef.current.setData(calcEma(20));
      } else {
        ema20SeriesRef.current.setData([]);
      }
    }

    if (ema50SeriesRef.current) {
      if (showEma50 && candles.length >= 50) {
        ema50SeriesRef.current.setData(calcEma(50));
      } else {
        ema50SeriesRef.current.setData([]);
      }
    }

    if (ema200SeriesRef.current) {
      if (showEma200 && candles.length >= 20) {
        // Fallback to period length if less candles available for display
        const p = Math.min(200, candles.length);
        ema200SeriesRef.current.setData(calcEma(p));
      } else {
        ema200SeriesRef.current.setData([]);
      }
    }

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles, showEma20, showEma50, showEma200, showVolume]);

  const activeCandle = hoverInfo || (candles.length > 0 ? candles[candles.length - 1] : null);

  return (
    <div className="flex flex-col h-full bg-white border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Top Chart Header / Bar with OHLC readouts */}
      <div className="px-4 py-2.5 border-b border-border bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-text-primary text-sm">{symbol}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-text-secondary uppercase">
            {timeframe}
          </span>
          <span className="text-2xs text-text-secondary">Lightweight Charts™ v4</span>
        </div>

        {/* OHLCV Readout */}
        {activeCandle && (
          <div className="flex items-center space-x-3 font-mono text-xs">
            <span>
              O: <strong className="text-text-primary">{activeCandle.open.toFixed(2)}</strong>
            </span>
            <span>
              H: <strong className="text-bull">{activeCandle.high.toFixed(2)}</strong>
            </span>
            <span>
              L: <strong className="text-bear">{activeCandle.low.toFixed(2)}</strong>
            </span>
            <span>
              C:{' '}
              <strong
                className={
                  activeCandle.close >= activeCandle.open ? 'text-bull' : 'text-bear'
                }
              >
                {activeCandle.close.toFixed(2)}
              </strong>
            </span>
            {activeCandle.volume > 0 && (
              <span className="text-text-secondary">
                Vol: <strong>{activeCandle.volume.toLocaleString()}</strong>
              </span>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="hidden xl:flex items-center space-x-3 text-2xs">
          {showEma20 && (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              <span className="font-medium text-text-secondary">EMA 20</span>
            </span>
          )}
          {showEma50 && (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
              <span className="font-medium text-text-secondary">EMA 50</span>
            </span>
          )}
          {showEma200 && (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
              <span className="font-medium text-text-secondary">EMA 200</span>
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative flex-1 w-full min-h-[420px]">
        <div ref={chartContainerRef} className="tradingview-chart-container" />
      </div>
    </div>
  );
};
