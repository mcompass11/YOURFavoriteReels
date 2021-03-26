const express = require('express');
    morgan = require('morgan');

const app = express();

let topMovies = [
    {
        title: 'Anchorman',
        genre: 'comedy'
    },
    {
        title: 'The Dark Knight',
        genre: 'action'
    },
    {
        title: 'The Avengers: Infinity War',
        genre: 'action'
    },
    {
        title: 'The Bourne Identity',
        genre: 'action'
    },
    {
        title: 'The Bourne Supremacy',
        genre: 'action'
    },
    {
        title: 'The Bourne Ultimatum',
        genre: 'action'
    },
    {
        title: 'Coming to America',
        genre: 'action'
    },
    {
        title: 'Casino Royale',
        genre: 'action'
    },
    {
        title: 'Bowfinger',
        genre: 'comedy'
    },
    {
        title: 'Avatar',
        genre: 'sci-fi'
    }
];

app.use(morgan('common'));

app.use(express.static('public'));

//GET requests
app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/', (req, res) => {
    res.send('Welcome to movie gallery!');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Oops! Something apparently broke...');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});