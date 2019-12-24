require('dotenv').config();
const fetch = require('node-fetch');
const convert = require('xml-js');
const mongoose = require('mongoose');
const Forecast = require('./api/models/forecast');

const not_num = /[^\d.]+/g;

class Vrijeme {
    constructor(datum, prijepodne, mintemp, poslijepodne, maxtemp) {
        this.datum = datum.replace(not_num, '');
        this.prijepodne = prijepodne;
        this.mintemp = mintemp;
        this.poslijepodne = poslijepodne;
        this.maxtemp = maxtemp;
    }

    // param path: obj.vremenska.grad[number].<danas/sutra/prekosutra/zakosutra>
    static fromJson(json, date = json.datum._text) {
        let datum = date;
        let prijepodne = json.prijepodne._text;
        let mintemp = json.mintemp._text;
        let poslijepodne = json.poslijepodne._text;
        let maxtemp = json.maxtemp._text;

        return new Vrijeme(datum, prijepodne, mintemp, poslijepodne, maxtemp);
    }
}

class Prognoza {
    constructor(grad, datum, vrijeme_mjerenja, vrijeme, temp, vlaznost, pritisak) {
        this.grad = grad;
        this.datum = datum;
        this.vrijeme_mjerenja = vrijeme_mjerenja;
        this.vrijeme = vrijeme;
        this.temp = temp.replace(not_num, '');
        this.vlaznost = vlaznost.replace(not_num, '');
        this.pritisak = pritisak.replace(not_num, '');
        this.forecast = [];
    }

    // param path: obj.vremenska.grad[index]
    static fromJson(json) {
        let grad = json._attributes.naziv;
        let datum = json.danas.datum._text;
        let vrijeme_mjerenja = json.danas.vrijememjerenja._text;
        let vrijeme = json.danas.vrijeme._text || '';
        let temp = json.danas.temperatura._text;
        let vlaznost = json.danas.vlaznost._text;
        let pritisak = json.danas.tlak._text;

        return new Prognoza(grad, datum, vrijeme_mjerenja, vrijeme, temp, vlaznost, pritisak);
    }

    addWeather(forecast) {
        this.forecast.push(forecast);
    }
}

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

const createForecast = json => {
    let forecast = Prognoza.fromJson(json);

    if (forecast.grad === 'Bihać') {
        forecast.addWeather(Vrijeme.fromJson(json.vrijemedanas, forecast.datum));
    } else {
        forecast.addWeather(Vrijeme.fromJson(json.prognozadanas, forecast.datum));
    }

    forecast.addWeather(Vrijeme.fromJson(json.sutra));
    forecast.addWeather(Vrijeme.fromJson(json.prekosutra));
    forecast.addWeather(Vrijeme.fromJson(json.zakosutra));

    return {
        grad: forecast.grad,
        datum: forecast.datum,
        vrijeme_mjerenja: forecast.vrijeme_mjerenja,
        vrijeme: forecast.vrijeme,
        temp: forecast.temp,
        vlaznost: forecast.vlaznost,
        pritisak: forecast.pritisak,
        forecasts: forecast.forecast
    };
}

const main = async () => {
    let xml = await getXML();
    let json = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 4 }));

    let db = connectToDb();

    for (const grad of json.vremenska.grad) {
        const forecast = createForecast(grad);

        await Forecast.findOneAndUpdate({ grad: forecast.grad }, forecast, { upsert: true, useFindAndModify: false });
    }

    (await db).disconnect();
}

main();