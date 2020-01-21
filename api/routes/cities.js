const express = require('express');
const Forecast = require('../models/forecast');

const router = express.Router();

// route: GET /cities
router.get('/', async (req, res) => {
    try {
        let forecasts = await Forecast.find();
        res.status(200).json(forecasts);
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

// route: GET /cities/<city_name>
router.get('/:city', async (req, res) => {
    const name = req.params.city;

    try {
        const city = await Forecast.findOne({ $text: { $search: name } });

        if (city == null) {
            res.status(404).json({ message: "City not found" });
        } else {
            res.status(200).json(city);
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

module.exports = router;