/**
 * Created by Dylan on 15-Apr-16.
 * Updated by Chirtle in 2017-2018.
 */

var socket = io();

// Initialize to '' instead of 0 in case someone never scores :( 
var points = {
    match: {
        min: '',
        max: '',
        total: ''
    },
    teamOne: {
        min: '',
        max: ''
    },
    teamTwo: {
        min: '',
        max: ''
    }
};

const debugLogs = false;

socket.on('connect', function() {

    socket.on('title', function(title) {
        if (debugLogs === true) { console.log(title); }
        $('#eventTitle').html(title);
        $('#eventTitle2').html(title);
        $('#eventTitle3').html(title);
    });

    socket.on('teams', function (data) {
        if (debugLogs === true) { console.log(data); }
        
        if (data.teamOne.name !== '' && data.teamTwo.name !== '') {
            var T1Alias = data.teamOne.alias
            var T2Alias = data.teamTwo.alias

            /* --------------
                Scoreboard
            --------------- */
            $('#T1Players').empty();
            $('#T2Players').empty();

            $('#T1Board').addClass('faction' + data.teamOne.faction);
            $('#T2Board').addClass('faction' + data.teamTwo.faction);

            $('#outfitT1').html(T1Alias).addClass('outfitAlias');
            $('#outfitT2').html(T2Alias).addClass('outfitAlias');
            
            $('#T1Score').addClass('activeWhiteText');
            $('#T2Score').addClass('activeWhiteText');

            $('#T1Wedge').addClass('faction' + data.teamOne.faction + 'border');
            $('#T2Wedge').addClass('faction' + data.teamTwo.faction + 'border');

            //Faction Labels
            $('#T1Faction').addClass('faction' + data.teamOne.faction + 'DarkBackground');
            $('#T2Faction').addClass('faction' + data.teamTwo.faction + 'DarkBackground');
            
            $('#T1Faction').html(getFactionLabel(data.teamOne));
            $('#T2Faction').html(getFactionLabel(data.teamTwo));

            $('#T1Faction').addClass('faction' + data.teamOne.faction + 'flavor');
            $('#T2Faction').addClass('faction' + data.teamTwo.faction + 'flavor');

            $('#T1Players').addClass('faction' + data.teamOne.faction);
            $('#T2Players').addClass('faction' + data.teamTwo.faction);

            $('.timerContainer').addClass('faction' + data.teamOne.faction + 'DarkBorderLeft');
            $('.timerContainer').addClass('faction' + data.teamTwo.faction + 'DarkBorderRight');

            $('#killfeedContainer').removeClass('killfeedInactive');
            $('#killfeedContainer').addClass('killfeedActive');

            /* --------------
                Stats
            --------------- */
            $('#T1Stats').addClass('faction' + data.teamOne.faction);
            $('#T2Stats').addClass('faction' + data.teamTwo.faction);

            var T1Stats = '<div id="' + data.teamOne.alias + '-stats" class="stats-row stats-row outfit">' + 
                                '<div id="' + data.teamOne.alias + '-label" class="label">' + data.teamOne.alias + '</div>' +
                                '<div id="' + data.teamOne.alias + '-score" class="score stats-value">' + data.teamOne.points + '</div>' +
                                '<div id="' + data.teamOne.alias + '-net" class="net stats-value">' + data.teamOne.netScore + '</div>' +
                                '<div id="' + data.teamOne.alias + '-kills" class="kills stats-value">' + data.teamOne.kills + '</div>' + 
                                '<div id="' + data.teamOne.alias + '-deaths" class="deaths stats-value">' + data.teamOne.deaths + '</div>' + 
                                '<div id="' + data.teamOne.alias + '-assists" class="assists stats-value">' + data.teamOne.dmgAssists + '</div>' + 
                                '<div id="' + data.teamOne.alias + '-utils" class="utils stats-value">' + data.teamOne.utilAssists + '</div>' +
                            '</div>';
            $(T1Stats).appendTo('#T1Stats');

            var T2Stats = '<div id="' + data.teamTwo.alias + '-stats" class="stats-row stats-row outfit">' + 
                                '<div id="' + data.teamTwo.alias + '-label" class="label">' + data.teamTwo.alias + '</div>' +
                                '<div id="' + data.teamTwo.alias + '-score" class="score stats-value">' + data.teamTwo.points + '</div>' +
                                '<div id="' + data.teamTwo.alias + '-net" class="net stats-value">' + data.teamTwo.netScore + '</div>' +
                                '<div id="' + data.teamTwo.alias + '-kills" class="kills stats-value">' + data.teamTwo.kills + '</div>' + 
                                '<div id="' + data.teamTwo.alias + '-deaths" class="deaths stats-value">' + data.teamTwo.deaths + '</div>' + 
                                '<div id="' + data.teamTwo.alias + '-assists" class="assists stats-value">' + data.teamTwo.dmgAssists + '</div>' + 
                                '<div id="' + data.teamTwo.alias + '-utils" class="utils stats-value">' + data.teamTwo.utilAssists + '</div>' +
                            '</div>';
            $(T2Stats).appendTo('#T2Stats');
            
        }
        else {
            $('#outfitT1').html("--").addClass();
            $('#outfitT2').html("--").addClass();

            $('#T1Faction').html('N<BR>S');
            $('#T2Faction').html('N<BR>S');

            $('#killfeedContainer').addClass('killfeedInactive');

            // Also empty the player containers
            $('#T1Players').empty();
            $('#T2Players').empty();
        }
    });

    socket.on ('time', function(data) {
        if (debugLogs === true) { console.log(data); }
        $('#timer').html(data.minutes + ':' + data.seconds);
    });

    socket.on('refresh', function () {
        console.log('refreshed');
        window.location.reload();
    });

    socket.on('killfeed', function (event) {
        if (debugLogs === true) { console.log(event); }
        
        if (event.is_kill === true && event.loser !== undefined) {
            var loserName = event.loser;
            addKillfeedRow(event);
            updatePlayerClasses(event);
            updatePlayerScores(event);
            playRespawning(loserName);
        }
        else if (event.is_revive === true && event.loser !== undefined && event.loser !== 'Random Pubbie') {
            var loserName = event.loser;
            addKillfeedRow(event);
            updatePlayerClasses(event);
            // updatePlayerScores(event);
            playRevived(loserName);
        }
        else if (event.is_control === true && event.winner !== undefined) {
            var winnerName = event.winner;
            if (debugLogs === true) { addKillfeedRow(event);}
            updatePlayerClasses(event);
            // updatePlayerScores(event);
            playContestingPoint(winnerName);
        }
        // else {
        //     updatePlayerScores(event);
        // }

        truncateKillfeed();
    });

    socket.on('score', function (event) {
        console.log(event);
        $('#T1Score').empty().html(event.teamOne.points);
        $('#T2Score').empty().html(event.teamTwo.points);

        points.match.total = event.teamOne.points + event.teamTwo.points;
        
        var m = event.teamOne.members;
        for (keys in m) {
            if (m[keys].kills > 0 || m[keys].deaths > 0 || m[keys].teamKills > 0 || m[keys].dmgAssists > 0) {
                if (m[keys].name === "") { return; }

                // Player Status & Class Elements
                var nameEl = document.getElementById(m[keys].name);
                if (nameEl === null) {
                //    console.log("Adding T1 player: " + m[keys].name);
                   $(getPlayerClassHtml(m[keys].name, m[keys].ps2Class)).appendTo($('#T1Players'));
                   $(getPlayerStatsHtml(m[keys].name, m[keys].netScore)).appendTo($('#T1Players'));
                }
                else {
                   var scoreEl = document.getElementById(m[keys].name + 'Score');
                   scoreEl.textContent = m[keys].netScore;
                }
                if (m[keys].name === event.loser) {
                   var loserName = m[keys].loser;
                   playRespawning(loserName);
                }
               
                // Update running min and max point values. Need to do this before updating the stats table.
                let pts = m[keys].points;
                if (points.teamOne.min === '' || pts < points.teamOne.min) {
                   points.teamOne.min = pts;
                }
                if (points.match.min === '' || pts < points.match.min) {
                    points.match.min = pts;
                }
                if (points.teamOne.max === '' || pts > points.teamOne.max) {
                    points.teamOne.max = pts;
                }
                if (points.match.max === '' || pts > points.match.max) {
                    points.match.max = pts;
                }

                let ptGraphWidth = pts > 1 ? Math.ceil(90 * (pts / points.match.max)) : 4;

                // Player Stats Row
                statsRow = document.getElementById(m[keys].name + '-stats');
                if (statsRow === null) {
                    var statsRowHtml = '<div id="' + m[keys].name + '-stats" class="stats-row player">' + 
                                           '<div id="' + m[keys].name + '-label" class="label">' + m[keys].name + '</div>' +
                                           '<div id="' + m[keys].name + '-score" class="score stats-value">' + m[keys].points + '</div>' +
                                           '<div id="' + m[keys].name + '-graph" class="graph"></div>' +
                                           '<div id="' + m[keys].name + '-net" class="net stats-value">' + m[keys].netScore + '</div>' +
                                           '<div id="' + m[keys].name + '-kills" class="kills stats-value">' + m[keys].kills + '</div>' + 
                                           '<div id="' + m[keys].name + '-deaths" class="deaths stats-value">' + m[keys].deaths + '</div>' +
                                           '<div id="' + m[keys].name + '-assists" class="assists stats-value">' + m[keys].dmgAssists + '</div>' + 
                                           '<div id="' + m[keys].name + '-utils" class="utils stats-value">' + m[keys].utilAssists + '</div>' +
                                        '</div>';
                    $(statsRowHtml).appendTo('#T1Stats');

                    var graphBarHtml = '<div id="' + m[keys].name + '-graph-bar" class="graph-bar" style="width: ' + ptGraphWidth + '%;"></div>';
                    $(graphBarHtml).appendTo('#' + m[keys].name + '-graph');
                }
                else {
                   document.getElementById(m[keys].name + '-score').textContent = m[keys].points;
                   document.getElementById(m[keys].name + '-net').textContent = m[keys].netScore;
                   document.getElementById(m[keys].name + '-kills').textContent = m[keys].kills;
                   document.getElementById(m[keys].name + '-deaths').textContent = m[keys].deaths;
                   document.getElementById(m[keys].name + '-assists').textContent = m[keys].dmgAssists;
                   document.getElementById(m[keys].name + '-utils').textContent = m[keys].utilAssists;

                   document.getElementById(m[keys].name + '-graph-bar').width = ptGraphWidth + '%';
                }
            }
            // Remove the player from the overlay if they haven't done anything
            else {
                //TODO: make each player row a grid row
                // console.log("Removing T1 player: " + m[keys].name);
                if($('#' + m[keys].name, '#T1Players').length === 1) {
                    $('#' + m[keys].name + 'class').remove();
                    $('#' + m[keys].name).remove();
                }

                if($('#' + m[keys].name + '-stats', '#T1Players').length === 1) {
                    $('#' + m[keys].name + '-stats').remove(); 
                }
            }
        }

        m = event.teamTwo.members;
        for (keys in m) {
            if (m[keys].kills > 0 || m[keys].deaths > 0 || m[keys].teamKills > 0 || m[keys].dmgAssists > 0) {
                if (m[keys].name === "") { return; }
                
                // Player Status & Class Elements
                var nameEl = document.getElementById(m[keys].name);
                if (nameEl === null) {
                    // console.log("Adding T2 player: " + m[keys].name);
                    $(getPlayerStatsHtml(m[keys].name, m[keys].netScore)).appendTo($('#T2Players'));
                    $(getPlayerClassHtml(m[keys].name, m[keys].ps2Class)).appendTo($('#T2Players'));
                }
                else {
                    var scoreEl = document.getElementById(m[keys].name + 'Score');
                    scoreEl.textContent = m[keys].netScore;
                }
                if (m[keys].name === event.loser) {
                    var loserName = m[keys].loser;
                    playRespawning(loserName);
                }
                
                // Update running min and max point values. Need to do this before updating the stats table.
                let pts = m[keys].points;
                if (points.teamTwo.min === '' || pts < points.teamTwo.min) {
                    points.teamTwo.min = pts;
                }
                if (points.teamTwo.min === '' || pts < points.teamTwo.min) {
                    points.teamTwo.min = pts;
                }
                if (points.teamTwo.max === '' || pts > points.teamTwo.max) {
                    points.teamTwo.max = pts;
                }
                if (points.match.max === '' || pts > points.match.max) {
                    points.match.max = pts;
                }

                let ptGraphWidth = pts > 1 ? Math.ceil(75 * (pts / points.match.max)) : 4;

                // Player Stats Row
               statsRow = document.getElementById(m[keys].name + '-stats');
               if (statsRow === null) {
                   var statsRowHtml = '<div id="' + m[keys].name + '-stats" class="stats-row player">' + 
                                           '<div id="' + m[keys].name + '-label" class="label">' + m[keys].name + '</div>' +
                                           '<div id="' + m[keys].name + '-score" class="score stats-value">' + m[keys].points + '</div>' +
                                           '<div id="' + m[keys].name + '-graph" class="graph"></div>' +
                                           '<div id="' + m[keys].name + '-net" class="net stats-value">' + m[keys].netScore + '</div>' +
                                           '<div id="' + m[keys].name + '-kills" class="kills stats-value">' + m[keys].kills + '</div>' + 
                                           '<div id="' + m[keys].name + '-deaths" class="deaths stats-value">' + m[keys].deaths + '</div>' +
                                           '<div id="' + m[keys].name + '-assists" class="assists stats-value">' + m[keys].dmgAssists + '</div>' + 
                                           '<div id="' + m[keys].name + '-utils" class="utils stats-value">' + m[keys].utilAssists + '</div>' +
                                        '</div>';
                    $(statsRowHtml).appendTo('#T2Stats');

                    var graphBarHtml = '<div id="' + m[keys].name + '-graph-bar" class="graph-bar" style="width: ' + ptGraphWidth + '%;"></div>';
                    $(graphBarHtml).appendTo('#' + m[keys].name + '-graph');
               }
               else {
                   document.getElementById(m[keys].name + '-score').textContent = m[keys].points;
                   document.getElementById(m[keys].name + '-net').textContent = m[keys].netScore;
                   document.getElementById(m[keys].name + '-kills').textContent = m[keys].kills;
                   document.getElementById(m[keys].name + '-deaths').textContent = m[keys].deaths;
                   document.getElementById(m[keys].name + '-assists').textContent = m[keys].dmgAssists;
                   document.getElementById(m[keys].name + '-utils').textContent = m[keys].utilAssists;

                   document.getElementById(m[keys].name + '-graph-bar').width = ptGraphWidth + '%';
                }
            }
            // Remove the player from the overlay if they haven't done anything
            else {
                //TODO: make each player row a grid row
                // console.log("Removing T2 player: " + m[keys].name);
                if($('#' + m[keys].name, '#T2Players').length === 1) {
                    $('#' + m[keys].name + 'class').remove();
                    $('#' + m[keys].name).remove(); 
                }

                if($('#' + m[keys].name + '-stats', '#T2Players').length === 1) {
                    $('#' + m[keys].name + '-stats').remove();
                }
                // $('#' + m[keys].name + 'class').remove();
                // $('#' + m[keys].name).remove(); 
            }
        }
        updatePlayerClasses(event);
        updatePlayerScores(event);

        // Team 1 Stats
        document.getElementById(event.teamOne.alias + '-score').textContent = event.teamOne.points;
        document.getElementById(event.teamOne.alias + '-net').textContent = event.teamOne.netScore;
        document.getElementById(event.teamOne.alias + '-kills').textContent = event.teamOne.kills;
        document.getElementById(event.teamOne.alias + '-deaths').textContent = event.teamOne.deaths;
        document.getElementById(event.teamOne.alias + '-assists').textContent = event.teamOne.dmgAssists;
        document.getElementById(event.teamOne.alias + '-utils').textContent = event.teamOne.utilAssists;

        // Team 2 Stats
        document.getElementById(event.teamTwo.alias + '-score').textContent = event.teamTwo.points;
        document.getElementById(event.teamTwo.alias + '-net').textContent = event.teamTwo.netScore;
        document.getElementById(event.teamTwo.alias + '-kills').textContent = event.teamTwo.kills;
        document.getElementById(event.teamTwo.alias + '-deaths').textContent = event.teamTwo.deaths;
        document.getElementById(event.teamTwo.alias + '-assists').textContent = event.teamTwo.dmgAssists;
        document.getElementById(event.teamTwo.alias + '-utils').textContent = event.teamTwo.utilAssists;
    });
});

