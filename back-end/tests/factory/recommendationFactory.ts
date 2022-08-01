import { Recommendation } from "@prisma/client";
import { faker } from "@faker-js/faker";
import prisma from "../../src/database";

async function clearDatabase() {
    await prisma.recommendation.deleteMany();
}

function generateSong(song: Omit<Recommendation, "id"|"score"> | undefined = undefined) {
    return {
        name: song?.name || faker.music.songName(),
        youtubeLink: song?.youtubeLink || "https://www.youtube.com/watch?v=-KriUokCLHg"
    }
}

async function createSong(score: number = 0) {
    return await prisma.recommendation.create({
        data: {...generateSong(), score}
    });
}

async function createSongs(
    number: number, 
    min: number = 0, 
    max: number = 0, 
    songs: Omit<Recommendation, "id"|"score">[] = []
) {
    return await prisma.recommendation.createMany({
        data: Array(number).fill(0).map((_,index) => { 
            return {
                ...generateSong(songs[index]), 
                score: faker.mersenne.rand(max || 0, min),
            }
        })
    });
}

const recommendationFactory = {
    generateSong,
    clearDatabase,
    createSongs,
    createSong,
}

export default recommendationFactory;