// TEST para services/rawg.js
const { getGames } = require('../services/rawg');

async function test(){

    const games = await getGames(1);

    console.log(games);

}

test();