"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// colored console output
function red(value) { return `\x1b[31m${value}\x1b[0m`; }
function green(value) { return `\x1b[32m${value}\x1b[0m`; }
function yellow(value) { return `\x1b[33m${value}\x1b[0m`; }
function black(value) { return `\x1b[30m${value}\x1b[0m`; }
function blue(value) { return `\x1b[34m${value}\x1b[0m`; }
function magenta(value) { return `\x1b[35m${value}\x1b[0m`; }
function cyan(value) { return `\x1b[36m${value}\x1b[0m`; }
function white(value) { return `\x1b[37m${value}\x1b[0m`; }

function gray(value) { return `\x1b[30m\x1b[1m${value}\x1b[0m`; }
function lightBlue(value) { return `\x1b[34m\x1b[1m${value}\x1b[0m`; }
function lightGreen(value) { return `\x1b[32m\x1b[1m${value}\x1b[0m`; }
function lightAqua(value) { return `\x1b[36m\x1b[1m${value}\x1b[0m`; }
function lightRed(value) { return `\x1b[31m\x1b[1m${value}\x1b[0m`; }
function lightPurple(value) { return `\x1b[35m\x1b[1m${value}\x1b[0m`; }
function lightYellow(value) { return `\x1b[33m\x1b[1m${value}\x1b[0m`; }
function brightWhite(value) { return `\x1b[37\x1b[1m${value}\x1b[0m`; }

function redBg(value) { return `\x1b[41m${value}\x1b[0m`; }
function blueBg(value) { return `\x1b[44m\x1b[30m${value}\x1b[0m`; }
function lightAquaBg(value) { return `\x1b[46m\x1b[30m${value}\x1b[0m`; }
function whiteBg(value) { return `\x1b[47m\x1b[30m${value}\x1b[0m`; }


function faction(value, faction, background) {
	if (background === true) { return factionBg(value, faction);}

	// VS
	if ( faction == 1) { return blue(value);}
	
	// NC - lightAqua instead of lightBlue for accessiblity
	else if ( faction == 2) { return lightAqua(value);}

	// TR
	else if ( faction == 3) { return red(value);}

	else { return white(value); }
}

function factionBg(value, faction) {
	// VS
	if ( faction == 1) { return blueBg(value);}
	
	// NC - lightAqua instead of lightBlue for accessiblity
	else if ( faction == 2) { return lightAquaBg(value);}

	// TR
	else if ( faction == 3) { return redBg(value);}

	else { return whiteBg(value); }
}

function sample() {
	console.log(
		painter.red('red') + 
		painter.green(' green') + 
		painter.yellow(' yellow') + 
		painter.black(' black') + 
		painter.blue(' blue') + 
		painter.magenta(' magenta') + 
		painter.cyan(' cyan') + 
		painter.white(' white') + 
		painter.gray(' gray') + 
		painter.lightBlue(' lightBlue') + 
		painter.lightGreen(' lightGreen') + 
		painter.lightAqua(' lightAqua') + 
		painter.lightRed(' lightRed') + 
		painter.lightPurple(' lightPurple') + 
		painter.lightYellow(' lightYellow') + 
		painter.brightWhite(' brightWhite') +

		painter.lightAquaBg(' lightAquaBg') + 
		painter.redBg(' redBg') + 
		painter.blueBg(' blueBg')

	)
}

exports.red		= red;
exports.green	= green;
exports.yellow	= yellow;
exports.black	= black;
exports.blue	= blue;
exports.magenta	= magenta;
exports.cyan	= cyan;
exports.white	= white;
exports.gray	= gray;
exports.lightBlue	= lightBlue;
exports.lightGreen	= lightGreen;
exports.lightAqua	= lightAqua;
exports.lightRed	= lightRed;
exports.lightPurple	= lightPurple;
exports.lightYellow	= lightYellow;
exports.brightWhite	= brightWhite;
exports.sample		= sample;
exports.faction		= faction;
exports.redBg		= redBg;
exports.lightAquaBg	= lightAquaBg;
exports.blueBg		= blueBg;