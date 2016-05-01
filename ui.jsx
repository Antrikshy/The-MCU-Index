var App = React.createClass({
    getInitialState: function() {
        return {
            "bioActive": false,
            "bioPersonData": null
        };
    },

    generateFilmographyRequest: function(personId) {
        return "http://api.themoviedb.org/3/person/" + personId + "/combined_credits?api_key=" + TMDbAPIKey;
    },

    handleSearchResult: function(bioPersonData) {
        var otherAppearances = [];
        $.ajax({
            type: 'get',
            url: this.generateFilmographyRequest(bioPersonData.personId),
            async: false,
            success: function(data) {
                for (var i = 0; i < data.cast.length; i++) {
                    var castObj = data.cast[i];
                    var appearance = {
                                      "mediaTitle": castObj.original_title,
                                      "characterName": castObj.character,
                                      "mediaType": castObj.media_type
                                     }
                    otherAppearances.push(appearance);
                }
            }
        });

        bioPersonData.filmography = otherAppearances;

        this.setState({
            "bioActive": true,
            "bioPersonData": bioPersonData,
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
                "height": "10rem",
                "padding-top": "2rem"
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
                <h1 className="brand-title">Untitled MCU Cast Browser</h1>
                <SearchBox handleSearchResult={this.props.handleSearchResult} />
                <svg className="slanter" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="0,100  100,100  200,0" />
                </svg>
            </div>
        );
    }
});

var SearchBox = React.createClass({
    generateCreditsRequest: function(mediaId, mediaType) {
        return "http://api.themoviedb.org/3/" + mediaType + "/" + mediaId + "/credits?api_key=" + TMDbAPIKey;
    },

    generateCastDb: function() {
        var castDb = [];
        var nameMapping = {};

        for (var m = 0; m < mediaDb.length; m++) {
            $.ajax({
                type: 'get',
                url: this.generateCreditsRequest(mediaDb[m].id, mediaDb[m].type), 
                async: false,
                success: function(data) {
                    for (var i = 0; i < data.cast.length; i++) {
                        var castObj = data.cast[i];
                        var appearance = {
                                          "mediaId": mediaDb[m].id,
                                          "mediaType": mediaDb[m].type,
                                          "mediaTitle": mediaDb[m].title,
                                          "characterName": castObj.character
                                         }
                        nameMapping[castObj.id] = castObj.name;            
                        if (castDb[castObj.id] == undefined) {
                            castDb[castObj.id] = [appearance];
                        }
                        else {
                            castDb[castObj.id].push(appearance);
                        }
                    }
                }
            });
        }

        var castDbArray = [];

        for (var personId in castDb) {
            castDbArray.push({"personId": personId,
                              "personName": nameMapping[personId],
                              "appearances": castDb[personId]
                             });
        }

        return castDbArray;
    },

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
    },

    handleSearchResult(e, personData) {
        console.log(personData);
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
                        return <AppearancesListItem 
                                    key={appearance.mediaId + appearance.characterName}
                                    mediaType={appearance.mediaType}
                                    mediaTitle={appearance.mediaTitle}
                                    characterName={appearance.characterName}
                               />;
                        })
                    }
                </ul>
            </div>
        );
    }
});

var OtherAppearancesList = React.createClass({
    // getInitialState: function() {
    //     return {
    //         filmography: []
    //     };
    // },

    // componentDidMount: function() {
    //     var otherAppearancesList = this;
    //     this.getFilmography(this.props.personId, function(otherAppearances) {
    //         otherAppearancesList.setState({
    //             filmography: otherAppearances
    //         });
    //     });
    // },

    render: function() {
        return (
            <div className="other-appearances">
                <h2>Also seen in</h2>
                <ul className="filmography-list">
                    {this.props.filmography.map(function(appearance) {
                        return <AppearancesListItem 
                                    key={appearance.mediaTitle + appearance.characterName}
                                    mediaType={appearance.mediaType}
                                    mediaTitle={appearance.mediaTitle}
                                    characterName={appearance.characterName}
                               />;
                        })
                    }
                </ul>
            </div>
        );
    }
});

var AppearancesListItem = React.createClass({
    render: function() {
        return (
            <li><strong>{this.props.characterName}</strong> // {this.props.mediaTitle}</li>
        );
    }
});

ReactDOM.render(<App/>, document.getElementById("app-container"));
