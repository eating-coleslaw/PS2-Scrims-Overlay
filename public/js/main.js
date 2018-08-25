/* main.js */
/**
 * Created by Dylan on 15-Apr-16.
 * Updated by Chirtle in 2017-2018.
 */

var socket = io();
var playerStatusTimers = [];
var onPointDuration = 3000; //3 seconds

var IStatus = {
    Alive: 1,
    Dead: 2,
    Reviving: 3,
    OnPoint: 4,
    _count: 4
};

socket.on('connect', function() {

    socket.on('title', function(title) {
        //console.log(title);
        $('#eventTitle').html(title);
    });

    socket.on('teams', function (data) {
        console.log(data);
        
        //$('#eventTitle').html(data.title);
        //console.log('Event Title: ' + title);
        
        if (data.teamOne.name !== "") {
            var T1 = data.teamOne.alias
            var T2 = data.teamTwo.alias

            $('#T1Players').empty(); $('#T2Players').empty();

            $('#T1Board').addClass('faction' + data.teamOne.faction);
            $('#T2Board').addClass('faction' + data.teamTwo.faction);

            $('#outfitT1').html(T1).addClass('outfitAlias');
            $('#outfitT2').html(T2).addClass('outfitAlias');

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
        //console.log(data);
        $('#timer').html(data.minutes + ':' + data.seconds);
    });

    socket.on('refresh', function () {
        console.log('refreshed');
        window.location.reload();
    });

    socket.on('killfeed', function (event) {
        console.log(event);
        $('<tr><td class="killfeedRowContainer"><div class="killfeedWinner killfeedPlayer killfeedCell faction' + event.winner_faction + '">' + event.winner + '</div>' +
            '<div class="killfeedWeapon killfeedCell">' + event.weapon + '</div>' +
            '<div class="killfeedLoser killfeedPlayer killfeedCell faction' + event.loser_faction + '">' + event.loser + '</div>' +
            '</td></tr>') .prependTo($('#killfeed')
        );
        
        if (event.is_kill === true && event.loser !== undefined) {
            var loserName = event.loser;
            console.log('respawning');
            playRespawning(loserName);
        }
        else if (event.is_revive === true && event.loser !== undefined && event.loser !== 'Random Pubbie') {
            var loserName = event.loser;
            console.log('reviving');
            playRevived(loserName);
        }
        else if (event.is_control === true && event.winner !== undefined) {
            var winnerName = event.winner;
            console.log('contesting point');
            playContestingPoint(winnerName);
        }
        else {
            var winnerName = event.winner;
            playRespawning(winnerName);
        }

        updatePlayerClasses(event);
       
        //Remove the last row of the killfeed before adding the new row
        var killTable = document.getElementById('killfeed');
        var killRows = killTable.getElementsByTagName('tr');
        if (killRows.length > 4) {
            killTable.deleteRow(4);
       } else {
           return;
       }

       return;
       if (event.weapon == 'Base Capture') {
           return;
        } else {
            playRespawning(event.loser, event.loser_loadout_id);
        }


    });

    socket.on('score', function (event) {
        console.log(event);
        //$('#T1Score').empty().html(event.teamOne.points); $('#T2Score').empty().html(event.teamTwo.points);
        
        var m = event.teamOne.members;
        for (keys in m) {
            if (m[keys].eventCount > 0) { //m[keys].kills > 0 || m[keys].deaths > 0 || m[keys].revives > 0 || m[keys].teamKills > 0) {
               if (m[keys].name == "") {return;}
                var nameEl = document.getElementById(m[keys].name);
                if (nameEl === null) {
                    $('<div class="playerStatsContainer" id="' + m[keys].name + '">' +
                        '<div class="playerClass ' + getClassFromLoadoutID(m[keys].ps2Class) + '" id="' + m[keys].name + 'class"></div>' + 
                        '<div class="playerStatsName" id="' + m[keys].name + 'name">' + m[keys].name + '</div>' +
                        '<div class="playerEventMask" id="' + m[keys].name + 'EventMask">' +
                        '</div>' + '</div>').appendTo($('#T1Players'));
                }
                // if (event.is_kill === true && m[keys].name === event.loser) {
                //     var loserName = m[keys].loser;
                //     console.log('respawning');
                //     playRespawning(loserName);
                // }
                // else if (event.is_revive && m[keys].name === event.loser) {
                //     var loserName = m[keys].loser;
                //     console.log('reviving');
                //     playRevived(loserName);
                // }
                // else if (event.is_control === true && m[keys].name === event.winner) {
                //     var winnerName = m[keys].winner;
                //     console.log('contesting point');
                //     playContestingPoint(winnerName);
                // }
            } else {
                $(m[keys].name).empty(); //commenting out for testing
            }
        }

        m = event.teamTwo.members;
        for (keys in m) {
            if (m[keys].eventCount > 0) { //m[keys].kills > 0 || m[keys].deaths > 0 || m[keys].revives > 0 || m[keys].teamKills > 0) {
                if (m[keys].name == "") {return;}
                var nameEl = document.getElementById(m[keys].name);
                if (nameEl === null) {
                    $('<div class="playerStatsContainer" id="' + m[keys].name + '">' +
                    '<div class="playerClass ' + getClassFromLoadoutID(m[keys].ps2Class) + '" id="' + m[keys].name + 'class"></div>' + 
                    '<div class="playerStatsName" id="' + m[keys].name + 'name">' + m[keys].name + '</div>' +
                    '<div class="playerEventMask" id="' + m[keys].name + 'EventMask"></div>' +
                    '</div>').appendTo($('#T2Players'));
                }
                // if (event.is_kill === true && m[keys].name === event.loser) {
                //     var loserName = m[keys].loser;
                //     playRespawning(loserName);
                // }
                // else if (event.is_revive === true && m[keys].name === event.loser) {
                //     var loserName = m[keys].loser;
                //     playRevived(loserName);
                // }
                // else if (event.is_control === true && m[keys].name === event.winner) {
                //     var winnerName = m[keys].winner;
                //     playContestingPoint(winnerName);
                // }
            } else {
                $(m[keys].name).empty(); //commenting out for testing
            }
        }
        updatePlayerClasses(event);
    });
});

function handlePlayerScoresEvent(event, members, playerContainerElId) {
    for (keys in members) {
        if (members[keys].eventCount > 0) { //members[keys].kills > 0 || members[keys].deaths > 0 || members[keys].revives > 0 || members[keys].teamKills > 0) {
           if (members[keys].name == "") {return;}
            var nameEl = document.getElementById(members[keys].name);
            if (nameEl === null) {
                $('<div class="playerStatsContainer" id="' + members[keys].name + '">' +
                    '<div class="playerClass ' + getClassFromLoadoutID(members[keys].ps2Class) + '" id="' + members[keys].name + 'class"></div>' + 
                    '<div class="playerStatsName" id="' + members[keys].name + 'name">' + members[keys].name + '</div>' +
                    '<div class="playerEventMask" id="' + members[keys].name + 'EventMask">' + '<div class="stripe"></div><div class="stripe"></div>' +
                    '</div>' + '</div>').appendTo($(playerContainerElId));
            }
            if (event.is_kill === true && members[keys].name === event.loser) {
                var loserName = members[keys].loser;
                playRespawning(loserName);
            }
            else if (event.is_revive && members[keys].name === event.loser) {
                var loserName = members[keys].loser;
                playRevived(loserName);
            }
            else if (event.is_control === true && members[keys].name === event.winner) {
                var winnerName = members[keys].winner;
                playContestingPoint(winnerName);
            }
        } else {
            $(members[keys].name).empty(); //commenting out for testing
        }
    }
}


function updatePlayerClasses(event) {
    var winnerID = event.winner + "class";
    var loserID = event.loser + "class";
   
   if (event.winner_class_id !== undefined && !($('#'+winnerID).length == 0)) {
       document.getElementById(winnerID).className = "playerClass " + getClassFromLoadoutID(event.winner_class_id);
   }

   if (event.loser_class_id !== undefined && !($('#'+loserID).length == 0) ) {
    document.getElementById(loserID).className = "playerClass " + getClassFromLoadoutID(event.loser_class_id);
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
    var loserID = eventLoserName + 'respawn';
    var classID = eventLoserName + 'class';
    var eventMaskId = eventLoserName +'EventMask';

    var player = document.getElementById(eventLoserName);
    player.className = "playerStatsContainer";
    
    var playerClass = document.getElementById(classID);
    $('#' + classID).removeClass('deadIconPlay');

    emptyPlayersEventMask(eventLoserName);

    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            $('<div id="' + eventLoserName + 'respawn" class="playerRespawningBar playerRespawningPlay shrinkLeft"></div>').appendTo($('#' + eventMaskId));
            player.className = 'playerStatsContainer deadTextPlay';
            $('#' + classID).addClass('deadIconPlay');


            $('#' + loserID).one("webkitAnimationEnd oanimationend msAnimationEnd animationend",
                function() {
                    console.log('clearing revive');
                    emptyPlayersEventMask(eventLoserName);
                    $('#' + eventLoserName).toggleClass('deadTextPlay');
                    $('#' + classID).removeClass('deadIconPlay');

                });
        });
    });
}

