/**
 * Created by n_andrade on 10/27/2016.
 */
const debug = require('debug')("app:component:peopleTracker"),
      request = require("request");

var peopleTracker = function(cfg){
    let pollInterval = 2000;
    let devices = cfg.peopleTracker.usernames;
    let usernames = Object.keys(cfg.peopleTracker.usernames);

    let rawResponse = getDefaultResponse();
    let locativeUrl = "http://" + cfg.peopleTracker.locative.host + ":" + cfg.peopleTracker.locative.port + ""
    let urls = {}


    debug(devices, usernames);
    usernames.forEach(( username) => {
      let device = devices[username]
      debug("Listed" , username, devices[username])

      request.post({ url : locativeUrl, form: { username , devicename: device} } ,  (error, response, body) => {
        if(error){
          return ;
        }
        urls = JSON.parse(body);
      })
    });

    function getDefaultResponse(){
      return { status: -1, body: { status: { uptime: 0 }, presence: { anyoneAtHome: false, users: [] } } }
    }

    this.setStatusFromResponse = function(receivedResponse) {
      debug("***************************************** SETTING STATUS!!!!!")
      if(rawResponse.body.presence.anyoneAtHome != receivedResponse.body.presence.anyoneAtHome){
        debug("***************************************** EVENT THROWN")
        debug("Event thrown: home:presence:statusChange !!!!!!!!!!!!!!", this.app.internalEventEmitter.eventNames())
        this.app.internalEventEmitter.emit("home:presence:statusChange", receivedResponse);
      }
      rawResponse = receivedResponse
    }

    this.queryService = function(){
      request(locativeUrl, function(error, response, body){

        if(error){
          return this.setStatusFromResponse(getDefaultResponse())
        }
        return this.setStatusFromResponse({status: response.statusCode, body: JSON.parse(body)})
      }.bind(this))
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
      return this.getStatus();
    }

    this.getUrls = function(){
      return JSON.parse(JSON.stringify(urls))
    }

    this.setAsAtHome = function(username){
      request.get("http://" +  cfg.peopleTracker.locative.host + urls.in);
    }

    this.setAsAway = function(username){
        request.get("http://" +  cfg.peopleTracker.locative.host + urls.out);
    }

    this.start = function(app){
        if(this.app !== undefined){
            return this;
        }
        this.app = app;

        setInterval(function(){
          this.queryService();
        }.bind(this), 4000)

        this.app.internalEventEmitter.emit("componentStarted", "peopleTracker");
        return this;
    }
}

module.exports = peopleTracker;
