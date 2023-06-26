const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
  userName: {
      type: String,
      required: true,
      unique: true
  },
  password: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: false,
    unique: true
  },
  lastName: {
    type: String,
    required: false,
    unique: true
  },
  role: {
    type: String,
    required: false,
    unique: true
  },
  favourites: [String],
  history: [String]
});

const movieSchema = new Schema({
  plot: String,
  genres: [String],
  runtime: Number,
  cast: [String],
  num_mflix_comments: Number,
  poster: String,
  title: String,
  fullplot: String,
  languages: [String],
  released: Date,
  directors: [String],
  rated: String,
  awards: {
    wins: Number,
    nominations: Number,
    text: String
  },
  lastupdated: Date,
  year: Number,
  imdb: {
    rating: Number,
    votes: Number,
    id: Number
  },
  countries: [String],
  type: String,
  tomatoes: {
    viewer: {
      rating: Number,
      numReviews: Number,
      meter: Number
    },
    dvd: Date,
    lastUpdated: Date
  }
});

module.exports = class MoviesDB {
  constructor() {
    this.Movie = null;
    this.User = null;
  }

  // Pass the connection string to `initialize()`
  initialize(connectionString) {
    return new Promise((resolve, reject) => {
      const db = mongoose.createConnection(
        connectionString,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      );

      db.once('error', (err) => {
        reject(err);
      });

      db.once('open', () => {
        this.Movie = db.model("movies", movieSchema);
        this.User = db.model("users", userSchema);
        resolve();
      });
    });
  }

  //Test users Model
  async getUserById(userData) {
    try {
      const user = await this.User.findOne({ userName: userData.userName })
      .exec();
      return user;
    } catch (err) {
      console.log("Unable to find user " + userData.userName);
      return null;
    }
  }
  
  // Register Function
  async registerUser(userData) {
    try {
      if (userData.password != userData.password2) {
        reject("Passwords do not match");
      } 
      else {
        const saltRounds = 10;
        let newUser = this.User(userData);
        bcrypt.hash(userData.password, saltRounds, async function(err, hash) {
          newUser.password = hash;          
          await newUser.save().then(() => {
            console.log("User " + userData.userName + " successfully registered");
          }).catch(err => {
            console.log(err);
            // if (err.code == 11000) {
            //     reject("User Name already taken");
            // } else {
            //     reject("There was an error creating the user: " + err);
            // }
          })
        })
      }
    }
    catch(err) {
      console.log(err);
    }
  }

  async addNewMovie(data) {
    const newMovie = new this.Movie(data);
    await newMovie.save();
    return newMovie;
  }

  async getAllMovies(page, perPage, title) {
    let findBy = title ? { title: { $regex: new RegExp(title, 'gi') } } : {};
    if (+page && +perPage) {
      const [pageData, total] = await Promise.all([
        this.Movie.find(findBy).sort({ year: +1 }).skip((page - 1) * +perPage).limit(+perPage).exec(),
        this.Movie.countDocuments(findBy),
      ]);
      return { pageData, total };
    }
    return Promise.reject(new Error('page and perPage query parameters must be valid numbers'));
  }

  // Get Movies from Advanced Search 
  async getSearchedMovies(query) {
    const {page} = query;
    const {perPage} = query;
    delete query.page;
    delete query.perPage;
    let finalQuery = {};
    finalQuery = this.searchQueryGen(query,finalQuery);

    const [pageData, total] = await Promise.all([
      this.Movie.find(finalQuery).sort({ year: +1 }).skip((page - 1) * +perPage).limit(+perPage).exec(),
      this.Movie.countDocuments(finalQuery),
    ]);

    return { pageData, total };
  }

  searchQueryGen(query,finalQuery) {
    for(const props in query) {
      if(props === "genre") {
        query[props] = query[props].split(',');
        finalQuery.genres = query[props];
      } else if(props === "runTimeFrom" || props === "fromRate") {
        query[props] = query[props] * 1;
        query[props] = {$gte : query[props]};
        if(props === "runTimeFrom") {
          finalQuery.runtime = query[props];
        } 
        else if(props === "fromRate") {
          let keyName = "imdb.rating"; 
          finalQuery[keyName] = query[props];
        }
      } else if(props === "runTimeTo" || props === "toRate") {
        query[props] = query[props] * 1;
        query[props] = {$lte : query[props]};
        if(props === "runTimeTo") {
          Object.assign(finalQuery.runtime, query[props]);
        } 
        else if(props === "toRate") {
          let keyName = "imdb.rating"; 
          Object.assign(finalQuery[keyName], query[props]);         
        }
      } else if(typeof query[props] === "string" && !props.includes("Date")) {
        query[props] = { $regex: new RegExp(query[props], 'i') };
        finalQuery[`${props}`] = query[props];
      } else {
        query[props] = new Date(query[props]).toISOString();
        if(props === "fromDate") {
          query[props] = {$gte : (query[props])}
          finalQuery.released = query[props];
        } else {
          query[props] = {$lte : (query[props])}
          Object.assign(finalQuery.released, query[props]);
        }
      }
    }
    return finalQuery;
  }
  
  regexGenerator(str) {
    return str ? { str: { $regex: new RegExp(str, 'gi') } } : {};
  }

  getMovieById(id) {
    return this.Movie.findOne({ _id: id }).exec();
  }

  updateMovieById(data, id) {
    return this.Movie.updateOne({ _id: id }, { $set: data }).exec();
  }

  deleteMovieById(id) {
    return this.Movie.deleteOne({ _id: id }).exec();
  }
}