function playRevived(eventLoserName) {
    // emptyPlayersEventMask(eventLoserName);
    // var player = document.getElementById(eventLoserName);
    // player.className = "playerStatsContainer";

    var loserID = eventLoserName + 'respawn';
    var classID = eventLoserName + 'class';
    var eventMaskId = eventLoserName +'EventMask';

    var player = document.getElementById(eventLoserName);
    player.className = "playerStatsContainer";
    
    var playerClass = document.getElementById(classID);
    $('#' + classID).removeClass('deadIconPlay');

    emptyPlayersEventMask(eventLoserName);

    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            player.className = 'playerStatsContainer revivedFlashPlay';
            $('#' + classID).addClass('revivedFlashPlay');

            $('#' + loserID).one("webkitAnimationEnd oanimationend msAnimationEnd animationend",
                function() {
                    console.log('adding revive');
                    emptyPlayersEventMask(eventLoserName);
                    $('#' + eventLoserName).toggleClass('revivedFlashPlay');
                    $('#' + classID).removeClass('revivedFlashPlay');

                });
        });
    });
}

function playContestingPoint(eventWinnerName) {
    var eventMaskId = eventWinnerName +'EventMask';
    
    // Control Point events can only happen at a set interval, so don't worry about restting the animation gracefully
    emptyPlayersEventMask(eventWinnerName);
    //$('<div class="stripe"></div><div class="stripe"></div>').appendTo($('#' + eventMaskId));

    window.requestAnimationFrame(function (time) {
        window.requestAnimationFrame(function (time) {
            $('<div class="stripe"></div><div class="stripe"></div>').appendTo($('#' + eventMaskId));
            $('#' + eventMaskId).one("webkitAnimationEnd oanimationend msAnimationEnd animationend",
                function() {
                    emptyPlayersEventMask(eventWinnerName);
                });
        });
    });
}

function emptyPlayersEventMask(eventPlayerName) {
    var eventMaskId = eventPlayerName + 'EventMask';
    $('#' + eventMaskId).empty();
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

socket.emit('backchat', { obj: 'New Connection' });