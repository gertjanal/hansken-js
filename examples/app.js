'use strict';

const express = require('express');
const _ = require('lodash');

const app = express();
app.use(express.json());
const port = 3000;

// Mocks
const searchResultMock = require('./mocks/searchResult.json');
const traceResultMock = require('./mocks/traceResult.json');
const traceMock = require('./mocks/trace.json');

// Static directories
const path = require('path');
app.use('/', express.static(path.join(__dirname, '/')));
app.use('/src', express.static(path.join(__dirname, '../src')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

app.get('/gatekeeper/projects', (request, response) => {
    response.json(require('./mocks/projects.json'));
});

app.get('/gatekeeper/tools', (request, response) => {
    response.json(require('./mocks/tools.json'));
});

app.get('/gatekeeper/tracemodel', (request, response) => {
    response.json(require('./mocks/traceModel.json'));
});

app.get('/gatekeeper/projects/de554b81-e4a3-4759-96ec-0abf942be72c/images', (request, response) => {
    response.json(require('./mocks/projectImagesColdCase.json'));
});

app.post('/gatekeeper/projects/de554b81-e4a3-4759-96ec-0abf942be72c/traces/search', (request, response) => {
    const count = _.get(request.body, 'count', 10);

    const searchResult = {...searchResultMock};
    searchResult.traces = [];

    for (let i = 0; i < count; i++) {
        const trace = {...traceMock};
        trace.id = trace.id + '-' + i.toString(16);
        trace.uid = trace.uid + '-' + i.toString(16);

        let traceResult = {...traceResultMock};

        traceResult.trace = trace;
        traceResult.score = Math.random();
        traceResult.project = 'de554b81-e4a3-4759-96ec-0abf942be72c';

        searchResult.traces.push(traceResult);
    }

    response.json(searchResult);
});

app.get('/gatekeeper/projects/de554b81-e4a3-4759-96ec-0abf942be72c/traces/1a85b2d2-972a-4131-86f7-f55b61b19158:0-0-10-3/data', (request, response) => {
    response.send(`This is the data stream for ${request.query.dataType || 'raw'}`);
});

app.put('/gatekeeper/projects/de554b81-e4a3-4759-96ec-0abf942be72c/traces/1a85b2d2-972a-4131-86f7-f55b61b19158:0-0-10-3/tags/hello', (request, response) => {
    response.send();
});

app.delete('/gatekeeper/projects/de554b81-e4a3-4759-96ec-0abf942be72c/traces/1a85b2d2-972a-4131-86f7-f55b61b19158:0-0-10-3/tags/world', (request, response) => {
    response.send();
});

app.get('/gatekeeper/session/whoami', (request, response) => {
    response.json(require('./mocks/whoami.json'));
});

app.get('/keystore/session/whoami', (request, response) => {
    response.json(require('./mocks/whoami.json'));
});

app.get('/keystore/entries/1a85b2d2-972a-4131-86f7-f55b61b19158/user@keycloak.dev.local', (request, response) => {
    response.set('Content-Type', 'text/plain');
    response.send('uiv9w4KbgXE1SnYRMhvuI0q3nxRyxG2pwz/12tbJeno=');
});

app.listen(port, () => {
    console.log(`Example server started at http://localhost:${port}`);
});
