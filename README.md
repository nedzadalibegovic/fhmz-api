# RESTFul API for Federalni hidrometeorološki zavod
Simple API that provides weather data for **nine** cities in Bosnia and Herzegovina (*Bihać, Banja Luka, Bugojno, Livno, Mostar, Sarajevo, Trebinje, Tuzla, Zenica*). Data is provided from an XML file hosted on the [Federalni hidrometeorološki zavod website](http://www.fhmzbih.gov.ba/) that is updated daily.

Currently, data is fetched every 6 hours, parsed, converted to JSON and saved to a MongoDB database. This functionality is provided in the `fetch_data.js` file, which is going to be deprecated with POST and PATCH methods in the near future.

## What routes and methods do you support?
Currently supported routes and methods:

| Route | Supported Methods |
| --- | --- |
| `/cities/` | `GET` |
| `/cities/{city_name}` | `GET` |

You can also send an `OPTIONS` request to the API to see supported methods.

## How can I host it myself?
You need Node.js, MongoDB and two environment variables:

    # MongoDB cluster
    MONGO=mongodb+srv://<username>:<password>@<server>
    # MongoDB database name (collection will be named 'forecasts')
    DB_NAME=example

You need to populate the database first with:

    node fetch_data.js

And then you can run the API using:

    npm start