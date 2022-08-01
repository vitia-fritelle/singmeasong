import request from "supertest";
import { Recommendation } from "@prisma/client"; //devo deixar aqui?
import app from '../../src/app';
import factory from "../factory/recommendationFactory";
import { recommendationRepository } from "../../src/repositories/recommendationRepository"; //devo deixar aqui?

const agent = request(app);
const { generateSong, clearDatabase, createSongs, createSong } = factory;
const { find } = recommendationRepository; 

beforeEach(clearDatabase);

const songs1 = [
    {
        name:'Milla', 
        youtubeLink: 'https://www.youtube.com/watch?v=fLK2-h6rReo',
    }, 
    {
        name:'Praieiro | DVD Jammil De Todas As Praias', 
        youtubeLink: 'https://www.youtube.com/watch?v=u_qdaqosDB0',
    }, 
    {
        name: 'Jammil e Uma Noites - Colorir Papel',
        youtubeLink: 'https://www.youtube.com/watch?v=g9GhMlfeW_A',
    },
    {
        name: 'Cheiro De Amor - Vai Sacudir, Vai Abalar',
        youtubeLink: 'https://www.youtube.com/watch?v=SxRVf2RUkb4',
    },
    {
        name: 'Banda djavu - rubi',
        youtubeLink: 'https://www.youtube.com/watch?v=ZCreyV1ADpU'
    }
];
const songs2 = [
    {
        name:'Meteoro', 
        youtubeLink: 'https://www.youtube.com/watch?v=G72s2dLpOJ4',
    }, 
    {
        name:'Ela Só Pensa em Beijar', 
        youtubeLink: 'https://www.youtube.com/watch?v=A9cIavMf2ok',
    }, 
    {
        name: 'Glamurosa',
        youtubeLink: 'https://www.youtube.com/watch?v=BiuxHS66T2E',
    },
    {
        name: 'Jeito Sexy',
        youtubeLink: 'https://www.youtube.com/watch?v=h-g5NgSXHr8',
    },
    {
        name: 'Lambada',
        youtubeLink: 'https://www.youtube.com/watch?v=WMT5XzXFhUs'
    }
];

describe("POST /recommendations", () => {
    const path = '/recommendations';
    it("should create a song", async() => {
        await agent
            .post(path)
            .send(generateSong())
            .expect(201);
    });
    it("should not create song already registered", async() => {
        const song = await createSong();
        await agent
            .post(path)
            .send(generateSong({name:song.name, youtubeLink: song.youtubeLink}))
            .expect(409);
    });
    it("should not create a song without name", async() => {
        await agent
            .post(path)
            .send({youtubeLink: "https://www.youtube.com/watch?v=-KriUokCLHg"})
            .expect(422);
    });
    it("should not create a song from DailyMotion", async() => {
        await agent
            .post(path)
            .send(generateSong({
                name: 'Abba- SOS', 
                youtubeLink: 'https://www.dailymotion.com/video/x2jyzul'
            }))
            .expect(422);
    });
    it("should not create a song without youtubeLink", async() => {
        await agent
            .post(path)
            .send({name: "Flyday Chinatown"})
            .expect(422);
    });
});

describe("GET /recommendations", () => {
    const path = '/recommendations';
    it("should get 10 last songs", async() => {
        const amount = 10;
        await createSongs(amount, 0, 1000,[...songs1,...songs2]);
        const response = await agent
            .get(path)
            .expect(200);
        expect(response.body.length).toBe(10);
    });
});

describe("GET /random", () => {
    const path = '/recommendations/random';
    
    it("should get a random song with score of 11 or more", async() => {
        const amount = 5
        global.Math.random = () => 0.2;
        await Promise.all([
            await createSongs(amount, 11, 2000, songs1),
            await createSongs(amount, -5, 10, songs2),
        ]);
        const response = await agent
            .get(path)
            .expect(200);
        expect(response.body.score).toBeGreaterThan(10);
    });
    it("should get a random song with score of -5 to 10", async() => {
        const amount = 5
        global.Math.random = () => 0.8;
        await Promise.all([
            await createSongs(amount,11,2000),
            await createSongs(amount,-5,10),
        ]);
        const response = await agent
            .get(path)
            .expect(200);
        expect(response.body.score).toBeGreaterThanOrEqual(-5);
        expect(response.body.score).toBeLessThanOrEqual(10);
    });
    it("should get a random song with score of 11 or more", async() => {
        const amount = 5
        global.Math.random = () => 0.2;
        await createSongs(amount,-5,10);
        await agent
            .get(path)
            .expect(200);
    });
    it("should get a random song with score of -5 to 10", async() => {
        const amount = 5
        global.Math.random = () => 0.8;
        await createSongs(amount,11,2000);
        await agent
            .get(path)
            .expect(200);
    });
    it("should return 404(Not found) if no song found", async() => {
        const response = await agent
            .get(path)
            .expect(404);
        expect(response.body).toEqual({});
    })
});

describe("GET /top/:amount", () => {
    const path = (amount: number|null) => `/recommendations/top/${amount}`;
    it("should get an amount of songs ordered by score", async() => {
        const amount = 10
        await createSongs(amount, -5, 20000, [...songs1, ...songs2]);
        const response = await agent
            .get(path(amount))
            .expect(200);
        expect(response.body.length).toBe(amount);
        const songs = response.body as Recommendation[];
        songs.slice(0,-1).forEach((_,i) => {
            expect(songs[i].score-songs[i+1].score).toBeGreaterThanOrEqual(0);
        })
    });
});

describe("GET /:id", () => {
    const path = (id: number) => `/recommendations/${id}`;
    it("should get a song by id", async() => {
        const {id} = await createSong();
        await agent
            .get(path(id))
            .expect(200);
        const song = await find(id);
        expect(song).not.toBeNull();
    });
});

describe("POST /:id/upvote", () => {
    const path = (id: number | string) => `/recommendations/${id}/upvote`;
    it("should upvote a song", async() => {
        const {id} = await createSong();
        await agent
            .post(path(id))
            .expect(200);
        const response = await find(id);
        expect(response?.score).toBe(1);
    });
    it("should give an error 500 if don't find number", async() => {
        await agent
            .post(path('a'))
            .expect(500);
    })
    it("should send error 404 if don't find number", async() => {
        await agent
            .post(path(10))
            .expect(404);
    })
});

describe("POST /:id/downvote", () => {
    const path = (id: number | string) => `/recommendations/${id}/downvote`;
    it("should downvote a song", async() => {
        const {id} = await createSong();
        await agent
            .post(path(id))
            .expect(200);
        const response = await find(id);
        expect(response?.score).toBe(-1);
    });
    it("should delete a song if it gets below -5", async() => {
        const {id} = await createSong(-5);
        await agent
            .post(path(id))
            .expect(200);
        const song = await find(id);
        expect(song).toBeNull();
    });
    it("should give an error 500 if don't find number", async() => {
        await agent
            .post(path('a'))
            .expect(500);
    })
    it("should send error 404 if don't find number", async() => {
        await agent
            .post(path(10))
            .expect(404);
    })
});