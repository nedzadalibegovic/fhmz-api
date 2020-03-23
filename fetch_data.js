const fetch = require('node-fetch');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { parseStringPromise } = require('xml2js');
const Forecast = require('./api/models/forecast');

const not_num = /[^\d.]+/g;
let lastModified = '';

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

const createForecast = (grad) => {
    let vlaznost = grad.danas.vlaznost.replace(not_num, '');

    if (vlaznost !== '') {
        vlaznost /= 100;
    }

    return {
        city: grad.naziv,
        date: grad.danas.datum,
        time: grad.danas.vrijememjerenja,
        weather: grad.danas.vrijeme,
        temperature: grad.danas.temperatura.replace(not_num, ''),
        humidity: vlaznost,
        pressure: grad.danas.tlak.replace(not_num, ''),
        forecasts: []
    };
};

const createWeather = (grad, date = grad.datum) => {
    return {
        date: date.replace(not_num, ''),
        low: grad.mintemp,
        high: grad.maxtemp,
        morning: grad.prijepodne,
        afternoon: grad.poslijepodne
    };
};

const addWeatherToForecast = (grad, cityForecast) => {
    if (cityForecast.city === 'Bihać') {
        cityForecast.forecasts.push(createWeather(grad.vrijemedanas, cityForecast.date));
    } else {
        cityForecast.forecasts.push(createWeather(grad.prognozadanas, cityForecast.date));
    }

    cityForecast.forecasts.push(createWeather(grad.sutra));
    cityForecast.forecasts.push(createWeather(grad.prekosutra));
    cityForecast.forecasts.push(createWeather(grad.zakosutra));
};

const submitToDb = async (xml) => {
    const parsed = await parseStringPromise(xml, {
        trim: true,
        explicitArray: false,
        explicitRoot: false,
        mergeAttrs: true
    });

    await mongoose.connect(process.env.MONGO);

    for (const grad of parsed.grad) {
        const cityForecast = createForecast(grad);

        addWeatherToForecast(grad, cityForecast);

        await Forecast.findOneAndUpdate({ city: cityForecast.city }, cityForecast, { upsert: true });
    }

    await mongoose.disconnect();
};

cron.schedule(process.env.CRON, async () => {
    const response = await fetch('http://www.fhmzbih.gov.ba/RSS/FHMZBIH1.xml', {
        headers: {
            'If-Modified-Since': lastModified
        }
    });

    if (response.ok) {
        await submitToDb(await response.text());
        lastModified = response.headers.get('last-modified');
    }

    console.log(`${new Date().toUTCString()} - ${response.status} - ${response.statusText}`);
});