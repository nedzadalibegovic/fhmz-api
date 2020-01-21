# RESTFul API for Federal Hydrometeorological Institute
Simple API that provides weather data for **nine** cities in Bosnia and Herzegovina (*Bihać, Banja Luka, Bugojno, Livno, Mostar, Sarajevo, Trebinje, Tuzla, Zenica*). Data is provided from an XML file hosted on the [Federal Hydrometeorological Institute website](http://www.fhmzbih.gov.ba/) that is updated daily.

Currently, data is fetched every 6 hours, parsed, converted to JSON and saved to a MongoDB database. This functionality is provided in the `fetch_data.js` file, which is going to be deprecated with POST and PATCH methods in the near future.

## What routes and methods do you support?
Currently supported routes and methods:

| Route | Supported Methods |
| --- | --- |
| `/cities/` | `GET` |
| `/cities/{city_name}` | `GET` |

## How can I host it myself?
You need Node.js, MongoDB and two environment variables (check the `.env_sample` file), if everything is set up properly, populate the database first with:

    npm run fetch

For running in a dev environment, you can use:

    npm run dev

For running in a production environment, you can use:

    npm start

Check `package.json` to see how `npm run dev` and `npm start` differ.