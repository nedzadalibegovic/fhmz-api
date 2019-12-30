const express = require('express');
const Forecast = require('../models/forecast');
const router = express.Router();

// route: /cities
router.get('/', (req, res, next) => {
    Forecast.find()
        .exec()
        .then(docs => {
            console.log(docs);
            res.status(200).json(docs);
        })
        .catch(err => {
            console.log(`Error: ${err}`);
            res.status(500).json({
                error: err
            })
        });
});

// route: /cities/<city_name>
router.get('/:city', (req, res, next) => {
    const name = req.params.city;

    Forecast.findOne({ $text: { $search: name } })
        .exec()
        .then(doc => {
            console.log(doc);

            if (doc === null) {
                res.status(404).json({
                    message: 'City not found'
                });
            } else {
                res.status(200).json(doc);
            }
        })
        .catch(err => {
            console.log(`Error: ${err}`);
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;