# The MCU Index

<img src="media/og-image.png" width="480">

The MCU Index (MCUi for short) is a single-page static website that I designed as a pet project to teach myself React, the popular UI library from Facebook. It's a simple tool to look up actors who have appeared in the Marvel Cinematic Universe, by name. Due to API limitations, it doesn't work very well for the TV shows, sadly. Only major characters show up for these properties.

### **[Visit MCUi](http://antrikshy.com/The-MCU-Index/)**

## Design

MCUi is built using React. I supercharged the search box using Typeahead from Twitter. I have wanted to find an excuse to play around with [Typeahead](https://twitter.github.io/typeahead.js/examples/) for months now. It's a very flexible front-end library to help create auto-fill suggestions for input fields.

The website is powered by [The Movie Database](https://www.themoviedb.org)'s free API. While it's great for movies, it unfortunately does not track all cast from TV episodes. Only major characters are listed, and I even had to manually iterate over all past seasons and request cast members for each one.

MCUi is desiged such that it only requires me to update one file (`data.js`) when new Marvel Cinematic Universe peoperties are released (with their unique IDs in TMDb). Other than that, everything else (API calls etc.) is handled programatically on page load.

For an added challenge and simplicity, I did not use any other UI layout frameworks in MCUi.

## Contribute

Pull requests are greatly appreciated.

I'm new to React, so I may be reinventing wheels and not following best practices everywhere. Cleanup would be nice.

Feel free to find and fix any UI issues. Additionally, I feel there is a lot of room for improvement in the efficiency department. If you want to try and reduce the number of API calls or any needless recalculations that I make, go for it! There are a lot of independent moving parts in here.

If you wish to contact me with questions about this project, tweet to me [@Antrikshy](http://twitter.com/Antrikshy) or message [u/Antrikshy](http://reddit.com/u/Antrikshy) on reddit.