/* Prepend a new event to the top of the killfeed */
function addKillfeedRow(event) {
    var pointsString = "";
    if (Number(event.points) > 0) { 
        pointsString = '+' + event.points;
    }
    else if (Number(event.points) < 0) { 
        pointsString = event.points;
    }
    else {
        pointsString = '0';
    }
    
    $(getKillfeedRowHtml(event.winner, event.winner_faction, event.loser, event.loser_faction, pointsString, event.weapon)).prependTo($('#killfeed'));
}

/* Remove the last row of the killfeed */
function truncateKillfeed() {
    var killTable = document.getElementById('killfeed');
    var killRows = killTable.getElementsByTagName('tr');
    if (killRows.length > 4) { killTable.deleteRow(4); }
}

function getPlayerStatsHtml(name, netScore) {
    return '<div class="playerStatsContainer" id="' + name + '">' +
                '<div class="playerStatsScore" id="' + name + 'Score">' + netScore + '</div>' +
                '<div class="playerStatsName" id="' + name + 'name">' + name + '</div>' + 
                '<div class="playerEventMask" id="' + name + 'EventMask"></div>' +
           '</div>';
}

function getPlayerClassHtml(name, ps2Class) {
    return '<div class="playerClass ' + getClassFromLoadoutID(ps2Class) + '" id="' + name + 'class"></div>'
}

