const fetch = require('node-fetch');
const convert = require('xml-js');

const not_num = /[^\d.]+/g;
const forecasts = [];

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

    addForecast(forecast) {
        this.forecast.push(forecast);
    }
}

const getXML = async () => {
    let response = await fetch('http://www.fhmzbih.gov.ba/RSS/FHMZBIH1.xml');
    let body = await response.text();

    return body;
}

const main = async () => {
    let xml = await getXML();
    let json = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 4 }));

    json.vremenska.grad.forEach(grad => {
        let prognoza = Prognoza.fromJson(grad);

        if (prognoza.grad == 'Bihać') {
            prognoza.addForecast(Vrijeme.fromJson(grad.vrijemedanas, prognoza.datum));
        } else {
            prognoza.addForecast(Vrijeme.fromJson(grad.prognozadanas, prognoza.datum));
        }

        prognoza.addForecast(Vrijeme.fromJson(grad.sutra));
        prognoza.addForecast(Vrijeme.fromJson(grad.prekosutra));
        prognoza.addForecast(Vrijeme.fromJson(grad.zakosutra));

        forecasts.push(prognoza);
    });

    console.log(JSON.stringify(forecasts[0]));
}

main();