const mongoose = require('mongoose');

const forecastSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    city: String,
    date: String,
    time: String,
    weather: String,
    temperature: Number,
    humidity: Number,
    pressure: Number,
    forecasts: [{
        date: String,
        low: Number,
        high: Number,
        morning: String,
        afternoon: String
    }]
}, {
    versionKey: false
});

forecastSchema.index({ city: 'text' });

module.exports = mongoose.model('Forecast', forecastSchema);