const express = require('express');
const morgan = require('morgan');
const bodyParser =require('body-parser');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));


const { check, validationResult } = require('express-validator');

const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'https://heroku.com', 'https://mcompass11.github.io'];

app.use(cors({
    origin: (origin, callback) => {
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        //if a specific origin isn't found on the list
        let message = 'The CORS policy for this application doesn\'t allow access from origin ' + origin;
        return callback(new Error(message ), false);
      }
      return callback(null, true);
    }
  }));

// app.use(cors({
//   origin: '*'
// }
// ));

require('./auth.js')(app);

const passport = require('passport');
require('./passport.js');

const Models = require('./models');
const Movies = Models.Movie;
const Users = Models.User;

app.use(morgan('common'));

app.use(express.static('public'));

// mongoose.connect('mongodb+srv://mcompass11:March_22_2023@monkendrickdb.vsqnr.mongodb.net/?retryWrites=true&w=majority',
//   { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB: ', err));


/**
 * default welcome page
 * @method GET
 * @returns {string}
 */
app.get('/', (req, res) => {
    res.send('Welcome to movie gallery!');
});

/**
 * returns all movies
 * @method GET
 * @param {string} endpoint - endpoint url/movies
 * @requires authentication JWT
 */
app.get('/movies', passport.authenticate('jwt', {session: false}),  (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' +err);
        });
});

/**
 * Gets the info for a specific movie
 * @method GET
 * @param {string} endpoint - endpoint url/movies/:Title
 * @requires authentication JWT
 */
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
});

/**
 * returns genre of the movie by name
 * @method GET
 * @param {string} endpoint - endpoint url/genre/:Name
 * @requires authentication JWT
 */
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
});

/**
 * returns director of the movie by name
 * @method GET
 * @param {string} endpoint - endpoint url/director/:Name
 * @requires authentication JWT
 */
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
});

/**
 * returns list of users
 * @method GET
 * @param {string} endpoint - endpoint url/users
 */
app.get('/users', /*passport.authenticate('jwt', {session: false}),*/ (req, res) => {
  Users.find()
      .then((users) => {
          res.status(201).json(users);
      })
      .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
      });
});


/**
 * returns single user
 * @method GET
 * @param {string} endpoint - endpoint url/users/:Username
 */
app.get('/users/:Username', /*passport.authenticate('jwt', {session: false}),*/ (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.status(201).json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
 });


/**
 * allows new users to register
 * @method POST
 * @param {string} endpoint - endpoint url/users
 * @param {string} Username - chosen by user
 * @param {string} Password - user password
 * @param {string} Email - user email address
 * @param {string} Birthday - user birthday
 * @returns {object} -new user
 */
app.post('/users', [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
],async (req, res) => {
    //added some validation logic
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username}) //searches for existing username
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
});


/**
 * allows user to update their user info
 * @method PUT
 * @param {string} endpoint - endpoint url/users/:Username
 * @param {string} Username - required
 * @param {string} Password - user new password
 * @param {string} Email - user new email address
 * @param {string} Birthday - user new birthday
 * @returns {string} return a success/error message
 * @requires authentication JWT
 */
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
});


/**
 * allows user to add a movie to their list
 * @method POST
 * @param {string} endpoint - endpoint url/users/:Username/movies/:MovieID
 * @param {string} Title, Username - both required
 * @returns {string} - returns success/error message
 * @requires authentication JWT
 */
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
});


/**
 * allows user to remove movie from their list
 * @method DELETE
 * @param {string} endpoint - endpoint url/users/:Username/movies/:MovieID
 * @param {string} Title, Username - both required
 * @returns {string} - returns success/error message
 * @requires authentication JWT
 */
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
});


/**
 * allows user to deregister
 * @method DELETE 
 * @param {string} endpoint - endpoint url/users/:Username
 * @param {string} Title, Username - both required
 * @returns {string} - returns success/error message
 * @requires authentication JWT
 */
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
});

//error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Oops! Something apparently broke...');
});

//listens for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0' , () => {
    console.log('Listening on Port ' + port);
});