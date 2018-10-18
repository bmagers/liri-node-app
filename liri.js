require("dotenv").config();
var fs = require("fs");
var keys = require("./keys.js");
var Spotify = require("node-spotify-api");
var request = require("request");
var moment = require("moment");
var inquirer = require("inquirer");
var spotify = new Spotify(keys.spotify);

function band(lookup) {
  request("https://rest.bandsintown.com/artists/" + lookup + "/events?app_id=" + keys.bandsintown, function(error, response, body) {
    if (error) {
      console.log("Error: " + error);
    } else {
      var results = JSON.parse(body);
      var tourInfo = "\nTour dates: \n";
      results.forEach(item => {
        tourInfo += "\nVenue: " + item.venue.name + "\n";
        var location = item.venue.city + ", ";
        location += (item.venue.country === "United States") ? item.venue.region : item.venue.country;
        tourInfo += "Location: " + location + "\n";
        tourInfo += "Date: " + moment(item.datetime).format("MM/DD/YYYY") + "\n";
      })
      write(tourInfo);
    }
  });
}

function song(lookup) {
  lookup = lookup ? lookup : "The Sign Ace of Base";
  spotify.search({type: "track", query: lookup}, function(error, data) {
    if (error) {
      console.log("Error: " + error);
    } else {
      var results = data.tracks.items;
      var songInfo = "";
      results.forEach(item => {
        var artists = [];
        item.artists.forEach(artist => {
          artists.push(artist.name);
        });
        songInfo += "\nArtist: " + artists.join(", ") + "\n";
        songInfo += "Album: " + item.album.name + "\n";
        songInfo += "Song: " + item.name + "\n";
        var preview = item.preview_url;
        songInfo += preview ? "Preview at: " + preview + "\n" : "";
      });
      write(songInfo);
    }
  });
}

function movie(lookup) {
  lookup = lookup ? lookup : "Mr. Nobody";
  request("https://www.omdbapi.com/?apikey=trilogy&t=" + lookup, function(error, response, body) {
    if (error) {
      console.log("Error: " + error);
    } else {
      var results = JSON.parse(body);
      var movieInfo = "\nTitle: " + results.Title + "\n\n";
      movieInfo += "Year: " + results.Year + "\n\n";
      var IMDB = results.Ratings.find((element) => element.Source === "Internet Movie Database");
      var rottenTomatoes = results.Ratings.find((element) => element.Source === "Rotten Tomatoes");
      movieInfo += IMDB ? "IMDB Rating: " + IMDB.Value + "\n\n" : "";
      movieInfo += rottenTomatoes ? "Rotten Tomatoes Rating: " + rottenTomatoes.Value + "\n\n" : "";
      movieInfo += "Country: " + results.Country + "\n\n";
      movieInfo += "Language: " + results.Language + "\n\n";
      movieInfo += "Plot: " + results.Plot + "\n\n";
      movieInfo += "Actors: " + results.Actors + "\n";
      write(movieInfo);
    }
  });
}

function doWhatItSays() {
  fs.readFile("random.txt", "utf8", function(error, data) {
    if (error) {
      console.log("Error: " + error);
    } else {
      var results = data.split(",");
      switch (results[0]) {
        case "concert-this":
          band(results[1]);
          break;
        case "spotify-this-song":
          song(results[1]);
          break;
        case "movie-this":
          movie(results[1]);
      }
    }
  });
}

function write(data) {
  fs.appendFile("log.txt", "----------" + data, function (error) {
    if (error) {
      console.log("Error: " + error);
    } else {
      console.log(data);
    }
  });
}

inquirer.prompt([
  {
    type: "list",
    message: "What would you like?",
    choices: ["Tour dates for a band", "Information on a song", "Information on a movie", "Do what it says"],
    name: "choice"
  },
]).then(function(user) {
  var followUpQuestion = "";
  switch (user.choice) {
    case "Tour dates for a band":
      followUpQuestion = "band";
      break;
    case "Information on a song":
      followUpQuestion = "song";
      break;
    case "Information on a movie":
      followUpQuestion = "movie";
      break;
    case "Do what it says":
      doWhatItSays();
  }
  if (followUpQuestion) {
    inquirer.prompt([
      {
        message: "What " + followUpQuestion + " shall I look up?",
        name: "followUp"
      }
    ]).then(function(user) {
      switch (followUpQuestion) {
        case "band":
          band(user.followUp);
          break;
        case "song":
          song(user.followUp);
          break;
        case "movie":      
          movie(user.followUp);
      }
    });
  }
});