function getKillfeedRowHtml(winner, winnerFaction, loser, loserFaction, points, weapon) {
    return '<tr>' +
                '<td class="killfeedRowContainer">' + 
                    '<div class="killfeedWinner killfeedPlayer killfeedCell faction' + winnerFaction + '">' + winner + '</div>' +
                    '<div class="killfeedPoints killfeedCell ">' + points + '</div>' +
                    '<div class="killfeedWeapon killfeedCell">' + weapon + '</div>' +
                    '<div class="killfeedLoser killfeedPlayer killfeedCell faction' + loserFaction + '">' + loser + '</div>' +
                '</td>' +
            '</tr>'
}

function updatePlayerClasses(event) {
    var winnerID = event.winner + "class";
    var loserID = event.loser + "class";
   
   if (event.winner_class_id !== undefined && !($('#' + winnerID).length === 0)) {
    //    console.log(event.winner + ' Class: ' + event.winner_class_id);
       document.getElementById(winnerID).className = "playerClass " + getClassFromLoadoutID(event.winner_class_id);
   }

   if (event.loser_class_id !== undefined && !($('#' + loserID).length === 0)) {
    //    console.log(event.loser + ' Class: ' + event.loser_class_id);
       document.getElementById(loserID).className = "playerClass " + getClassFromLoadoutID(event.loser_class_id);
   }
}

