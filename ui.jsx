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
    componentDidMount: function() {
        var people = new Bloodhound({
            datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d["personName"]); },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: generateCastDb()
        });

        $('#app-container .search-box').typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
            name: 'people',
            source: people,
            templates: {
                suggestion: function (data) {
                    console.log(data);
                    return '<p><strong>' + data["personName"] + '</strong></p>';
                }
            }
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

ReactDOM.render(<Header/>, document.getElementById("app-container"));
