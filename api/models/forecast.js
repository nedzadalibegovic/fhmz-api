const mongoose = require('mongoose');

const forecastSchema = mongoose.Schema({
    city: String,
    timestamp: Date,
    description: String,
    temperature: Number,
    humidity: Number,
    pressure: Number,
    forecasts: [{
        date: Date,
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