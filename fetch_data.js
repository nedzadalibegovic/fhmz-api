const fetch = require('node-fetch');
const convert = require('xml-js');
const mongoose = require('mongoose');
const cron = require('node-cron');
const Forecast = require('./api/models/forecast');

const not_num = /[^\d.]+/g;
let lastModified = new String();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// param path: obj.vremenska.grad[index]
const createForecast = (json) => {
    const grad = json._attributes.naziv;
    const datum = json.danas.datum._text;
    const vrijeme_mjerenja = json.danas.vrijememjerenja._text;
    const vrijeme = json.danas.vrijeme._text;
    const temp = json.danas.temperatura._text.replace(not_num, '');
    let vlaznost = json.danas.vlaznost._text.replace(not_num, '');
    const pritisak = json.danas.tlak._text.replace(not_num, '');

    if (vlaznost !== '') {
        vlaznost /= 100;
    }

    return {
        city: grad,
        date: datum,
        time: vrijeme_mjerenja,
        weather: vrijeme,
        temperature: temp,
        humidity: vlaznost,
        pressure: pritisak,
        forecasts: []
    };
};

// param path: obj.vremenska.grad[index].<danas/sutra/prekosutra/zakosutra>
const createWeather = (json, date = json.datum._text) => {
    const prijepodne = json.prijepodne._text;
    const mintemp = json.mintemp._text;
    const poslijepodne = json.poslijepodne._text;
    const maxtemp = json.maxtemp._text;

    return {
        date: date.replace(not_num, ''),
        low: mintemp,
        high: maxtemp,
        morning: prijepodne,
        afternoon: poslijepodne
    };
};

const addWeatherToForecast = (json, forecast) => {
    if (forecast.city === 'Bihać') {
        forecast.forecasts.push(createWeather(json.vrijemedanas, forecast.date));
    } else {
        forecast.forecasts.push(createWeather(json.prognozadanas, forecast.date));
    }

    forecast.forecasts.push(createWeather(json.sutra));
    forecast.forecasts.push(createWeather(json.prekosutra));
    forecast.forecasts.push(createWeather(json.zakosutra));
};

const submitToDb = async (xml) => {
    const parsedData = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 4 }));

    await mongoose.connect(process.env.MONGO);

    for (const grad of parsedData.vremenska.grad) {
        const forecast = createForecast(grad);

        addWeatherToForecast(grad, forecast);

        await Forecast.findOneAndUpdate({ city: forecast.city }, forecast, { upsert: true });
    }

    await mongoose.disconnect();
};

const firstRun = async () => {
    const response = await fetch('http://www.fhmzbih.gov.ba/RSS/FHMZBIH1.xml');
    await submitToDb(await response.text());
    lastModified = response.headers.get('last-modified');
};

firstRun();

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