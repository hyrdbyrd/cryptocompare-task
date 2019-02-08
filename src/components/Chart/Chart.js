import React from 'react';
import PropTypes from 'prop-types';

import algo from 'react-stockcharts/lib/algorithm';

import { format } from 'd3-format';

import { cn } from '@bem-react/classname';

import { ChartCanvas, Chart } from 'react-stockcharts';
import { BarSeries, CandlestickSeries } from 'react-stockcharts/lib/series';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
import { CrossHairCursor, MouseCoordinateY, EdgeIndicator } from 'react-stockcharts/lib/coordinates';

import { timeFormat } from 'd3-time-format';

import { ToolTipText } from 'react-stockcharts/lib/tooltip';

import { ema } from 'react-stockcharts/lib/indicator';
import { discontinuousTimeScaleProvider } from 'react-stockcharts/lib/scale';

import { Annotate, SvgPathAnnotation } from 'react-stockcharts/lib/annotation';
import { fitWidth } from 'react-stockcharts/lib/helper';
import { last } from 'react-stockcharts/lib/utils';

import './Chart.css';

class ChartComponent extends React.Component {
    render() {
        const green = 'rgb(39, 163, 108)';
        const red = 'rgb(203, 64, 97)';
        const gray = 'rgb(176, 189, 206)';
        const blue = 'rgb(35, 171, 221)';

        const { type, data: initialData, width, ratio } = this.props;

        let min = initialData[0];
        let max = initialData[0];

        initialData.forEach((d) => {
            if (d.close > max.close) {
                max = d;
            }

            if (d.close < min.close) {
                min = d;
            }
        });

        const ema1 = ema()
            .id(0)
            .options({ windowSize: 1 })
            .merge((d, c) => { d.ema1 = c; })
            .accessor(d => d.ema1);

        const ema2 = ema()
            .id(2)
            .options({ windowSize: 2 })
            .merge((d, c) => { d.ema2 = c; })
            .accessor(d => d.ema2);

        const grads = algo()
            .windowSize(2)
            .accumulator(([prev, now]) => {
                const { ema1: prevShortTerm, ema2: prevLongTerm } = prev;
                const { ema1: nowShortTerm, ema2: nowLongTerm } = now;
                if (prevShortTerm < prevLongTerm && nowShortTerm > nowLongTerm) return 'LONG';
                if (prevShortTerm > prevLongTerm && nowShortTerm < nowLongTerm) return 'SHORT';
            })
            .merge((d, c) => { d.longShort = c; });

        const defaultAnnotationProps = {
            onClick: console.log.bind(console),
        };

        const longAnnotationProps = {
            ...defaultAnnotationProps,
            fill: green,
            className: 'ToLong',
            tooltip: 'Close long',
            y: ({ yScale, datum }) => yScale(datum.low),
            path: ({ x, y }) => `M ${x} ${y} ${5 + x} ${10 + y} ${x - 5} ${10 + y} Z`
        };

        const shortAnnotationProps = {
            ...defaultAnnotationProps,
            fill: red,
            className: 'ToShort',
            tooltip: 'Close short',
            y: ({ yScale, datum }) => yScale(datum.high),
            path: ({ x, y }) => `M ${5 + x} ${y} ${x - 5} ${y} ${x} ${y + 10} Z`
        };

        const calculatedData = grads(ema1(ema2(initialData)));

        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(d => d.date);
        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        const start = xAccessor(last(data));
        const end = xAccessor(data[Math.max(0, data.length - 150)]);
        const xExtents = [start, end];

        const cnCandle = cn('Candle');
        const cnRightBar = cn('RightBar');
        const cnBottomBar = cn('BottomBar');

        return (
            <ChartCanvas
                width={width}
                height={window.innerHeight - 100}
                margin={{ left: 10, right: 70, top: 70, bottom: 70 }}
                seriesName='BTC/USD'
                ratio={ratio}
                type={type}
                data={data}
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                xExtents={xExtents}
                className='Chart'
            >
                <Chart
                    id={5}
                    height={150}
                    yExtents={d => d.volume}
                    origin={(w, h) => [0, h - 150]}
                    timeFormat={timeFormat('%d %m')}
                >
                    <BarSeries yAccessor={d => d.volume} fill={gray} stroke={false} />
                </Chart>
                <Chart id={6} yExtents={[d => [d.high, d.low]]}>
                    <YAxis axisAt='right' orient='right' ticks={10} className={cnRightBar()} />
                    <XAxis axisAt='bottom' orient='bottom' ticks={2} className={cnBottomBar()} />

                    <MouseCoordinateY
                        at='right'
                        orient='right'
                        displayFormat={format('.2f')}
                        fill={blue}
                        rectWidth={70}
                        strokeOpacity={1}
                        opacity={1}
                    />

                    <CandlestickSeries
                        className={cnCandle()}
                        wickClassName={cnCandle('Wick')}
                        stroke={() => 'rgba(0, 0, 0, 0)'}
                        strokeWidth={10}
                        fill={d => (d.close > d.open ? green : red)}
                        wickStroke={d => (d.close > d.open ? green : red)}
                    />

                    <EdgeIndicator
                        itemType='first'
                        orient='right'
                        edgeAt='right'
                        yAccessor={() => Math.min(min.close, min.open)}
                        lineStroke={red}
                        lineOpacity={1}
                        fill={red}
                        rectWidth={70}
                    />

                    <EdgeIndicator
                        itemType='first'
                        orient='right'
                        edgeAt='right'
                        yAccessor={() => Math.max(max.close, max.open)}
                        lineStroke={green}
                        lineOpacity={1}
                        fill={green}
                        rectWidth={70}
                    />

                    <Annotate
                        with={SvgPathAnnotation}
                        when={d => d.longShort === 'LONG'}
                        usingProps={longAnnotationProps}
                    />

                    <Annotate
                        with={SvgPathAnnotation}
                        when={d => d.longShort === 'SHORT'}
                        usingProps={shortAnnotationProps}
                    />

                    <ToolTipText
                        fontFamily='Arial'
                        fontSize={20}
                        children='BTC/USD'
                    />
                </Chart>
                <CrossHairCursor opacity={1} stroke={blue} />
            </ChartCanvas>
        );
    }
}

ChartComponent.propTypes = {
    data: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired,
    ratio: PropTypes.number.isRequired,
    type: PropTypes.oneOf(['svg', 'hybrid']).isRequired
};

ChartComponent.defaultProps = {
    type: 'svg'
};

export default fitWidth(ChartComponent);