// TODO: actually implement this
function updatePlayerScores(event) {
    var winnerID = event.winner + 'Score';
    var loserID = event.loser + 'Score';

    if (event.winner_net_score !== undefined && !($('#' + winnerID).length === 0)) {
        console.log(event.winner + ' Net: ' + event.winner_net_score);
        winnerID.textContent = event.winner_net_score;
       // document.getElementById(winnerID).className = getEmojiFromNetEventScore(event.winner_net_score);
    }
 
    if (event.loser_net_score !== undefined && !($('#' + loserID).length === 0) ) {
        console.log(event.loser + ' Net: ' + event.loser_net_score);
        loserID.textContent = event.loser_net_score;
        //document.getElementById(loserID).className = getEmojiFromNetEventScore(event.loser_net_score);
    }

}

function getFactionLabel(teamObject) {
   var factions = new Array();
   factions[1] = "V<BR>S";
   factions[2] = "N<BR>C";
   factions[3] = "T<BR>R";
   return factions[teamObject.faction];
};

function playRespawning(eventLoserName) {
    var respawnID = '#' + eventLoserName + 'respawn';
    // var classID = eventLoserName + 'class';
    var loserId = '#' + eventLoserName;
    var eventMaskId = '#' + eventLoserName +'EventMask';
   
    var player = document.getElementById(eventLoserName);
    player.className = "playerStatsContainer";
    
    // var respawn = document.getElementById(loserID);
    // respawn.className = "playerRespawningBase";
   
    // $('#' + classID).removeClass('deadIconPlay');
    $(loserId).removeClass('deadTextPlay');

    // $('#' + eventLoserName).removeClass('deadTextPlay');

    emptyPlayersEventMask(eventLoserName);

    // var shrinkDirection = $('#T1Players #'+ eventLoserName) ? 'shrinkRight' : 'shrinkLeft';
    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            $(getRespawnBarHtml(eventLoserName)).appendTo($(eventMaskId));
            // respawn.className = "playerRespawningBar playerRespawningPlay"; // " + shrinkDirection;
            player.className = "playerStatsContainer deadTextPlay";
            // $('#' + classID).addClass('deadIconPlay');

            $(respawnID).one("webkitAnimationEnd oanimationend msAnimationEnd animationend",
                function() {
                    emptyPlayersEventMask(eventLoserName);
                    // player.className = "playerStatsContainer";
                    $(loserId).removeClass('revivedFlashPlay deadTextPlay');
                    // $('#' + classID).removeClass('revivedFlashPlay deadIconPlay');

                });
        });
    });
}

