/* eslint no-console:0 */
const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2.json');
const Halyard = require('halyard.js');
const mixins = require('halyard.js/dist/halyard-enigma-mixin');

const app = require('express')();
const http = require('http').Server(app);
const noCache = require('connect-nocache')();
const io = require('socket.io')(http);
const socketio_port = '44444';


(async () => {
  try {
    console.log('Creating Halyard table data representation.');
    const halyard = new Halyard();
    const moviesPath = '/data/movies.csv';
    const moviesTable = new Halyard.Table(moviesPath, {
      name: 'Movies',
      delimiter: ',',
    });

    halyard.addTable(moviesTable);

    console.log('Opening session app on engine using Halyard mixin.');
    const session = enigma.create({
      schema,
      mixins,
      url: 'ws://localhost:19076',
      createSocket: (url) => new WebSocket(url),
    });
    const qix = await session.open();
    const app = await qix.createSessionAppUsingHalyard(halyard);

    // console.log('Creating session object with movie titles.');
    // const moviesCount = 10;
    // const properties = {
    //   qInfo: { qType: 'hello-data' },
    //   qHyperCubeDef: {
    //     qDimensions: [{ qDef: { qFieldDefs: ['Movie'] } }],
    //     qInitialDataFetch: [{ qHeight: moviesCount, qWidth: 1 }],
    //   },
    // };
    // const object = await app.createSessionObject(properties);
    // const layout = await object.getLayout();
    // const movies = layout.qHyperCube.qDataPages[0].qMatrix;

    // console.log(`Listing the ${moviesCount} first movies:`);
    // movies.forEach((movie) => { console.log(movie[0].qText); });

    console.log('Creating session object with movie stats.');
    const moviesCount = 50;
    const properties = {
      qInfo: { qType: 'hello-data' },
      qHyperCubeDef: {
        qMeasures: [{
          qDef: {
            qDef: 'avg(Year)',
            qLabel: 'Average year',
          },
          qSortBy: {
            qSortByNumeric: -1,
          },
        },{
          qDef: {
            qDef: 'min(Year)',
            qLabel: 'Min year',
          },
          qSortBy: {
            qSortByNumeric: -1,
          },
        },{
          qDef: {
            qDef: 'max(Year)',
            qLabel: 'Max year',
          },
          qSortBy: {
            qSortByNumeric: -1,
          },
        },{
          qDef: {
            qDef: 'stdev(Year)',
            qLabel: 'Standard Deviation for year',
          },
          qSortBy: {
            qSortByNumeric: -1,
          },
        }],
        qInitialDataFetch: [{ qHeight: moviesCount, qWidth: 4 }],
      },
    };
    const object = await app.createSessionObject(properties);
    const layout = await object.getLayout();
    const movies = layout.qHyperCube.qDataPages[0].qMatrix;

    console.log('Listing movie stats:');
    avg = movies[0][0].qNum;
    min = movies[0][1].qNum;
    max = movies[0][2].qNum;
    stdev = movies[0][3].qNum;

    console.log('avg', avg);
    console.log('min', min);
    console.log('max', max);
    console.log('stdev', stdev);

    testYear = 2950;

    //Express Web Endpoints / REST API's
    http.listen(socketio_port, function(){
      console.log('listening on *:'+socketio_port);
    });

    io.on('connection', function(socket){
      console.log('got a connection');

      socket.on('sensoremit', function(data, callback) {
        testYear = data.readvalue * 500;
        console.log("sensor data", testYear);

        // TEST data for alerts //
        if(testYear < min) {
          console.log('ALERT: ' + testYear + ' is below threshold');
        }
        if(testYear < avg-stdev || testYear > (avg+stdev)) {
          console.log('WARNING: ' + testYear + ' is beyond normal range');
        }
        if(testYear > max) {
          console.log('ALERT: ' + testYear + ' is above threshold');
        }

      });

    });


    // await session.close();
    // console.log('Session closed.');
  } catch (err) {
    console.log('Whoops! An error occurred.', err);
    process.exit(1);
  }
})();
