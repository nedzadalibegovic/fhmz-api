const fetch = require('node-fetch');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { parseStringPromise } = require('xml2js');
const moment = require('moment');
const Forecast = require('./models/forecast');

const not_num = /[^\d.]+/g;
let lastModified = '';

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

const createTimestamp = (datum, vrijememjerenja = '01:00') => {
    return moment(`${datum} ${vrijememjerenja} +0100`, 'DD.MM.YYYY HH:mm Z').toDate();
};

const createCity = (grad) => {
    let vlaznost = grad.danas.vlaznost.replace(not_num, '');

    if (vlaznost !== '') {
        vlaznost /= 100;
    }

    return {
        city: grad.naziv,
        timestamp: createTimestamp(grad.danas.datum, grad.danas.vrijememjerenja),
        description: /\S/.test(grad.danas.vrijeme) ? grad.danas.vrijeme : null,
        temperature: grad.danas.temperatura.replace(not_num, ''),
        humidity: vlaznost,
        pressure: grad.danas.tlak.replace(not_num, ''),
        windSpeed: grad.danas.brzinavjetra[1].replace(not_num, ''),
        windDirection: /\S/.test(grad.danas.smjervjetra) ? grad.danas.smjervjetra : null,
        forecasts: [],
    };
};

const createForecast = (forecast, datum = forecast.datum.replace(not_num, '')) => {
    return {
        date: createTimestamp(datum),
        low: forecast.mintemp,
        high: forecast.maxtemp,
        morning: forecast.prijepodne,
        afternoon: forecast.poslijepodne,
    };
};

const addForecastsToCity = (grad, cityForecast) => {
    if (cityForecast.city === 'Bihać') {
        cityForecast.forecasts.push(createForecast(grad.vrijemedanas, grad.danas.datum));
    } else {
        cityForecast.forecasts.push(createForecast(grad.prognozadanas, grad.danas.datum));
    }

    cityForecast.forecasts.push(createForecast(grad.sutra));
    cityForecast.forecasts.push(createForecast(grad.prekosutra));
    cityForecast.forecasts.push(createForecast(grad.zakosutra));
};

const submitToDb = async (xml) => {
    const parsed = await parseStringPromise(xml, {
        trim: true,
        explicitArray: false,
        explicitRoot: false,
        mergeAttrs: true,
    });

    await mongoose.connect(process.env.MONGO);

    for (const grad of parsed.grad) {
        const cityForecast = createCity(grad);

        addForecastsToCity(grad, cityForecast);

        await Forecast.findOneAndUpdate({ city: cityForecast.city }, cityForecast, { upsert: true });
    }

    await mongoose.disconnect();
};

cron.schedule(process.env.CRON, async () => {
    const response = await fetch('http://www.fhmzbih.gov.ba/RSS/FHMZBIH1.xml', {
        headers: {
            'If-Modified-Since': lastModified,
        },
    });

    if (response.ok) {
        await submitToDb(await response.text());
        lastModified = response.headers.get('last-modified');
    }

    console.log(`${new Date().toUTCString()} - ${response.status} - ${response.statusText}`);
});
