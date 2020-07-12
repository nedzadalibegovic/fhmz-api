const express = require('express');
const Forecast = require('../models/forecast');

const router = express.Router();

// route: GET /cities
router.get('/', async (req, res, next) => {
    try {
        let forecasts = await Forecast.find({}, { _id: false, 'forecasts._id': false });
        res.json(forecasts);
    } catch (err) {
        next(err);
    }
});

// route: GET /cities/<city_name>
router.get('/:city', async (req, res, next) => {
    const name = req.params.city;

    try {
        const city = await Forecast.findOne({ $text: { $search: name } }, { _id: false, 'forecasts._id': false });

        if (city == null) {
            res.status(404);
            throw new Error('City not found');
        }

        res.json(city);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
