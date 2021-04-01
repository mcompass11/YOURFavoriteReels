const express = require('express'),
    morgan = require('morgan'),
    bodyParser =require('body-parser'),
    uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

app.use(morgan('common'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Welcome to movie gallery!');
});

app.get('/movies', (req, res) => {
    res.json('Gets a list of all movies');
});

app.get('/movies/name', (req, res) => {
    res.json('Gets data about movie');
});

app.get('/genres', (req, res) => {
    res.json('Gets data on genre');
});

app.get('/directors', (req, res) => {
    res.json('Gets data on director by name');
});

app.post('/users', (req, res) => {
    res.send('Allows new users to register');
});

app.put('/users/profile', (req, res) => {
    res.send('Allow users to update their info');
});

app.post('/users/movies', (req, res) => {
    res.send('Allow useers to add movie to their list');
});

app.delete('/users/movies', (req, res) => {
    res.send('Allows users to remove movie from their list');
});

app.delete('/users', (req, res) => {
    res.send('Allows user to deregister their account');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Oops! Something apparently broke...');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});