function getRespawnBarHtml(name) {
    return '<div id="' + name + 'respawn" class="playerRespawningBar playerRespawningPlay"></div>'
}

// TODO: actually implement this
function playRevived(eventLoserName) {
    var classID = eventLoserName + 'class';
    var playerId = '#' + eventLoserName;
    
    var player = document.getElementById(eventLoserName);
    player.className = "playerStatsContainer";
    
    // $('#' + classID).removeClass('deadIconPlay');
    $(playerId).removeClass('deadTextPlay');

    emptyPlayersEventMask(eventLoserName);

    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            player.className = 'playerStatsContainer revivedFlashPlay';
            // $('#' + classID).addClass('revivedFlashPlay');

            $(playerId).one("webkitAnimationEnd oanimationend msAnimationEnd animationend",
                function() {
                    emptyPlayersEventMask(eventLoserName);
                    $('#' + eventLoserName).removeClass('revivedFlashPlay deadTextPlay');
                    // $('#' + classID).removeClass('revivedFlashPlay deadIconPlay');

                });
        });
    });
}

// TODO: actually implement this
function playContestingPoint(eventWinnerName) {
    var eventMaskId = '#' + eventWinnerName +'EventMask';
    
    // Control Point events can only happen at a set interval, so don't worry about restting the animation gracefully
    emptyPlayersEventMask(eventWinnerName);

    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            $(getPointControlHtml()).appendTo($(eventMaskId));

            $(eventMaskId).one("webkitAnimationEnd oanimationend msAnimationEnd animationend",
                function() {
                    emptyPlayersEventMask(eventWinnerName);
                });
        });
    });
}

