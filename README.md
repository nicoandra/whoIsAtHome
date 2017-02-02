# whoIsAtHome
Service that will ping devices in the local network to let you know who's online.

# In progress:
* Implement an event-based system.
    * When the house finds out there's nobody at home, it will trigger an event
    * When the house finds out there's someone at home, it will trigger an event
    * When the night starts or ends, an event will be triggered.
    * Depending on the status of the house and the time of day, lights will turn on or off.


#To do
-Make it so the programs are loaded from a JSON file
-Make it so lights are loaded from a JSON file
-Make it so heaters are loaded from a JSON file
-Know the id of the Active Program. Tell the interface whats the active program. Let the program brightness to be changed when it's active.
-Thermostat App; make it so it checks periodically against the server. Reason is that heaters is a critical service. It's OK sending data TO the heaters, but it would be better if the heaters can also pull the data to ensure the status is properly set.