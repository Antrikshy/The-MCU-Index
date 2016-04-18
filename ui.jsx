var Header = React.createClass({
    render: function() {
        return (
            <div className="header">
                <SearchBox/>
            </div>
        );
    }
});

var SearchBox = React.createClass({
    generateCreditsRequest: function(mediaId, mediaType) {
        return "http://api.themoviedb.org/3/" + mediaType + "/" + mediaId + "/credits?api_key=" + TMDbAPIKey;
    }

    generateCastDb: function() {
        var castDb = [];
        var nameMapping = {};

        for (m = 0; m < mediaDb.length; m++) {
            $.ajax({
                type: 'get',
                url: this.generateCreditsRequest(mediaDb[m].id, mediaDb[m].type), 
                async: false,
                success: function(data) {
                    for (i = 0; i < data.cast.length; i++) {
                        var castObj = data.cast[i];
                        var appearance = {"mediaId": mediaDb[m].id,
                                          "mediaType": mediaDb[m].type, 
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
        for (personId in castDb) {
            castDbArray.push({"personId": personId,
                              "personName": nameMapping[personId],
                              "appearances": castDb[personId]
                             });
        }

        return castDbArray;
    }

    componentDidMount: function() {
        var people = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace("personName"),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: this.generateCastDb()
        });

        $('#app-container .search-box').typeahead({
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
                    return '<p><strong>' + data["personName"] + '</strong></p>';
                }
            }
        }).on("typeahead:selected typeahead:autocompleted", function(e, data) {
            console.log(data);
            $('#app-container .search-box').val(data.personName);
        });
    },

    render: function() {
        return (
            <input
                className="search-box"
                type="text"
                placeholder="Name"
            />
        );
    }
});

var Bio = React.createClass({
    render: function() {
        return (
            <div className="person-bio">
            // image
            // lists
            </div>
        );
    }
});

var MCUAppearancesList = React.createClass({
    render: function() {
        return (
            <div className="mcu-appearances">
                <h2>Appeared in</h2>

            </div>
        );
    }
});

var OtherAppearancesList = React.createClass({
    render: function() {
        return (
            <div className="other-appearances">
                <h2>Also seen in</h2>

            </div>
        );
    }
});

var MediaListItem = React.createClass({
    render: function() {
        return (

        );
    }
});

ReactDOM.render(<Header/>, document.getElementById("app-container"));
