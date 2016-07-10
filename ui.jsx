var App = React.createClass({
    getInitialState: function() {
        return {
            "bioActive": false,
            "bioPersonData": null,
            "bioPersonImageUrl": null
        };
    },

    generateFilmographyRequest: function(personId) {
        return "http://api.themoviedb.org/3/person/" + personId + "/combined_credits?api_key=" + TMDbAPIKey;
    },

    generateProfilePictureRequest: function(personId) {
        return "http://api.themoviedb.org/3/person/" + personId + "/images?api_key=" + TMDbAPIKey;
    },

    // Handles searching for appearances outside the MCU
    // Ideally should be in search, but this is a slightly hacky way to let
    // it bubble view changes to results viewing section of the UI
    handleSearchResult: function(bioPersonData) {
        var otherAppearances = [];
        var appearances = bioPersonData["appearances"];

        $.ajax({
            type: 'get',
            url: this.generateFilmographyRequest(bioPersonData.personId),
            async: false,
            success: function(data) {
                for (var i = 0; i < data.cast.length; i++) {
                    var castObj = data.cast[i];
                    // Weed out weird listings
                    if (castObj.character.length == 0 || (castObj.original_title || castObj.original_name).length == 0) continue;
                    // Weed out MCU appearances (lazily)
                    if (appearances.filter(function(a){ return a["characterName"] == castObj.character }).length > 0) continue;
                    // Create non-MCU appearance object
                    var appearance = {
                                      "mediaTitle": (castObj.original_title || castObj.original_name),
                                      "characterName": castObj.character,
                                      "mediaType": castObj.media_type
                                     }
                    otherAppearances.push(appearance);
                    if (i >= 20) break;
                }
            }
        });

        bioPersonData.filmography = otherAppearances;

        var bioPersonImageUrl;
        $.ajax({
            type: 'get',
            url: this.generateProfilePictureRequest(bioPersonData.personId),
            async: false,
            success: function(data) {
                // For some reason, many profile photos indexed 2 seemed to be flattering and new
                // Sometimes it doesn't exist, so I fall back on 0
                // Just... don't ask questions and move on
                bioPersonImageUrl = "http://image.tmdb.org/t/p/original" + (data.profiles[2] || data.profiles[0]).file_path;
            }
        });

        // It's time to display results
        this.setState({
            "bioActive": true,
            "bioPersonData": bioPersonData,
            "bioPersonImageUrl": bioPersonImageUrl
        });
    },

    render: function() {
        var headerHeight = (this.state.bioActive) ? "small" : "large"
        return (
            <div>
                <Header appState={this.state} handleSearchResult={this.handleSearchResult} height={headerHeight} />
                <Bio appState={this.state} />
            </div>
        );
    }
});

var Header = React.createClass({
    componentDidUpdate: function(prevProps) {
        if (prevProps.height == "large" && this.props.height == "small") {
            $(this.refs.header).animate({
                "height": "15rem",
                "padding-top": "1rem"
            });
        }
        else if (prevProps.height == "small" && this.props.height == "large") {
            $(this.refs.header).animate({
                "height": "20rem",
                "padding-top": "10rem"
            });
        }
    },

    render: function() {
        return (
            <div ref="header" className="header">
                <h1 className="brand-title">The MCU Index&nbsp;&nbsp;<img className="brand-logo" src="media/logo.png"></img></h1>
                <SearchBox handleSearchResult={this.props.handleSearchResult} />
                <svg className="slanter" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="0,100  100,100  200,0" />
                </svg>
            </div>
        );
    }
});

