import { 
    recommendationRepository 
} from "../../src/repositories/recommendationRepository";
import { prismaMock } from "../singleton";

const { 
    create, 
    find, 
    findByName, 
    findAll, 
    getAmountByScore,
    remove,
    updateScore, 
} = recommendationRepository;

const user = {
    id: 10,
    name: 'PARAMORE X PÉRICLES - MISERY BUSINESS ATÉ QUE DUROU (MASHUP)',
    youtubeLink: 'https://www.youtube.com/watch?v=Xy64urocPp0',
    score: 7,
};

describe('insert in database', () => {
    it('should insert a new recommendation in the database', async() => {
        prismaMock.recommendation.create.mockResolvedValueOnce(user);
        const response = await create(user);
        expect(response).toEqual(user);
    });
});

describe('find in database', () => {
    it('should find recommendation by id', async() => {
        prismaMock.recommendation.findUnique.mockResolvedValueOnce(user);
        const response = await find(user.id);
        expect(response?.id).toBe(user.id);
    });
    it('shall return 10 recommendations in descendant order', async() => {
        const take = 10;
        const score = 30;
        const scoreFilter = 'lte';
        const lista = Array<typeof user>(take).fill(user).filter((obj) => { 
            return obj.score <= score;
        }).map((obj, index) => {
            return {...obj, score: score-index};
        });
        prismaMock.recommendation.findMany.mockResolvedValueOnce(lista);
        const response = await findAll({score, scoreFilter});
        expect(response.length).toBe(take);
        for(let i = 0; i < response.length-1; i++) {
            expect(response[i].score)
            .toBeGreaterThanOrEqual(response[i+1].score);
        }
        for(let i = 0; i < response.length; i++) {
            expect(response[i].score)
            .toBeLessThanOrEqual(score);
        }
    })
    it('should get an amount of recommendations by score', async() => {
        const take = 10;
        prismaMock.recommendation.findMany.mockResolvedValueOnce(
            Array<typeof user>(take)
            .fill(user)
            .map((obj, index) => {
                return {...obj, score: 100-index};
            })
        );
        const response = await getAmountByScore(take);
        expect(response.length).toBe(take);
        for(let i = 0; i < response.length-1; i++) {
            expect(response[i].score)
            .toBeGreaterThanOrEqual(response[i+1].score);
        }
    });
    it('should find recommendation by name', async() => {
        prismaMock.recommendation.findUnique.mockResolvedValueOnce(user);
        const response = await findByName(user.name);
        expect(response?.name).toBe(user.name);
    });
});

describe('remove from the database', () => {
    it('should remove recommendation from the database', async() => {
        prismaMock.recommendation.delete.mockResolvedValueOnce(user);
        const response = await remove(user.id);
        expect(response.id).toBe(user.id);
    });
});

describe('update database', () => {
    it('should update recommendation from the database', async() => {
        prismaMock.recommendation.update.mockResolvedValueOnce({
            ...user, 
            score: user.score+1
        });
        const response = await updateScore(user.id, 'increment');
        expect(response.score).toBe(user.score+1);
    })
})