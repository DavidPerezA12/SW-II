const mongodb = require("../db/conn");
const fs = require("fs");

const comments = [
    "Muy buen juego, lo recomiendo.",
    "Me gustó bastante, aunque tiene algunos fallos.",
    "Excelente experiencia de principio a fin.",
    "No está mal, pero esperaba más.",
    "Gran apartado visual y buena jugabilidad.",
    "Historia interesante y personajes memorables.",
    "Se hace un poco repetitivo, pero entretiene.",
    "Uno de mis favoritos.",
    "Buen juego para pasar el rato.",
    "La jugabilidad podría mejorar."
];

const users = [
    "player_01",
    "gamer_22",
    "sanzc",
    "darkmage",
    "lucia_games",
    "retrofan",
    "noobmaster",
    "rpg_lover",
    "fps_player",
    "indie_fan"
];

const randomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

const randomRating = () => {
    return Math.floor(Math.random() * 5) + 1;
};

const randomDate = () => {
    const start = new Date("2024-01-01").getTime();
    const end = new Date().getTime();
    return new Date(start + Math.random() * (end - start)).toISOString();
};

const seedReviews = async () => {
    await mongodb.connectToDatabase();

    const db = mongodb.getDb();

    const games = await db
        .collection("videogames")
        .find({}, { projection: { id: 1, name: 1 } })
        .toArray();

    const reviews = [];

    let reviewId = 1;

    games.forEach(game => {
        const reviewsPerGame = Math.floor(Math.random() * 4) + 2; // entre 2 y 5 reviews

        for (let i = 0; i < reviewsPerGame; i++) {
            reviews.push({
                id: reviewId++,
                gameId: game.id,
                gameName: game.name,
                user: randomItem(users),
                rating: randomRating(),
                comment: randomItem(comments),
                createdAt: randomDate()
            });
        }
    });

    fs.writeFileSync(
        "./datasets/reviews.json",
        JSON.stringify(reviews, null, 2)
    );

    await db.collection("reviews").deleteMany({});

    if (reviews.length > 0) {
        await db.collection("reviews").insertMany(reviews);
    }

    console.log(`Reviews generadas: ${reviews.length}`);
    console.log("Datos de reviews cargados en MongoDB");

    process.exit();
};

seedReviews();