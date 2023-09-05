import '@intility/bifrost-react/dist/bifrost-app.css'
import './App.css';
import { Nav, Card, Table, Icon, Input, Checkbox, Dropdown, Accordion, Select, Modal } from '@intility/bifrost-react'
import { faCloud, faCheck, faSearch, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis } from 'recharts';
import intility from './img/intility.png'
import cat from './img/cat.png'

Modal.setAppElement('#root');

function App() {
  const [catMode, setCatMode] = useState(false)

  const [weather, setWeather] = useState(null);
  const [weatherDescription, setWeatherDescription] = useState(null);
  const [location, setLocation] = useState(null);

  const [weatherModal, setWeatherModal] = useState(false);
  const [chartDataTemp, setChartDataTemp] = useState([]);
  const [chartDataHumid, setChartDataHumid] = useState([]);
  const [chartDataWind, setChartDataWind] = useState([]);
  const [chartSize, setChartSize] = useState({});

  const [time, setTime] = useState(null);
  const [day, setDay] = useState(null);
  const [month, setMonth] = useState(null);
  const [dayNumber, setDayNumber] = useState(null);
  const [year, setYear] = useState(null);
  const [canGetTime, setCanGetTime] = useState(true);

  const [typeDelay, setTypeDelay] = useState(800);
  const [typingTimer, setTypingTimer] = useState(null);
  const [autofill, setAutofill] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [openAutofill, setOpenAutofill] = useState(false);
  const [stopID, setStopID] = useState('NSR:StopPlace:6549'); // Kværnerveien
  const [firstRun, setFirstRun] = useState(null);
  const [nextDepartures, setNextDepartures] = useState(null);

  const [stopSettings, setStopSettings] = useState(false);
  const [lineOptions, setLineOptions] = useState(null);
  const [lineFilter, setLineFilter] = useState(null);

  const [cycle, setCycle] = useState(null);

  useEffect(() => {
    const getWeather = () => {
        if(location) {
            axios.get('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + location.latitude + '&lon=' + location.longitude)
                .then((response) => {
                    setWeather(response.data);

                    let tempData = [];
                    for(let i = 0; i < 24; i++) {
                        tempData.push({name: response.data.properties.timeseries[i].time.substring(11, 16), temp: response.data.properties.timeseries[i].data.instant.details.air_temperature})
                    }
                    setChartDataTemp(tempData);

                    let humidData = [];
                    for(let i = 0; i < 24; i++) {
                        humidData.push({name: response.data.properties.timeseries[i].time.substring(11, 16), humid: response.data.properties.timeseries[i].data.instant.details.relative_humidity})
                    }
                    setChartDataHumid(humidData);

                    let windData = [];
                    for(let i = 0; i < 24; i++) {
                        windData.push({name: response.data.properties.timeseries[i].time.substring(11, 16), wind: response.data.properties.timeseries[i].data.instant.details.wind_speed})
                    }
                    setChartDataWind(windData);

                    setChartSize({ height: (window.innerHeight / 100) * 75 / 2, width: (window.innerWidth / 100) * 75 / 2 });
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }
    getWeather();
    window.setInterval(() => {
        getWeather();
    }, 60000);
  }, [location]);

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            })
        });
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
  }, []);

  useEffect(() => {
    if(canGetTime) {
        setTime(new Date().toLocaleTimeString('nb-NO').replace(/(.*)\D\d+/, '$1'));
        setDay(new Date().toLocaleDateString('nb-NO', { weekday: 'long' }));
        setMonth(new Date().toLocaleDateString('nb-NO', { month: 'long' }));
        setDayNumber(new Date().toLocaleDateString('nb-NO', { day: 'numeric' }));
        setYear(new Date().toLocaleDateString('nb-NO', { year: 'numeric' }));
    }
    const interval = setInterval(() => {
        setCanGetTime(false);
        setTime(new Date().toLocaleTimeString('nb-NO').replace(/(.*)\D\d+/, '$1'));
        setDay(new Date().toLocaleDateString('nb-NO', { weekday: 'long' }));
        setMonth(new Date().toLocaleDateString('nb-NO', { month: 'long' }));
        setDayNumber(new Date().toLocaleDateString('nb-NO', { day: 'numeric' }));
        setYear(new Date().toLocaleDateString('nb-NO', { year: 'numeric' }));
    }, 1000);
    return () => clearInterval(interval);
  }, [canGetTime]);

  useEffect(() => {
    if(location) {
        const getStopData = async () => {
            axios.post('https://api.entur.io/journey-planner/v3/graphql', {
                query: `# Avgangstavle
                {
                    stopPlace(id: "${stopID}") {
                      id
                      name
                      estimatedCalls(timeRange: 72100, numberOfDepartures: 50) {   
                        realtime
                        aimedArrivalTime
                        aimedDepartureTime
                        expectedArrivalTime
                        expectedDepartureTime
                        actualArrivalTime
                        actualDepartureTime
                        date
                        forBoarding
                        forAlighting
                        destinationDisplay {
                          frontText
                        }
                        quay {
                          id
                        }
                        serviceJourney {
                          journeyPattern {
                            line {
                              id
                              name
                              transportMode
                            }
                          }
                        }
                      }
                    }
                  }
                `,
                variables: {}
            }).then(res => {
                if(res.data.data.stopPlace) {
                    setNextDepartures(res.data.data.stopPlace);
                }
            }).catch(err => {
                console.log(err);
            })
        }
        getStopData();
        clearInterval(firstRun);
        setFirstRun(window.setInterval(() => {
            getStopData();
        }, 30000));
    }
  }, [stopID, location]);

  useEffect(() => {
    if(nextDepartures !== null) {
        let tempOptions = [{ value: '', label: 'All'}];
        for(let i = 0; i < nextDepartures.estimatedCalls.length; i++) {
            if(!tempOptions.find(item => item.value.split("/")[0] === nextDepartures.estimatedCalls[i].serviceJourney.journeyPattern.line.id.split(":")[2])) {
                tempOptions.push({ value: nextDepartures.estimatedCalls[i].serviceJourney.journeyPattern.line.id.split(":")[2] + "/" + nextDepartures.estimatedCalls[i].destinationDisplay.frontText, label: nextDepartures.estimatedCalls[i].serviceJourney.journeyPattern.line.id.split(":")[2] + " " + nextDepartures.estimatedCalls[i].destinationDisplay.frontText})
            } else {
                if(!tempOptions.find(item => item.value.split("/")[1] === nextDepartures.estimatedCalls[i].destinationDisplay.frontText)) {
                    tempOptions.push({ value: nextDepartures.estimatedCalls[i].serviceJourney.journeyPattern.line.id.split(":")[2] + "/" + nextDepartures.estimatedCalls[i].destinationDisplay.frontText, label: nextDepartures.estimatedCalls[i].serviceJourney.journeyPattern.line.id.split(":")[2] + " " + nextDepartures.estimatedCalls[i].destinationDisplay.frontText})
                }
            }
        }
        tempOptions.sort((a,b) => a.value.split("/")[0] - b.value.split("/")[0])
        setLineOptions(tempOptions);
        setStopSettings(true);
    }
  }, [nextDepartures])

  /*useEffect(() => {
    const getCycles = async () => {
        axios.get('https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json', {
            withCredentials: true,
            headers: {
                'Client-Identifier': 'intility-info-board'
            }
            })
        .then((response) => {
            setCycle(response.data);
        })
        .catch((error) => {
            console.log(error);
        });
    }
    getCycles();
    window.setInterval(() => {
        getCycles();
    }, 30000);
  }, [])*/

  useEffect(() => {
    if(weather) {
        switch (weather.properties.timeseries[0].data.next_1_hours.summary.symbol_code) {
            case 'clearsky_day':
                setWeatherDescription('Sol');
                break;
            case 'clearsky_night':
                setWeatherDescription('Klar himmel');
                break;
            case 'fair_day':
                setWeatherDescription('Sol');
                break;
            case 'fair_night':
                setWeatherDescription('Klar himmel');
                break;
            case 'partlycloudy_day':
                setWeatherDescription('Delvis skyet');
                break;
            case 'partlycloudy_night':
                setWeatherDescription('Delvis skyet');
                break;
            case 'cloudy':
                setWeatherDescription('Overskyet');
                break;
            case 'lightrainshowers_day':
                setWeatherDescription('Lette regnbyger');
                break;
            case 'lightrainshowers_night':
                setWeatherDescription('Lette regnbyger');
                break;
            case 'rainshowers_day':
                setWeatherDescription('Regnbyger');
                break;
            case 'rainshowers_night':
                setWeatherDescription('Regnbyger');
                break;
            case 'heavyrainshowers_day':
                setWeatherDescription('Kraftige regnbyger');
                break;
            case 'heavyrainshowers_night':
                setWeatherDescription('Kraftige regnbyger');
                break;
            case 'lightrainshowersandthunder_day':
                setWeatherDescription('Lette regnbyger og torden');
                break;
            case 'lightrainshowersandthunder_night':
                setWeatherDescription('Lette regnbyger og torden');
                break;
            case 'rainshowersandthunder_day':
                setWeatherDescription('Regnbyger og torden');
                break;
            case 'rainshowersandthunder_night':
                setWeatherDescription('Regnbyger og torden');
                break;
            case 'heavyrainshowersandthunder_day':
                setWeatherDescription('Kraftige regnbyger og torden');
                break;
            case 'heavyrainshowersandthunder_night':
                setWeatherDescription('Kraftige regnbyger og torden');
                break;
            case 'lightsleetshowers_day':
                setWeatherDescription('Lette sluddbyger');
                break;
            case 'lightsleetshowers_night':
                setWeatherDescription('Lette sluddbyger');
                break;
            case 'lightsleetshowersandthunder_day':
                setWeatherDescription('Lette sluddbyger og torden');
                break;
            case 'lightsleetshowersandthunder_night':
                setWeatherDescription('Lette sluddbyger og torden');
                break;
            case 'sleetshowersandthunder_day':
                setWeatherDescription('Sluddbyger og torden');
                break;
            case 'sleetshowersandthunder_night':
                setWeatherDescription('Sluddbyger og torden');
                break;
            case 'heavysleetshowersandthunder_day':
                setWeatherDescription('Kraftige sluddbyger og torden');
                break;
            case 'heavysleetshowersandthunder_night':
                setWeatherDescription('Kraftige sluddbyger og torden');
                break;
            case 'lightsnowshowers_day':
                setWeatherDescription('Lette snøbyger');
                break;
            case 'lightsnowshowers_night':
                setWeatherDescription('Lette snøbyger');
                break;
            case 'snowshowers_day':
                setWeatherDescription('Snøbyger');
                break;
            case 'snowshowers_night':
                setWeatherDescription('Snøbyger');
                break;
            case 'heavysnowshowers_day':
                setWeatherDescription('Kraftige snøbyger');
                break;
            case 'heavysnowshowers_night':
                setWeatherDescription('Kraftige snøbyger');
                break;
            case 'lightsnowshowersandthunder_day':
                setWeatherDescription('Lette snøbyger og torden');
                break;
            case 'lightsnowshowersandthunder_night':
                setWeatherDescription('Lette snøbyger og torden');
                break;
            case 'snowshowersandthunder_day':
                setWeatherDescription('Snøbyger og torden');
                break;
            case 'snowshowersandthunder_night':
                setWeatherDescription('Snøbyger og torden');
                break;
            case 'heavysnowshowersandthunder_day':
                setWeatherDescription('Kraftige snøbyger og torden');
                break;
            case 'heavysnowshowersandthunder_night':
                setWeatherDescription('Kraftige snøbyger og torden');
                break;
            case 'lightrain':
                setWeatherDescription('Lett regn');
                break;
            case 'rain':
                setWeatherDescription('Regn');
                break;
            case 'heavyrain':
                setWeatherDescription('Kraftig regn');
                break;
            case 'lightrainandthunder':
                setWeatherDescription('Lett regn og torden');
                break;
            case 'rainandthunder':
                setWeatherDescription('Regn og torden');
                break;
            case 'heavyrainandthunder':
                setWeatherDescription('Kraftig regn og torden');
                break;
            case 'lightsleet':
                setWeatherDescription('Lett sludd');
                break;
            case 'sleet':
                setWeatherDescription('Sludd');
                break;
            case 'heavysleet':
                setWeatherDescription('Kraftig sludd');
                break;
            case 'lightsleetandthunder':
                setWeatherDescription('Lett sludd og torden');
                break;
            case 'sleetandthunder':
                setWeatherDescription('Sludd og torden');
                break;
            case 'heavysleetandthunder':
                setWeatherDescription('Kraftig sludd og torden');
                break;
            case 'lightsnow':
                setWeatherDescription('Lett snø');
                break;
            case 'snow':
                setWeatherDescription('Snø');
                break;
            case 'heavysnow':
                setWeatherDescription('Kraftig snø');
                break;
            case 'lightsnowandthunder':
                setWeatherDescription('Lett snø og torden');
                break;
            case 'snowandthunder':
                setWeatherDescription('Snø og torden');
                break;
            case 'heavysnowandthunder':
                setWeatherDescription('Kraftig snø og torden');
                break;
            case 'fog':
                setWeatherDescription('Tåke');
                break;
            default:
                setWeatherDescription('Ukjent værtype');
                break;
        }
    }
  }, [weather]);

  const catModeChange = () => {
    if(catMode) {
        setCatMode(false)
    } else {
        setCatMode(true)
    }
  }

  useEffect(() => {
    const getData = async () => {
        const res = await axios.get(`https://api.entur.io/geocoder/v1/autocomplete?text=${searchLocation}&lang=no&size=8&layers=venue`);
        setAutofill(res.data);
    }
    clearTimeout(typingTimer);
    if(searchLocation !== "") {
        setTypingTimer(setTimeout(() => {
            getData();
        }, typeDelay));
    }
  }, [searchLocation])

  return (
    <Nav
    appName='Info Board Setup'
    top={
      <>
      </>
    }
  >
    <div className='bfl-grid my-grid-four' id='main'>
      <div className='bfc-base-3-bg bfl-padding'>
        <div className='center'>
          <h1 className='bf-h1' id='time'>{time}</h1>
          <h3 className="bf-h3" id='date'>{day} {dayNumber} {month} {year}</h3>
          <Checkbox type='switch' label='Cat mode' onChange={catModeChange} />
        </div>
        {weather && weatherDescription && <div className='weather-card'>
            <Card align='center' onClick={() => setWeatherModal(true)}>
              {catMode ? <Card.Image url={cat} aspectRatio='10/5'/> : <Card.Image url={intility} aspectRatio='10/5'/>}
              <Card.Logo icon={faCloud} />
              <Card.Title>{weather.properties.timeseries[0].data.instant.details.air_temperature} °C</Card.Title>
              <Card.Content>{weatherDescription}</Card.Content>
            </Card>
          </div>}
        <Modal
            center
            header='Værvarsel'
            isOpen={weatherModal}
            onRequestClose={() => setWeatherModal(false)}
        >
            <div className='bfl-autocol' id='weatherModal'>
                <div className='bfc-base-3-bg bfl-padding'>
                    Temperature in °C
                    <LineChart data={chartDataTemp} width={chartSize.width} height={chartSize.height}>
                        <Line type="monotone" dataKey="temp" stroke="#8884d8" />
                        <XAxis dataKey="name" />
                        <YAxis />
                    </LineChart>
                </div>
                <div className='bfc-base-3-bg bfl-padding'>
                    Humidity in %
                    <LineChart data={chartDataHumid} width={chartSize.width} height={chartSize.height}>
                        <Line type="monotone" dataKey="humid" stroke="#8884d8" />
                        <XAxis dataKey="name" />
                        <YAxis />
                    </LineChart>
                </div>
                <div className='bfc-base-3-bg bfl-padding'>
                    Windspeed in m/s
                    <LineChart data={chartDataWind} width={chartSize.width} height={chartSize.height}>
                        <Line type="monotone" dataKey="wind" stroke="#8884d8" />
                        <XAxis dataKey="name" />
                        <YAxis />
                    </LineChart>
                </div>
            </div>
        </Modal>
      </div>
      <div className='my-tall-element bfc-base-3-bg bfl-padding' id="departures">
        <Dropdown
            content={
                <Table noBorder>
                    <Table.Body>
                    {autofill && autofill.features.map((item, index) => {
                        return (
                            <Table.Row key={index} className="autofill-item" onClick={() => {
                                setSearchLocation(item.properties.label);
                                setStopID(item.properties.id);
                                setOpenAutofill(false);
                            }}>
                                <Table.Cell><Icon icon={faChevronRight} marginRight />{item.properties.label}</Table.Cell>
                            </Table.Row>
                        )
                    }
                    )}
                    </Table.Body>
                </Table>
            }
            visible={openAutofill}
            onClickOutside={() => setOpenAutofill(false)}
            variant='border'
        >
            <Input
                placeholder='Stop Place'
                label='search'
                id="searchStop"
                hideLabel
                clearable
                icon={faSearch}
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
                onFocus={() => setOpenAutofill(true)}
            />
        </Dropdown>
        {nextDepartures && stopSettings && <Accordion>
            <Accordion.Item title='Search settings'>
                <Select
                    label='Linje'
                    hideLabel
                    placeholder='Linje'
                    options={lineOptions}
                    onChange={e => setLineFilter(e.value)}
                />
            </Accordion.Item>
        </Accordion>}
        <Table id="departureTable">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Linje</Table.HeaderCell>
              <Table.HeaderCell>Destinasjon</Table.HeaderCell>
              <Table.HeaderCell>Avgang</Table.HeaderCell>
              <Table.HeaderCell>Forsinket</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {nextDepartures && nextDepartures.estimatedCalls.map((departure, index) => {
                if(lineFilter) {
                    if(lineFilter.split("/")[0] !== departure.serviceJourney.journeyPattern.line.id.split(":")[2]) {
                        return null;
                    } else if (lineFilter.split("/")[1] !== departure.destinationDisplay.frontText) {
                        return null;
                    }
                }

                let forsinket = false;
                let aimedTime = new Date(departure.aimedDepartureTime.substring(0, 16)).getTime();
                let expectedTime = new Date(departure.expectedDepartureTime.substring(0, 16)).getTime();
                if(aimedTime === expectedTime) {
                    forsinket = true;
                }
                return (
                    <Table.Row key={index}>
                        <Table.Cell>{departure.serviceJourney.journeyPattern.line.id.split(":")[2]} {departure.serviceJourney.journeyPattern.line.name}</Table.Cell>
                        <Table.Cell>{departure.destinationDisplay.frontText}</Table.Cell>
                        <Table.Cell>{departure.expectedDepartureTime.substring(11, 16)}</Table.Cell>
                        {forsinket ? <Table.Cell><Icon icon={faCheck} /></Table.Cell> : <Table.Cell></Table.Cell>}
                    </Table.Row>
                )
            })}
          </Table.Body>
        </Table>
      </div>
      <div className='bfc-base-3-bg bfl-padding'>
        <h1 className='bf-h1'>Oslo Sykkel</h1>
        {cycle ? <Table>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Lokasjon</Table.HeaderCell>
                    <Table.HeaderCell>Ledige plasser</Table.HeaderCell>
                    <Table.HeaderCell>Ledige Sykkler</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    <Table.Cell>Kværnerveien</Table.Cell>
                    <Table.Cell>{cycle.data.stations.find(item => item.station_id === "1919").num_docks_available}</Table.Cell>
                    <Table.Cell>{cycle.data.stations.find(item => item.station_id === "1919").num_bikes_available}</Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.Cell>Intility Hovedkontor</Table.Cell>
                    <Table.Cell>{cycle.data.stations.find(item => item.station_id === "737").num_docks_available}</Table.Cell>
                    <Table.Cell>{cycle.data.stations.find(item => item.station_id === "737").num_bikes_available}</Table.Cell>
                </Table.Row>
            </Table.Body>
        </Table> : <h4 className="bf-h4">Ute av Drift intil videre... :(</h4>}
      </div>
    </div>
  </Nav>
  );
}

export default App;