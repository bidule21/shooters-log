'use strict';

process.env.APP_SECRET = process.env.APP_SECRET || 'Im a secret!!!!!';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/db';

// npm
const expect = require('chai').expect;
const request = require('superagent-use');
const superPromise = require('superagent-promise-plugin');
const debug = require('debug')('shooter: match test');

const UserSchema = require('../model/user-model');
const userController = require('../controller/auth-controller');
const compController = require('../controller/competition-controller');
const matchController = require('../controller/match-controller');

const port = process.env.PORT || 3000;

const baseUrl = `http://localhost:${port}/api`;
const server = require('../server');
request.use(superPromise);

describe('testing the match route', function(){ //setting up our server
  before((done) => {
    debug('before-block-match-test');
    if(!server.isRunning) {
      server.listen(port, () => {
        server.isRunning = true;
        console.log('server up on port:', port);
        done();
      });
      return;
    }
    done();
  });

  after((done) => {
    debug('after-block-match-test');
    if(server.isRunning) {
      server.close(() => {
        server.isRunning = false;
        console.log('server is down');
        done();
      });
      return;
    }
    done();
  });

  describe('testing POST route', function(){
    before((done) => { // creating our test resources
      debug('before-block-post-match');
      //userController.newUser({username:'McTest', password: 'pass'})
      var user = new UserSchema({username: 'McTest', password: 'pass'});
      userController.newUser({username: user.username, password: user.password})
      .then( token => {
        this.tempToken = token;
        compController.createCompetition({
          user_id: user._id,
          location: 'test range',
          action: 'to test'
        })
        .then(competition => {
          this.tempCompetition = competition;
          done();
        }).catch(done);
      }).catch(done);
    });

    after((done)=>{
      debug('POST-after-block');
      Promise.all([
        compController.removeAllCompetition(),
        matchController.removeAllMatches(),
        userController.removeAllUsers()
      ])
      .then(() => done())
      .catch(done);
    });

    it('should return a match', (done) => {
      debug('match POST route');
      request.post(`${baseUrl}/competition/:${this.tempCompetition._id}/match`)
      .send({
        userId: this.tempCompetition.user_id,
        competitionId: this.tempCompetition._id,
        matchNumber: 1
      })
      .set({Authorization: `Bearer ${this.tempToken}`})
      .then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.competitionId).to.equal(`${this.tempCompetition._id}`);
        expect(res.body.matchNumber).to.equal(1);
        done();
      }).catch(done);
    });
  });
});