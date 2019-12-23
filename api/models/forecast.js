const mongoose = require('mongoose');

const forecastSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    grad: String,
    datum: String,
    vrijeme_mjerenja: String,
    vrijeme: String,
    temp: Number,
    vlaznost: Number,
    pritisak: Number,
    forecasts: [{
        datum: String,
        prijepodne: String,
        mintemp: Number,
        poslijepodne: String,
        maxtemp: Number
    }]
});

module.exports = mongoose.model('Forecast', forecastSchema);