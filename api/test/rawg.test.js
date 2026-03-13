// TEST para services/rawg.js
const { getGames, getDevelopers } = require('../services/rawg');

async function test(){

    const games = await getGames(1);
    const developers = await getDevelopers(1);

    console.log(games);
    console.log(developers);

}

test();