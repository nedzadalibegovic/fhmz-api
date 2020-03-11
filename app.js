const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cityRoutes = require('./api/routes/cities');

const app = express();

// mongoose settings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// establish db connection
mongoose.connect(process.env.MONGO);

// middlewares
app.use(cors());
app.use('/cities', cityRoutes);

// routes
app.get('/', (req, res) => {
    res.redirect(302, process.env.REDIRECT);
});

app.listen(process.env.PORT || 3000);