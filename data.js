var TMDbAPIKey = "5a3bf778a84cd3ee3cbdef3910fc1cfc";

var mediaDb = [
    {"id": "1726", "type": 'movie'},
    {"id": "10138", "type": 'movie'},
    {"id": "1724", "type": 'movie'},
    {"id": "1771", "type": 'movie'},
    {"id": "100402", "type": 'movie'},
    {"id": "11834", "type": 'movie'}
];

function generateCreditsRequest(mediaId, mediaType) {
    return "http://api.themoviedb.org/3/" + mediaType + "/" + mediaId + "/credits?api_key=" + TMDbAPIKey;
}

function generateCastDb() {
    var castDb = [];
    var nameMapping = {};

    for (m = 0; m < mediaDb.length; m++) {
        $.ajax({
            type: 'get',
            url: generateCreditsRequest(mediaDb[m].id, mediaDb[m].type), 
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

    console.log(castDbArray)
    return castDbArray;
}
    