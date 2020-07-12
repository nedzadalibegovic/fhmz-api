const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const cityRoutes = require('./routes/cities');

const app = express();

// running behind proxy
app.set('trust proxy', '172.17.0.1');

// mongoose settings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// establish db connection
mongoose.connect(process.env.MONGO_URL);

// middlewares
app.use(helmet());
app.use(morgan('common'));
app.use(cors());
app.use('/cities', cityRoutes);

// redirect
app.get('*', (req, res) => {
    res.redirect(307, process.env.REDIRECT);
});

app.listen(process.env.PORT || 3000);