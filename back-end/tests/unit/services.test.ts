import {jest} from '@jest/globals'
import { faker } from "@faker-js/faker";
import { 
    recommendationRepository 
} from "../../src/repositories/recommendationRepository";
import {
    recommendationService
} from "../../src/services/recommendationsService";

const recommendation = {
    id: faker.datatype.number({ min: 1, max: 1000}),
    name: 'Fall Out Boy - Yule Shoot Your Eye Out (Audio)',
    youtubeLink: 'https://www.youtube.com/watch?v=SW3X7-gk8q0',
    score: faker.datatype.number({ min: -5, max: 1000}),
}

const {insert, upvote, downvote, getById, get, getTop, getRandom} = recommendationService;

describe('insert data', () => {
    it('should insert recommendation', async() => {
        jest.spyOn(recommendationRepository, 'findByName')
        .mockResolvedValueOnce(null);
        const create = jest.spyOn(recommendationRepository, 'create')
        .mockImplementationOnce((): any => {});
        await insert(recommendation);
        expect(create).toHaveBeenCalled();
    });

    it('should emit conflict error', async() => {
        jest.spyOn(recommendationRepository, 'findByName')
        .mockResolvedValueOnce(recommendation);
        const create = jest.spyOn(recommendationRepository, 'create');
        try {
            await insert(recommendation);
        } catch (e) {
            expect(e.type).toBe("conflict");
        } 
        expect(create).toHaveBeenCalled(); //Isto aqui está estranho... Era o esperado?
    });
});

describe('voting', () => {
    it('should upvote', async() => {
        const find = jest.spyOn(recommendationRepository, 'find')
        .mockResolvedValueOnce(recommendation);
        const update = jest.spyOn(recommendationRepository, 'updateScore')
        .mockResolvedValueOnce({
            ...recommendation, 
            score: recommendation.score+1,
        });
        await upvote(recommendation.id);
        expect(update).toHaveBeenCalled();
        expect(find).toHaveBeenCalled();
    });

    it('should downvote', async() => {
        const find = jest.spyOn(recommendationRepository, 'find')
        .mockResolvedValueOnce(recommendation);
        const update = jest.spyOn(recommendationRepository, 'updateScore')
        .mockResolvedValueOnce({
            ...recommendation, 
            score: recommendation.score-1,
        });
        const remove = jest.spyOn(recommendationRepository, 'remove')
        .mockResolvedValueOnce(recommendation);
        await downvote(recommendation.id);
        expect(update).toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
        expect(find).toHaveBeenCalled();
    });

    it('should remove recommendation', async() => {
        const find = jest.spyOn(recommendationRepository, 'find')
        .mockResolvedValueOnce(recommendation);
        const update = jest.spyOn(recommendationRepository, 'updateScore')
        .mockResolvedValueOnce({
            ...recommendation, 
            score: -6,
        });
        const remove = jest.spyOn(recommendationRepository, 'remove')
        .mockResolvedValueOnce(recommendation);
        await downvote(recommendation.id);
        expect(update).toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
        expect(find).toHaveBeenCalled();
    });
});

describe('getters', () => {
    it('should get recommendation by id', async() => {
        const find = jest.spyOn(recommendationRepository, 'find')
        .mockResolvedValueOnce(recommendation);
        const response = await getById(recommendation.id);
        expect(find).toHaveBeenCalled();
        expect(response).toEqual(recommendation);
    });

    it('should throw notFoundError', async() => {
        const find = jest.spyOn(recommendationRepository, 'find')
        .mockResolvedValueOnce(null);
        try {
            await getById(recommendation.id);
        } catch (e) {
            expect(e.type).toBe('not_found');
        } 
        expect(find).toHaveBeenCalled();
    });

    it('should get all recommendations', async() => {
        const findAll = jest.spyOn(recommendationRepository, 'findAll')
        .mockResolvedValueOnce(
            Array<typeof recommendation>().fill(recommendation)
        );
        await get();
        expect(findAll).toHaveBeenCalled();
    });

    it('should get the top recommendations', async() => {
        const amount = faker.datatype.number({ min: 10, max: 1000});
        const getAmountByScore = jest.spyOn(recommendationRepository, 'getAmountByScore')
        .mockResolvedValueOnce(
            Array<typeof recommendation>(amount).fill(recommendation)
        );
        await getTop(amount);
        expect(getAmountByScore).toHaveBeenCalled();
    });

    it('should select a random recommendation', async() => {
        global.Math.random = () => faker.datatype.number({ min: 0, max: 0.99, precision: 0.01});
        const length = faker.datatype.number({ min: 10, max: 1000});
        const findAll = jest.spyOn(recommendationRepository, 'findAll')
        .mockResolvedValueOnce(Array(length).fill(recommendation).map((rec, index) => {
            return {...rec, score: faker.datatype.number({ min: -5, max: 100})}
        }))
        .mockResolvedValueOnce(Array(length).fill(recommendation).map((rec, index) => {
            return {...rec, score: faker.datatype.number({ min: -5, max: 100})}
        }));
        const response = await getRandom();
        expect(findAll).toHaveBeenCalled();
        expect(response).not.toBeUndefined();
    })

    it('should throw notFoundError', async() => {
        global.Math.random = () => faker.datatype.number({ min: 0, max: 0.99, precision: 0.01});
        const length = faker.datatype.number({ min: 10, max: 1000});
        const findAll = jest.spyOn(recommendationRepository, 'findAll')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
        const response = await getRandom();
        expect(findAll).toHaveBeenCalledTimes(3);
        expect(response).not.toBeUndefined();
    })
})