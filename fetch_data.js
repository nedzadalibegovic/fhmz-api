const fetch = require('node-fetch');
const convert = require('xml-js');
const mongoose = require('mongoose');
const Forecast = require('./api/models/forecast');

const not_num = /[^\d.]+/g;

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

const getXML = async () => {
    const response = await fetch('http://www.fhmzbih.gov.ba/RSS/FHMZBIH1.xml');
    const body = await response.text();

    return body;
};

// param path: obj.vremenska.grad[index]
const createForecastFromJson = (json) => {
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
const createWeatherFromJson = (json, date = json.datum._text) => {
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
        forecast.forecasts.push(createWeatherFromJson(json.vrijemedanas, forecast.date));
    } else {
        forecast.forecasts.push(createWeatherFromJson(json.prognozadanas, forecast.date));
    }

    forecast.forecasts.push(createWeatherFromJson(json.sutra));
    forecast.forecasts.push(createWeatherFromJson(json.prekosutra));
    forecast.forecasts.push(createWeatherFromJson(json.zakosutra));
};

const main = async () => {
    const xml = await getXML();
    const json = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 4 }));

    await mongoose.connect(process.env.MONGO);

    for (const grad of json.vremenska.grad) {
        const forecast = createForecastFromJson(grad);

        addWeatherToForecast(grad, forecast);

        await Forecast.findOneAndUpdate({ city: forecast.city }, forecast, { upsert: true });
    }

    await mongoose.disconnect();
};

main();