# RESTFul API for Federal Hydrometeorological Institute

REST API that provides weather data for **nine** cities in Bosnia and Herzegovina (_Bihać, Banja Luka, Bugojno, Livno, Mostar, Sarajevo, Trebinje, Tuzla, Zenica_). Data is provided from an XML file hosted on the [Federal Hydrometeorological Institute website](http://www.fhmzbih.gov.ba/) that is updated daily.

Data fetching functionality is provided in the `fetch_data.js` file.

## API servers

| Server                 | Location        |
| ---------------------- | --------------- |
| fhmi.lyra.nedzad.dev   | EU (Germany)    |
| fhmi.hydrus.nedzad.dev | US (East Coast) |

## What routes and methods do you support?

Currently supported routes and methods:

| Route                 | Supported Methods |
| --------------------- | ----------------- |
| `/cities/`            | `GET`             |
| `/cities/{city_name}` | `GET`             |

### Example API call:

```json
GET /cities/bihac

{
  "city": "Bihać",
  "description": "pretežnooblačno",
  "forecasts": [
    {
      "date": "2020-03-23T00:00:00.000Z",
      "low": -3,
      "high": 0,
      "morning": "pretežno oblačno sa snijegom",
      "afternoon": "pretežno oblačno sa snijegom"
    },
    {
      "date": "2020-03-24T00:00:00.000Z",
      "low": -3,
      "high": 0,
      "morning": "pretežno oblačno sa snijegom",
      "afternoon": "pretežno oblačno sa snijegom"
    },
    {
      "date": "2020-03-25T00:00:00.000Z",
      "low": -2,
      "high": 0,
      "morning": "pretežno oblačno sa snijegom",
      "afternoon": "susnježica"
    },
    {
      "date": "2020-03-26T00:00:00.000Z",
      "low": -1,
      "high": 1,
      "morning": "pretežno oblačno sa snijegom",
      "afternoon": "susnježica"
    }
  ],
  "humidity": 0.37,
  "pressure": 995.6,
  "temperature": 2,
  "timestamp": "2020-03-23T11:07:00.000Z",
  "windDirection": "N",
  "windSpeed": 18
}
```

## Legend

| Property                              | Unit | Note                                                                                           |
| ------------------------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `low`, `high`, `temperature`          | °C   | `low` - minimum temperature, `high` - maximum temperature, `temperature` - current temperature |
| `humidity`                            | %    | Relative humidity                                                                              |
| `pressure`                            | hPa  | Atmospheric pressure on the ground level                                                       |
| `windSpeed`                           | km/h | `windDirection` - wind direction reported in cardinal and intercardinal directions             |
| `date`, `timestamp`                   |      | In ISO 8601 format, `timestamp` - date when measurments were taken                             |
| `forecasts`                           |      | Contains 4-day forecast                                                                        |
| `description`, `morning`, `afternoon` |      | Textual weather description                                                                    |

## How can I host it myself?

You need Node.js, MongoDB and two environment variables (check the `.env_sample` file), when everything is set up properly, run the data fetching service with:

    npm run fetch

For running the API in a dev environment, you can use:

    npm run dev

For running in a production environment, you can use:

    npm start

Check `package.json` to see how `npm run dev` and `npm start` differ.
