/**
 * Created by n_andrade on 10/27/2016.
 */
const debug = require('debug')("app:component:peopleTracker"),
      request = require("request");

var peopleTracker = function(cfg){

    let pollInterval = 2000;
    let usernames = cfg.peopleTracker.usernames;

    let status = {
        isAlone: true,
        sinceWhen: new Date()
    }

    let rawResponse = getDefaultResponse();
    let locativeUrl = "http://" + cfg.peopleTracker.locative.host + ":" + cfg.peopleTracker.locative.port + ""

    function getDefaultResponse(){
      return { status: -1, body: { status: { uptime: 0 }, presence: { anyoneAtHome: false, users: [] } } }
    }

    function queryService(){
      request(locativeUrl, function(error, response, body){

        if(error){
          rawResponse = getDefaultResponse();
          return
        }

        rawResponse.status = response.statusCode;
        rawResponse.body = JSON.parse(body);
        debug(rawResponse.body.presence);
      })
    }

    this.decideIfHomeIsAloneOrNot = function() {
        return rawResponse.body.presence.anyoneAtHome != true
    }

    this.getStatus = function(){
      debug("RETURNING HOME STATUS");
      return { home: { isAlone: !rawResponse.body.presence.anyoneAtHome }}
    }

    this.isHomeAlone = function(){
      return !rawResponse.body.presence.anyoneAtHome
    }

    this.isAnyoneAtHome = function(){
      return rawResponse.body.presence.anyoneAtHome
    }

    this.getHomeStatus = function(){
        result = {
            home: !this.getStatus().home.isAlone
        };
        return result;
    }

    this.start = function(app){
        if(this.app !== undefined){
            return this;
        }
        this.app = app;

        setInterval(function(){
          queryService();
        }, 4000)

        this.app.internalEventEmitter.emit("componentStarted", "peopleTracker");
        return this;
    }
}

module.exports = peopleTracker;
