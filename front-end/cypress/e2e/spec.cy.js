/// <reference types="cypress"/>

const apiBaseUrl = "http://localhost:5000";
const baseUrl = "http://localhost:3000";
const recommendation = {
  name: 'Go Go Power Rangers・Ricardo Cruz',
  youtubeLink: 'https://www.youtube.com/watch?v=zODMdZSuZf4'
}
const recommendations = [
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
  },
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

afterEach(() => {
  cy.request("POST", `${apiBaseUrl}/reset`,{});
})

describe('input testing', () => {
  it('should create a new element', () => {
    cy.request("POST", `${apiBaseUrl}/reset`,{});
    cy.visit(`${baseUrl}`);
    cy.get('[placeholder="Name"]').should('exist')
    .type(recommendation.name);
    cy.get('[placeholder="https://youtu.be/..."]').should('exist')
    .type(recommendation.youtubeLink);
    cy.intercept("POST", `${apiBaseUrl}/recommendations`)
    .as("createRecommendation");
    cy.intercept("GET", `${apiBaseUrl}/recommendations`)
    .as("getRecommendations");
    cy.get('button').should('exist').click();
    cy.wait("@createRecommendation").then((xhr) => {
      expect(xhr.response.statusCode).be.eq(201);
    });
    cy.wait("@getRecommendations").then((xhr) => {
      expect(xhr.response.statusCode).be.eq(200);
      expect(xhr.response.body).has.property('length');
      cy.contains(recommendation.name);
    });
  });
  it('should not create a new element', () => {
    cy.request("POST", `${apiBaseUrl}/reset`,{});
    cy.visit(`${baseUrl}`);
    cy.intercept("POST", `${apiBaseUrl}/recommendations`)
    .as("createRecommendation");
    cy.intercept("GET", `${apiBaseUrl}/recommendations`)
    .as("getRecommendations");
    cy.get('button').should('exist').click();
    cy.wait("@createRecommendation").then((xhr) => {
      expect(xhr.response.statusCode).be.eq(422);
    });
    cy.wait("@getRecommendations").then((xhr) => {
      cy.contains('No recommendations yet!');
    });
  })
});

describe('voting', () => {
  it('should upvote a video', () => {
    cy.request(
      "POST", 
      `${apiBaseUrl}/recommendations`,
      recommendation
    ).then((response) => {
      expect(response.status).be.eq(201);
      cy.intercept("GET", `${apiBaseUrl}/recommendations`)
      .as("getRecommendations");
      cy.visit(`${baseUrl}`);
      cy.wait("@getRecommendations").then(() => {
        cy.intercept("POST", `${apiBaseUrl}/recommendations/**/upvote`)
        .as("upvote");
        cy.get('article:first').should('exist');
        cy.get('article:first > div:nth-child(3) > svg:first')
        .click();
        cy.wait('@upvote').then((xhr) => {
          expect(xhr.response.statusCode).be.eq(200);
          cy.wait('@getRecommendations').then((xhr) => {
            expect(xhr.response.statusCode).be.eq(200);
            cy.get('article:first > div:nth-child(3)')
            .should((elem) => expect(elem.text()).to.equal('1'));
          })
        })
      });
    });
  })
  it('should downvote a video', () => {
    cy.request(
      "POST", 
      `${apiBaseUrl}/recommendations`,
      recommendation
    ).then((response) => {
      expect(response.status).be.eq(201);
      cy.intercept("GET", `${apiBaseUrl}/recommendations`)
      .as("getRecommendations");
      cy.visit(`${baseUrl}`);
      cy.wait("@getRecommendations").then(() => {
        cy.intercept("POST", `${apiBaseUrl}/recommendations/**/downvote`)
        .as("downvote");
        cy.get('article:first').should('exist');
        cy.get('article:first > div:nth-child(3) > svg:nth-child(2)')
        .click();
        cy.wait('@downvote').then((xhr1) => {
          expect(xhr1.response.statusCode).be.eq(200);
          cy.wait('@getRecommendations').then((xhr2) => {
            expect(xhr2.response.statusCode).be.eq(200);
            cy.get('article:first > div:nth-child(3)')
            .should((elem) => expect(elem.text()).to.equal('-1'));
          })
        })
      });
    });
  })
  it('should remove a video', () => {
    cy.request(
      "POST", 
      `${apiBaseUrl}/recommendations`,
      recommendation
    ).then((response) => {
      expect(response.status).be.eq(201);
      cy.intercept("GET", `${apiBaseUrl}/recommendations`)
      .as("getRecommendations");
      cy.visit(`${baseUrl}`);
      cy.wait("@getRecommendations");
      cy.intercept("POST", `${apiBaseUrl}/recommendations/**/downvote`)
      .as("downvote");
      cy.get('article:first').should('exist');
      for (let i = 0; i < 6; i++) {
        cy.get('article:first > div:nth-child(3) > svg:nth-child(2)')
        .click();
      }
      cy.wait('@downvote').then((xhr) => {
        expect(xhr.response.statusCode).be.eq(200)
        cy.wait('@getRecommendations').then((xhr) => {
          expect(xhr.response.statusCode).be.eq(200);
        })
      })
      cy.contains('No recommendations yet!');
    });
  })
});

describe('random', () => {
  it('should receive a song', () => {
      recommendations.forEach(async (rec) => {
        cy.request('POST', `${apiBaseUrl}/recommendations`,rec);
      })
      cy.intercept("GET",`${apiBaseUrl}/recommendations/random`)
      .as("getRandomRecommendations");
      cy.visit(`${baseUrl}/random`);
      cy.wait("@getRandomRecommendations").then((xhr) => {
        expect(xhr.response.statusCode).be.eq(200);
        cy.get("article").should('exist');
      });
  })
});

describe('top', () => {
  it('should receive top songs in descendent order', () => {
    recommendations.forEach(async (rec) => {
      cy.request('POST', `${apiBaseUrl}/recommendations`,rec);
    })
    cy.intercept("GET",`${apiBaseUrl}/recommendations/top/**`)
    .as("getRandomRecommendations");
    cy.visit(`${baseUrl}/top`);
    cy.wait("@getRandomRecommendations").then((xhr) => {
      expect(xhr.response.statusCode).be.eq(200);
      cy.get("article").should('exist').should('have.length',10);
    });
  })
})