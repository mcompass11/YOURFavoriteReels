import { Schema, model } from 'mongoose';

import { hashSync, compareSync } from 'bcrypt';

let movieSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, require: true},
    Genre: {
        Name: String,
        Description: String
    },
    Director: {
        Name: String,
        Bio: String
    },
    Actors: [String],
    ImagePath: String,
    Featured: Boolean
});

let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    FavoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

userSchema.statics.hashPassword = (password) => {
    return hashSync(password, 10);
};

userSchema.methods.validatePassword = function(password) {
    return compareSync(password, this.Password);
};

let Movie = model('Movie', movieSchema);
let User = model('User', userSchema);

const _Movie = Movie;
export { _Movie as Movie };
const _User = User;
export { _User as User };