require('dotenv').config();
const fetch = require('node-fetch');
const convert = require('xml-js');
const mongoose = require('mongoose');
const Forecast = require('./api/models/forecast');

const not_num = /[^\d.]+/g;

const getXML = async () => {
    let response = await fetch('http://www.fhmzbih.gov.ba/RSS/FHMZBIH1.xml');
    let body = await response.text();

    return body;
}

const connectToDb = () => {
    let uri = process.env.MONGO;

    return mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: process.env.DB_NAME
    });
}

// param path: obj.vremenska.grad[index]
const createForecastFromJson = (json) => {
    let grad = json._attributes.naziv;
    let datum = json.danas.datum._text;
    let vrijeme_mjerenja = json.danas.vrijememjerenja._text;
    let vrijeme = json.danas.vrijeme._text;
    let temp = json.danas.temperatura._text.replace(not_num, '');
    let vlaznost = json.danas.vlaznost._text.replace(not_num, '');
    let pritisak = json.danas.tlak._text.replace(not_num, '');

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
}

// param path: obj.vremenska.grad[index].<danas/sutra/prekosutra/zakosutra>
const createWeatherFromJson = (json, date = json.datum._text) => {
    let prijepodne = json.prijepodne._text;
    let mintemp = json.mintemp._text;
    let poslijepodne = json.poslijepodne._text;
    let maxtemp = json.maxtemp._text;

    return {
        date: date.replace(not_num, ''),
        low: mintemp,
        high: maxtemp,
        morning: prijepodne,
        afternoon: poslijepodne
    };
}

const addWeatherToForecast = (json, forecast) => {
    if (forecast.city === 'Bihać') {
        forecast.forecasts.push(createWeatherFromJson(json.vrijemedanas, forecast.date));
    } else {
        forecast.forecasts.push(createWeatherFromJson(json.prognozadanas, forecast.date));
    }

    forecast.forecasts.push(createWeatherFromJson(json.sutra));
    forecast.forecasts.push(createWeatherFromJson(json.prekosutra));
    forecast.forecasts.push(createWeatherFromJson(json.zakosutra));
}

const main = async () => {
    let xml = await getXML();
    let json = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 4 }));

    let db = connectToDb();

    for (const grad of json.vremenska.grad) {
        const forecast = createForecastFromJson(grad);

        addWeatherToForecast(grad, forecast);

        await Forecast.findOneAndUpdate({ city: forecast.city }, forecast, { upsert: true, useFindAndModify: false });
    }

    (await db).disconnect();
}

main();