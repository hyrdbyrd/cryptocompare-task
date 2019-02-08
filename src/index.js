import React from 'react';
import { render } from 'react-dom';

import { parseData } from './utils';

import Chart from './components/Chart/Chart';

import data from './data.json';

import { unregister, register } from './serviceWorker';

import './index.css';

function ChartComponent({data}) {
    return <Chart data={data} />;
}

render(
    <ChartComponent data={parseData(data.Data)} />,
    document.getElementById('root')
);

if (process.env.NODE_ENV !== 'prodution') {
    unregister();
} else {
    register();
}