var SearchBox = React.createClass({
    generateMovieCreditsRequest: function(mediaId) {
        return "http://api.themoviedb.org/3/movie/" + mediaId + "/credits?api_key=" + TMDbAPIKey;
    },

    generateTvDetailsRequest: function(mediaId) {
        return "http://api.themoviedb.org/3/tv/" + mediaId + "?api_key=" + TMDbAPIKey;
    },

    generateSeasonCreditsRequest: function(mediaId, seasonNum) {
        return "http://api.themoviedb.org/3/tv/" + mediaId + "/season/" + seasonNum + "/credits?api_key=" + TMDbAPIKey;
    },

    processCast: function(mediaDbItem, castDb, personIdToName, seasonNum = null) {
        $.ajax({
            type: 'get',
            url: (!seasonNum) ? 
                this.generateMovieCreditsRequest(mediaDbItem.id) :
                this.generateSeasonCreditsRequest(mediaDbItem.id, seasonNum),
            async: false,
            success: function(data) {
                for (var i = 0; i < data.cast.length; i++) {
                    var castObj = data.cast[i];
                    var appearance = {
                                      "mediaId": mediaDbItem.id,
                                      "mediaType": mediaDbItem.type,
                                      "mediaTitle": mediaDbItem.title,
                                      "characterName": castObj.character
                                     }
                    if (seasonNum) {
                        appearance["mediaTitle"] += " (Season " + seasonNum + ")";
                    }
                    personIdToName[castObj.id] = castObj.name;            
                    if (castDb[castObj.id] == undefined) {
                        castDb[castObj.id] = [appearance];
                    }
                    else {
                        castDb[castObj.id].push(appearance);
                    }
                }
            }
        });

        return {"castDb": castDb, "personIdToName": personIdToName};
    },

    getNumberOfSeasons: function(mediaId) {
        var numOfSeasons = 0;

        $.ajax({
                type: 'get',
                url: this.generateTvDetailsRequest(mediaId), 
                async: false,
                success: function(data) {
                    numOfSeasons = data.number_of_seasons;
                }
            }
        );

        return numOfSeasons;
    },

    // Ideally called once, on page load, generates internal index of MCU appearances
    generateCastDb: function() {
        var castDb = [];
        var personIdToName = {};

        // If current item is movie
        for (var m = 0; m < mediaDb.length; m++) {
            if (mediaDb[m].type == "movie") {
                var movieCastData = this.processCast(mediaDb[m], castDb, personIdToName);
                castDb = movieCastData["castDb"];
                personIdToName = movieCastData["personIdToName"];
            }
            // TV shows require requests for each season
            else if (mediaDb[m].type == "tv") {
                var numOfSeasons = this.getNumberOfSeasons(mediaDb[m].id);
                for (var s = 0; s < numOfSeasons; s++) {
                    var seasonCastData = this.processCast(mediaDb[m], castDb, personIdToName, s+1);
                    castDb = seasonCastData["castDb"];
                    personIdToName = seasonCastData["personIdToName"];
                }
            }
        } 

        var castDbArray = [];

        for (var personId in castDb) {
            castDbArray.push({"personId": personId,
                              "personName": personIdToName[personId],
                              "appearances": castDb[personId]
                             });
        }

        return castDbArray;
    },

    // Search box mounted by React (on page-load), time to generate search index
    // and set up Typeahead for suggestions
    componentDidMount: function() {
        var people = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace("personName"),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: this.generateCastDb()
        });

        $(this.refs.searchBox).typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
            name: 'people',
            source: people,
            displayKey: 'personName',
            templates: {
                suggestion: function (data) {
                    return '<p>' + data["personName"] + '</p>';
                }
            }
        }).on("typeahead:selected typeahead:autocompleted", this.handleSearchResult);

        // Listen for Enter key and auto-fill top suggestion
        var searchBoxRef = $(this.refs.searchBox);
        searchBoxRef.keydown(function(e) {
            if (e.which == 13) { // 13 == Enter key
                var dummyEvent = $.Event('keydown');
                dummyEvent.which = dummyEvent.keyCode = 9; // 9 == Tab key
                searchBoxRef.trigger(dummyEvent);
            }
        });
    },

    // Bubbles up search query to App level
    handleSearchResult(e, personData) {
        this.props.handleSearchResult(personData);
    },

    render: function() {
        return (
            <input
                ref = "searchBox"
                className="search-box"
                type="text"
                placeholder="Name"
            />
        );
    }
});

var Bio = React.createClass({
    render: function() {
        var bioPersonData = this.props.appState.bioPersonData;
        var bioPersonImageUrl = this.props.appState.bioPersonImageUrl;
        var bioHeading = (this.props.appState.bioActive) ? bioPersonData.personName : ""
        
        var mcuAppearancesList;
        var otherFilmography;
        
        if (this.props.appState.bioActive) {
            mcuAppearancesList = <MCUAppearancesList appearances={bioPersonData.appearances} />
            otherFilmography = <OtherAppearancesList filmography={bioPersonData.filmography} />
        }
        return (
            <div className="bio">
                <h1>{bioHeading}</h1>
                <img className="bio-image" src={bioPersonImageUrl}></img>
                {mcuAppearancesList}
                {otherFilmography}
            </div>
        );
    }
});

var MCUAppearancesList = React.createClass({
    render: function() {
        return (
            <div className="mcu-appearances">
                <h2>Appeared in</h2>
                <ul className="appearances-list">
                    {this.props.appearances.map(function(appearance) {
                        var mediaTypeImg = "media/other-label.png";
                        switch(appearance["mediaType"]) {
                            case ("movie"):
                                mediaTypeImg = "media/movie-label.png";
                            break;
                            case ("tv"):
                                mediaTypeImg = "media/tv-label.png";
                            break;
                        }
                        return (
                            <li>
                                <strong>{appearance.characterName}</strong> // {appearance.mediaTitle}
                                <br className="small-screen-br" />&nbsp;&nbsp;
                                <img className="media-type-label" src={mediaTypeImg}></img>
                            </li>
                        );
                    })
                    }
                </ul>
            </div>
        );
    }
});

var OtherAppearancesList = React.createClass({
    render: function() {
        if (this.props.filmography.length > 0) {
            return (
                <div className="other-appearances">
                    <h2>Also seen in</h2>
                    <ul className="filmography-list">
                        {this.props.filmography.map(function(appearance) {
                            return (<li><strong>{appearance.characterName}</strong> // {appearance.mediaTitle} </li>);
                        })
                        }
                    </ul>
                </div>
            );
        }

        else {
            return (
                <br/>
            );
        }
    }
});

var AppearancesListItem = React.createClass({
    render: function() {
        return (
            <li><strong>{this.props.characterName}</strong> // {this.props.mediaTitle} </li>
        );
    }
});


window.setTimeout(function() {
    // Kick off all the magic
    ReactDOM.render(<App/>, document.getElementById("app-container"));
    $(".loading-overlay").fadeOut();
    $("footer").fadeIn();
}, 1000);
