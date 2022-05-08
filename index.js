const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const bodyParser =require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();

app.use(bodyParser.json());
// app.use(express.json());
app.use(express.urlencoded({extended: true}));

const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

//let allowedOrigins = ['http://localhost:1234', 'https://yourfavoritereels.herokuapp.com/', 'http://localhost:8080', 'http://localhost:4200'];

app.use(cors({
  origin: '*'
}
//   {
//     origin: (origin, callback) => {
//         if(!origin) return callback(null, true);
//         if(allowedOrigins.indexOf(origin) === -1){
//             //if origin isn't on listdisplays the following
//             let message = "The CORS policy for this application doesn't allow access from origin " + origin;

//             return callback(new Error(message), false);
//         }
//         return callback(null, true);
//     }
// }
));

require('./auth.js')(app);

const passport = require('passport');
require('./passport.js');

const { check, validationResult } = require('express-validator');

app.use(morgan('common'));

app.use(express.static('public'));

//mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true});


app.get('/', (req, res) => {
    res.send('Welcome to movie gallery!');
}); //default opening page

app.get('/movies', passport.authenticate('jwt', {session: false}),  (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' +err);
        });
}); //returns all movies list

app.get('/movies/:Title', passport.authenticate('jwt', {
    session: false}), (req, res) => {
    Movies.findOne({ Title: req.params.Title})
    .then((movie) => {
        res.json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' +err);
    });
}); //return info for specific movie

app.get('/genre/:Name', passport.authenticate('jwt', {
    session: false}), (req, res) => {
    Movies.findOne({'Genre.Name': req.params.Name})
    .then((movies) => {
        res.json(movies.Genre);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
}); //returns data on genre by name

app.get('/director/:Name', passport.authenticate('jwt', {
    session: false}), (req, res) => {
    Movies.findOne({'Director.Name': req.params.Name})
    .then((director) => {
        res.json(director.Director);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
}); //returns data on director by name

app.get('/users', /*passport.authenticate('jwt', {session: false}),*/ (req, res) => {
  Users.find()
      .then((users) => {
          res.status(201).json(users);
      })
      .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
      });
}); //returns list of users

app.get('/users/:Username', /*passport.authenticate('jwt', {session: false}),*/ (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.status(201).json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
 }); //returns user

app.post('/users', [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], //added some validation logic
  /*passport.authenticate('jwt', {session: false}),*/ (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username}) //searches for existing username
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + ' already exists');
            } else {
                Users.create({
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user) => {res.status(201).json(user) })
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

app.put('/users/:Username',
[
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], //added some validation logic
 passport.authenticate('jwt', {
    session: false}), (req, res) => {
        let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    Users.findOneAndUpdate(
        {Username: req.params.Username},
        {
            $set: {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday,
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

app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {
    session: false}), (req, res) => {
    Users.findOneAndUpdate(
        {Username: req.params.Username},
        {
            $push: {FavoriteMovies: req.params.MovieID},
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

app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {
    session: false}), (req, res) => {
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

app.delete('/users/:Username', passport.authenticate('jwt', {
    session: false}), (req, res) => {
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

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0' , () => {
    console.log('Listening on Port ' + port);
});

// mongoimport --uri mongodb+srv://mcompass11:Sept_01_2020@monkendrickdb.vsqnr.mongodb.net/MonkendrickDB --collection movies --type json --file movies.json
// mongoimport --uri mongodb+srv://mcompass11:Sept_01_2020@monkendrickdb.vsqnr.mongodb.net/MonkendrickDB --collection users --type json --file users.json

// mongo "mongodb+srv://monkendrickdb.vsqnr.mongodb.net/MonkendrickDB" --username mcompass11