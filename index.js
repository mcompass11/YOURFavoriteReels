const express = require('express'),
    morgan = require('morgan'),
    bodyParser =require('body-parser'),
    uuid = require('uuid');

const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
// const Genres = Models.Genre;
// const Directors = Models.Director;

app.use(bodyParser.json());

app.use(morgan('common'));

app.use(express.static('public'));


app.get('/', (req, res) => {
    res.send('Welcome to movie gallery!');
}); //default opening page

app.get('/movies', (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' +err);
        });
}); //returns all movies list

app.get('/movies/:Title', (req, res) => {
    Movies.findOne({ Title: req.params.Title})
    .then((movie) => {
        res.json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' +err);
    });
}); //return info for specific movie

app.get('/genre/:Name', (req, res) => {
    Movies.findOne({'Genre.Name': req.params.Name})
    .then((movies) => {
        res.json(movies.Genre);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
}); //returns data on genre by name

app.get('/director/:Name', (req, res) => {
    Movies.findOne({'Director.Name': req.params.Name})
    .then((director) => {
        res.json(director.Director);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
}); //returns data on director by name

app.get('/users', function (req, res) {
    Users.find()
        .then(function (users) {
            res.status(201).json(users);
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
}); //returns list of users

app.post('/users', (req, res) => {
    Users.findOne({ Username: req.body.Username}) //searches for existing username
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
            Users.create({
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user) => {
                res.status(201).json(user);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
        }
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
}); //allows new users to register

app.put('/users/:Username', (req, res) => {
    Users.findOneAndUpdate(
        {Username: req.params.Username},
        {
            $set: {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birth: req.body.Birth,
            },
        },
        {new: true}, //Makes sure that the updated doc is new
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' +err);
            } else {
                res.json(updatedUser);
            }
        });
}); //allows users to update their user info

app.put('/users/:Username/Movies/:MovieID', (req, res) => {
    Users.findOneAndUpdate(
        {Username: req.params.Username},
        {
            $addToSet: {FavoriteMovies: req.params.MovieID},
        },
        {new:true},
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
}); //allows user to add a movie to their list

app.delete('/users/:Username/Movies/:MovieID', (req, res) => {
    Users.findOneAndUpdate(
        {Username: req.params.Username},
        {
            $pull: {FavoriteMovies: req.params.MovieID},
        },
        {new:true},
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
}); //allows user to remove movie from their list

app.delete('/users/:Username', (req, res) => {
    Users.findOneAndRemove({Username: req.params.Username})
    .then((user) => {
        if (!user) {
            res.status(400).send(req.params.Username + 'was not found');
        } else {
            res.status(200).send(req.params.Username + 'was deleted.');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
}); //allows user to deregister

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Oops! Something apparently broke...');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});