function getPointControlHtml() {
    return '<div class="stripe"></div><div class="stripe"></div>';
}

// TOD: actually implement this
function emptyPlayersEventMask(eventPlayerName) {
    var eventMaskId = '#' + eventPlayerName + 'EventMask';
    $(eventMaskId).empty();
}

function getLoadoutIdMappings(loadoutID) {
    var classMap = [];
    classMap[0] = 'unknown';
    classMap[1] ='infil'; classMap[8] = 'infil'; classMap[15] = 'infil';
    classMap[3] = 'la'; classMap[10] = 'la'; classMap[17] = 'la';
    classMap[4] = 'medic'; classMap[11] = 'medic'; classMap[18] = 'medic';
    classMap[5] = 'engy'; classMap[12] = 'engy'; classMap[19] ='engy';
    classMap[6] = 'heavy'; classMap[13] = 'heavy'; classMap[20] = 'heavy';
    classMap[7] = 'max'; classMap[14] = 'max'; classMap[21] = 'max';
    return classMap[loadoutID];
}

function getClassFromLoadoutID(loadoutID) {
    return getLoadoutIdMappings(loadoutID);
}


function makeEmojiClassString(emoji) {
    let size =' sm';
    let prefix = 'fas fa-';
    return prefix + emoji + size;
}

socket.emit('backchat', { obj: 'New Connection' });